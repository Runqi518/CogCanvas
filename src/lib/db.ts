import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { SCHEMA_VERSION, type CanvasProject } from '../types';
import { cloud } from './api';

interface CogCanvasDB extends DBSchema {
  projects: {
    key: string;
    value: CanvasProject;
    indexes: { 'by-updatedAt': number };
  };
}

const DB_NAME = 'cogcanvas';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CogCanvasDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CogCanvasDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('by-updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

/** 读取时做数据迁移，保证旧数据结构可平滑升级。 */
function migrate(project: CanvasProject): CanvasProject {
  const p = { ...project };
  if (p.schemaVersion == null) p.schemaVersion = SCHEMA_VERSION;
  if (!p.mode) p.mode = 'diverge';
  if (!Array.isArray(p.nodes)) p.nodes = [];
  p.nodes = p.nodes.map((node) => ({ ...node, longForm: node.longForm ?? '' }));
  if (!Array.isArray(p.edges)) p.edges = [];
  return p;
}

export async function listProjects(): Promise<CanvasProject[]> {
  const db = await getDB();
  const local = (await db.getAll('projects')).map(migrate);
  try {
    const remote = (await cloud.listProjects()).map(migrate);
    const merged = new Map(local.map((project) => [project.id, project]));
    for (const project of remote) {
      const current = merged.get(project.id);
      if (!current || project.updatedAt > current.updatedAt) merged.set(project.id, project);
    }
    await Promise.all([...merged.values()].map((project) => db.put('projects', project)));
    return [...merged.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return local.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export async function getProject(id: string): Promise<CanvasProject | undefined> {
  const db = await getDB();
  const local = await db.get('projects', id);
  try {
    const remote = migrate(await cloud.getProject(id));
    if (!local || remote.updatedAt > local.updatedAt) {
      await db.put('projects', remote);
      return remote;
    }
  } catch {
    // Offline-first: IndexedDB remains the source when the API is unavailable.
  }
  return local ? migrate(local) : undefined;
}

export async function saveProject(project: CanvasProject): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
  try {
    await cloud.saveProject(project);
  } catch {
    // Local save has succeeded; the next write/list refresh retries cloud sync.
  }
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
  try {
    await cloud.deleteProject(id);
  } catch {
    // Keep deletion responsive while offline.
  }
}
