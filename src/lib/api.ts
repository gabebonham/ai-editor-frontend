const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch?: string;
}

export const api = {
  projects: {
    list: () => request<Project[]>('/projects'),
    create: (data: CreateProjectPayload) =>
      request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/projects/${id}`, { method: 'DELETE' }),
  },

  // ── Prompt ────────────────────────────────────────────────────────────────

  prompt: {
    send: (payload: {
      projectId: string;
      prompt: string;
      context?: { url?: string; title?: string };
    }) =>
      request<{
        changeId: string;
        summary: string;
        confidence: number;
        changes: { path: string; content: string; description: string }[];
        diff: string;
      }>('/prompt', { method: 'POST', body: JSON.stringify(payload) }),
  },

  // ── Apply ─────────────────────────────────────────────────────────────────

  apply: {
    submit: (payload: {
      projectId: string;
      changeId: string;
      summary: string;
      changes: { path: string; content: string; description: string }[];
    }) =>
      request<{
        prUrl: string;
        prNumber: number;
        branch: string;
        changeId: string;
        message: string;
      }>('/apply', { method: 'POST', body: JSON.stringify(payload) }),
  },
};
