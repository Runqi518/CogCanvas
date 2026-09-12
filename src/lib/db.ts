import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { SCHEMA_VERSION, type CanvasProject } from '../types';
import { backend } from './api';

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
  if (!Array.isArray(p.edges)) p.edges = [];
  return p;
}

export async function listProjects(): Promise<CanvasProject[]> {
  const db = await getDB();
  const all = await db.getAll('projects');
  try {
    const remote = await backend.list();
    const merged = new Map(all.map((project) => [project.id, project]));
    for (const project of remote) {
      const local = merged.get(project.id);
      if (!local || project.updatedAt > local.updatedAt) {
        merged.set(project.id, project);
        await db.put('projects', project);
      }
    }
    return [...merged.values()].map(migrate).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return all.map(migrate).sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export async function getProject(id: string): Promise<CanvasProject | undefined> {
  const db = await getDB();
  const p = await db.get('projects', id);
  try {
    const remote = await backend.get(id);
    if (!p || remote.updatedAt > p.updatedAt) await db.put('projects', remote);
    return migrate(!p || remote.updatedAt > p.updatedAt ? remote : p);
  } catch {
    return p ? migrate(p) : undefined;
  }
}

export async function saveProject(project: CanvasProject): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
  backend.save(project).catch(() => undefined);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
  backend.remove(id).catch(() => undefined);
}
