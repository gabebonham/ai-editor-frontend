const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// ── Token management ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'liveedit_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── HTTP client ───────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message ?? err.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  snippetInjected: boolean;
  userId?: string;
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch?: string;
  githubToken?: string;
}

export interface FileChange {
  path: string;
  content: string;
  description: string;
}

export interface PromptResult {
  changeId: string;
  summary: string;
  confidence: number;
  changes: FileChange[];
  diff: string;
}

export interface ApplyResult {
  prUrl: string;
  prNumber: number;
  branch: string;
  changeId: string;
  message: string;
}

export interface Exploration {
  id: string;
  userId: string;
  siteUrl: string;
  siteTitle?: string;
  name?: string;
  prompt: string;
  summary: string;
  operations: Record<string, unknown>[];
  createdAt: string;
}

export interface SaveExplorationPayload {
  siteUrl: string;
  siteTitle?: string;
  name?: string;
  prompt: string;
  summary: string;
  operations: Record<string, unknown>[];
  htmlSnapshot?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const api = {

  // ── Auth ───────────────────────────────────────────────────────────────────

  auth: {
    register: (email: string, password: string) =>
      request<void>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    login: (email: string, password: string) =>
      request<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      request<void>('/auth/logout', { method: 'POST' }),

    check: () =>
      request<void>('/auth/check'),

    me: () =>
      request<User>('/auth/me'),

    updateApiKey: (anthropicApiKey: string) =>
      request<void>('/auth/api-key', {
        method: 'POST',
        body: JSON.stringify({ anthropicApiKey }),
      }),
  },

  // ── Projects ───────────────────────────────────────────────────────────────

  projects: {
    list: () => request<Project[]>('/projects'),
    create: (data: CreateProjectPayload) =>
      request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    findOne: (id: string) => request<Project>(`/projects/${id}`),
    delete: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  },

  // ── Prompt ─────────────────────────────────────────────────────────────────

  prompt: {
    send: (payload: {
      projectId: string;
      prompt: string;
      context?: { url?: string; title?: string };
    }) => request<PromptResult>('/prompt', { method: 'POST', body: JSON.stringify(payload) }),
  },

  // ── Apply ──────────────────────────────────────────────────────────────────

  apply: {
    submit: (payload: {
      projectId: string;
      changeId: string;
      summary: string;
      changes: FileChange[];
    }) => request<ApplyResult>('/apply', { method: 'POST', body: JSON.stringify(payload) }),
  },

  // ── GitHub OAuth ───────────────────────────────────────────────────────────

  github: {
    authorizeUrl: () => `${BASE}/github/oauth/authorize`,
  },

  // ── Snippet ────────────────────────────────────────────────────────────────

  snippet: {
    inject: (projectId: string, cdnUrl?: string) =>
      request<{
        projectId: string;
        prUrl: string;
        prNumber: number;
        branch: string;
        filesChanged: string[];
      }>('/snippet/inject', {
        method: 'POST',
        body: JSON.stringify({ projectId, ...(cdnUrl ? { cdnUrl } : {}) }),
      }),
  },

  // ── Explorations ───────────────────────────────────────────────────────────

  explorations: {
    save: (data: SaveExplorationPayload) =>
      request<Exploration>('/explorations', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request<Exploration[]>('/explorations'),
    findOne: (id: string) => request<Exploration>(`/explorations/${id}`),
    delete: (id: string) => request<void>(`/explorations/${id}`, { method: 'DELETE' }),
  },
};
