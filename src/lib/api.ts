const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// ── Unauthorized handler ──────────────────────────────────────────────────────

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

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

type RequestOptions = RequestInit & {
  silent401?: boolean;
};

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const { silent401, ...fetchOptions } = options ?? {};
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (res.status === 401) {
    if (!silent401) {
      clearToken();
      onUnauthorized?.();
    }
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

// ── Widget / Snippet types ────────────────────────────────────────────────────

export interface FileChangeDiff {
  path: string;
  original: string;
  modified: string;
  description: string;
}

export interface WidgetPreviewResult {
  projectId: string;
  widgetCode: string;
  scriptTag: string;
  files: FileChangeDiff[];
}

export interface WidgetInjectResult {
  projectId: string;
  prUrl: string;
  prNumber: number;
  branch: string;
  filesChanged: string[];
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
      request<User>('/auth/me', { silent401: true }),

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
    // Pass projectId so the OAuth callback can link the token to the project automatically
    authorizeUrl: (projectId?: string) => {
      const base = `${BASE}/github/oauth/authorize`;
      return projectId ? `${base}?projectId=${encodeURIComponent(projectId)}` : base;
    },
  },

  // ── Snippet / Widget ───────────────────────────────────────────────────────

  snippet: {
    // Step 1 — Generate widget + diff WITHOUT creating a PR (for review screen)
    preview: (projectId: string, cdnUrl?: string) =>
      request<WidgetPreviewResult>('/snippet/preview', {
        method: 'POST',
        body: JSON.stringify({ projectId, ...(cdnUrl ? { cdnUrl } : {}) }),
      }),

    // Step 2 — Actually create the PR after user approves the preview
    inject: (projectId: string, cdnUrl?: string) =>
      request<WidgetInjectResult>('/snippet/inject', {
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
