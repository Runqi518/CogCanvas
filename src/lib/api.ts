import type { CanvasProject } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export const backend = {
  list: () => request<CanvasProject[]>('/projects'),
  get: (id: string) => request<CanvasProject>(`/projects/${encodeURIComponent(id)}`),
  save: (project: CanvasProject) => request<CanvasProject>(`/projects/${encodeURIComponent(project.id)}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  }),
  remove: (id: string) => request<{ ok: boolean }>(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  search: (query: string, projectId?: string) => request<RagResult[]>('/rag/search', {
    method: 'POST',
    body: JSON.stringify({ query, projectId }),
  }),
};

export interface RagResult {
  id: string;
  projectId: string;
  projectName: string;
  nodeId: string;
  text: string;
  score: number;
  retrievalMode?: 'embedding' | 'sparse';
}
