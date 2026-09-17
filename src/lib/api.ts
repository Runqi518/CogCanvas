import type { CanvasProject } from '../types';

const API = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const cloud = {
  listProjects: () => request<CanvasProject[]>('/projects'),
  getProject: (id: string) => request<CanvasProject>(`/projects/${id}`),
  saveProject: (project: CanvasProject) => request<CanvasProject>(`/projects/${project.id}`, {
    method: 'PUT', body: JSON.stringify(project),
  }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
};

export interface RagResult {
  id: string;
  projectId: string | null;
  projectName: string;
  nodeId: string;
  kind?: 'material' | 'memory';
  text: string;
  score: number;
  retrievalMode?: 'embedding' | 'sparse';
}

export const backend = {
  search: (query: string, projectId?: string) =>
    request<RagResult[]>('/rag/search', {
      method: 'POST',
      body: JSON.stringify({ query, projectId }),
    }),
};
