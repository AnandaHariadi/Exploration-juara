import type {
  AiHealth,
  Alert,
  LegalAnswer,
  PortfolioSummary,
  Project,
  ProjectEventType,
  UserPersonaId,
} from '@/types';

/**
 * The browser's only door to business data. Every call goes to a Next.js API
 * route; the server (SQLite + deterministic engine) is the single source of
 * truth. Failures always throw ApiError with the server's message — callers
 * must show it, never fall back to fake data.
 */

export class ApiError extends Error {
  constructor(message: string, public status: number, public code = 'ERROR') {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string } | string;
  message?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', ...init });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.', 0, 'NETWORK');
  }
  let json: ApiEnvelope<T> | undefined;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = undefined;
  }
  if (!res.ok || !json || !json.success) {
    const error = json?.error;
    const message = typeof error === 'string' ? error : error?.message;
    const code = typeof error === 'object' && error ? error.code : 'ERROR';
    throw new ApiError(message || `Permintaan gagal (HTTP ${res.status}).`, res.status, code);
  }
  return json.data as T;
}

const send = <T>(method: string, url: string, body?: unknown) =>
  request<T>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const notify = (name: string) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(name));
};
const DATA_EVENT = 'clara_data_updated';
const PERSONA_EVENT = 'clara_persona_changed';

/** Run a mutation and tell every mounted view to refetch on success. */
async function mutation<T>(run: () => Promise<T>): Promise<T> {
  const result = await run();
  notify(DATA_EVENT);
  return result;
}

const subscribe = (eventName: string, listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
};

export type MonitoringEventInput =
  | { type: Extract<ProjectEventType, 'PROGRESS_UPDATED'>; progress: number; projectedFinishDate?: string; title?: string; description?: string; date?: string }
  | { type: Extract<ProjectEventType, 'MILESTONE_COMPLETED'>; milestoneId: string; title?: string; description?: string; date?: string }
  | { type: Extract<ProjectEventType, 'REVISION_LOGGED'>; revisionCount: number; title?: string; description?: string; date?: string }
  | { type: Extract<ProjectEventType, 'SCOPE_ADDED'>; title: string; description?: string; date?: string };

export interface ChangeRequestInput {
  title: string;
  description?: string;
  reason?: string;
  additionalScope: string[];
  additionalValue: number;
  additionalRevisions: number;
  deadlineExtensionDays: number;
  submit?: boolean;
}

export const dataClient = {
  // Reads
  getProjects: () => request<Project[]>('/api/projects'),
  getProject: async (id: string): Promise<Project | undefined> => {
    try {
      return await request<Project>(`/api/projects/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return undefined;
      throw error;
    }
  },
  getAllAlerts: () => request<Alert[]>('/api/alerts'),
  getDashboardSummary: () => request<PortfolioSummary>('/api/dashboard/summary'),
  getAiHealth: () => request<AiHealth>('/api/ai/health'),
  getActivePersona: async () => (await request<{ activePersonaId: UserPersonaId }>('/api/demo/session')).activePersonaId,

  // Project setup
  createProject: (input: { name: string; client: string; useSample?: boolean }) => mutation(() => send<Project>('POST', '/api/projects', input)),
  updateProject: (id: string, input: { name?: string; client?: string }) => mutation(() => send<Project>('PATCH', `/api/projects/${id}`, input)),
  deleteProject: (id: string) => mutation(() => send<{ id: string }>('DELETE', `/api/projects/${id}`)),
  uploadDocument: (projectId: string, kind: 'CONTRACT' | 'RAB', file: File) =>
    mutation(() => {
      const form = new FormData();
      form.append('kind', kind);
      form.append('file', file);
      return request<{ project: Project }>(`/api/projects/${projectId}/documents`, { method: 'POST', body: form });
    }),
  attachSampleDocuments: (projectId: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/documents/sample`)),
  extract: (projectId: string, mode: 'AI' | 'SAMPLE' | 'MANUAL') => mutation(() => send<Project>('POST', `/api/projects/${projectId}/extract`, { mode })),
  updateCandidate: (projectId: string, patch: Record<string, unknown>) =>
    mutation(() => send<{ project: Project; validation: string[] }>('PUT', `/api/projects/${projectId}/baseline/candidate`, patch)),
  confirmBaseline: (projectId: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/baseline/confirm`)),

  // Monitoring
  addEvent: (projectId: string, event: MonitoringEventInput) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/events`, event)),
  reviewScope: (projectId: string, scopeId: string, note?: string) => mutation(() => send<Project>('PATCH', `/api/projects/${projectId}/scope/${scopeId}`, { decision: 'MATCH', note })),

  // Finance
  addCost: (projectId: string, cost: { amount: number; category: string; description: string; date?: string }) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/costs`, cost)),
  createInvoice: (projectId: string, milestoneId: string, amount?: number) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/invoices`, { milestoneId, amount })),
  recordPayment: (projectId: string, invoiceId: string, amount?: number) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/payments`, { invoiceId, amount })),

  // Change requests
  createChangeRequest: (projectId: string, input: ChangeRequestInput) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests`, input)),
  submitChangeRequest: (projectId: string, crId: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests/${crId}/submit`)),
  approveChangeRequest: (projectId: string, crId: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests/${crId}/approve`)),
  rejectChangeRequest: (projectId: string, crId: string, note?: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests/${crId}/reject`, { note })),

  // Alerts
  acknowledgeAlert: (alertId: string) => mutation(() => send<Alert>('POST', `/api/alerts/${alertId}/acknowledge`)),
  resolveAlert: (alertId: string, note: string) => mutation(() => send<Alert>('POST', `/api/alerts/${alertId}/resolve`, { note })),

  // AI
  askLegal: (question: string, projectId?: string, history: { role: 'user' | 'assistant'; content: string }[] = []) =>
    send<LegalAnswer & { projectId: string | null }>('POST', '/api/ai/query', { question, projectId, history }),

  // Demo
  setActivePersona: async (persona: UserPersonaId) => {
    await send('POST', '/api/demo/session', { personaId: persona });
    notify(PERSONA_EVENT);
  },
  resetDemo: async () => {
    await send('POST', '/api/demo/reset');
    notify(DATA_EVENT);
    notify(PERSONA_EVENT);
  },

  subscribeData: (listener: () => void) => subscribe(DATA_EVENT, listener),
  subscribePersona: (listener: () => void) => subscribe(PERSONA_EVENT, listener),
};

export const documentUrl = (projectId: string, documentId: string, page?: number | null) =>
  `/api/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}${page ? `#page=${page}` : ''}`;
