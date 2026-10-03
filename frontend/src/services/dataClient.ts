import type {
  AiHealth,
  Alert,
  DocumentKind,
  DraftType,
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
  previewRab: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ itemCount: number; total: number; warnings: string[] }>('/api/rab/preview', { method: 'POST', body: form });
  },
  createProject: (input: { name: string; client: string; useSample?: boolean; sampleBasis?: 'AGREEMENT' | 'BUDGET' | 'BOTH' }) => mutation(() => send<Project>('POST', '/api/projects', input)),
  updateProject: (id: string, input: { name?: string; client?: string }) => mutation(() => send<Project>('PATCH', `/api/projects/${id}`, input)),
  deleteProject: (id: string) => mutation(() => send<{ id: string }>('DELETE', `/api/projects/${id}`)),
  uploadDocument: (projectId: string, kind: DocumentKind, file: File) =>
    mutation(() => {
      const form = new FormData();
      form.append('kind', kind);
      form.append('file', file);
      return request<{ project: Project }>(`/api/projects/${projectId}/documents`, { method: 'POST', body: form });
    }),
  attachSampleDocuments: (projectId: string, samples?: string[]) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/documents/sample`, samples ? { samples } : {})),
  reanalyzeDocument: (projectId: string, documentId: string) => mutation(() => send<Project>('POST', '/api/ai/documents/review', { projectId, documentId })),
  decideDocument: (projectId: string, documentId: string, decision: 'APPROVED' | 'REJECTED', note?: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/documents/${documentId}/decision`, { decision, note })),
  recordInvoiceFromDocument: (projectId: string, documentId: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/documents/${documentId}/record-invoice`)),
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
  updateChangeRequest: (projectId: string, crId: string, patch: Partial<ChangeRequestInput>) => mutation(() => send<Project>('PATCH', `/api/projects/${projectId}/change-requests/${crId}`, patch)),
  submitChangeRequest: (projectId: string, crId: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests/${crId}/submit`)),
  financeReviewChangeRequest: (projectId: string, crId: string, note?: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests/${crId}/finance-review`, { note })),
  decideChangeRequest: (projectId: string, crId: string, decision: 'APPROVE' | 'REJECT', note?: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests/${crId}/decision`, { decision, note })),
  recordClientApproval: (projectId: string, crId: string, input: { decision: 'APPROVED' | 'REJECTED'; reference?: string; documentId?: string; note?: string }) =>
    mutation(() => send<Project>('POST', `/api/projects/${projectId}/change-requests/${crId}/client-approval`, input)),

  // Remediation Copilot / Document Studio
  draftChangeRequestFromAlert: (projectId: string, alertId: string) => mutation(() => send<{ project: Project; crId: string; draftId: string }>('POST', '/api/ai/change-requests/draft', { projectId, alertId })),
  generateDocument: (input: { projectId: string; type: DraftType; title?: string; instructions?: string; alertId?: string; changeRequestId?: string; originalClause?: string }) =>
    mutation(() => send<{ project: Project; draftId: string }>('POST', '/api/ai/documents/generate', input)),
  reviseDocument: (projectId: string, draftId: string, input: { instruction?: string; content?: string }) => mutation(() => send<Project>('POST', '/api/ai/documents/revise', { projectId, draftId, ...input })),
  approveDraft: (projectId: string, draftId: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/drafts/${draftId}/approve`)),
  rejectDraft: (projectId: string, draftId: string, note?: string) => mutation(() => send<Project>('POST', `/api/projects/${projectId}/drafts/${draftId}/reject`, { note })),
  /** Export an approved draft: downloads the PDF (or Markdown when the PDF renderer is down). */
  exportDraft: (projectId: string, draftId: string) =>
    mutation(async () => {
      let res: Response;
      try {
        res = await fetch(`/api/projects/${projectId}/drafts/${draftId}/export`, { method: 'POST' });
      } catch {
        throw new ApiError('Tidak dapat terhubung ke server.', 0, 'NETWORK');
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as ApiEnvelope<unknown> | null;
        const error = json?.error;
        throw new ApiError((typeof error === 'object' && error?.message) || `Ekspor gagal (HTTP ${res.status}).`, res.status);
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? 'draf.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return name;
    }),
  explainAlert: (alertId: string) => mutation(() => send<Alert>('POST', '/api/ai/anomalies/explain', { alertId })),

  // Alerts
  acknowledgeAlert: (alertId: string) => mutation(() => send<Alert>('POST', `/api/alerts/${alertId}/acknowledge`)),
  resolveAlert: (alertId: string, note: string) => mutation(() => send<Alert>('POST', `/api/alerts/${alertId}/resolve`, { note })),

  // AI
  askLegal: (question: string, projectId?: string, history: { role: 'user' | 'assistant'; content: string }[] = []) =>
    send<LegalAnswer & { projectId: string | null }>('POST', '/api/ai/legal/query', { question, projectId, history }),

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
