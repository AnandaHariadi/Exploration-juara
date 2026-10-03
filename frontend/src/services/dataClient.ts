import type {
  ActualCostItem,
  Alert,
  ChangeRequest,
  Project,
  ProjectEvent,
  UserPersonaId,
} from '@/types';

/**
 * Contract used by pages and components. Reads and writes are asynchronous so
 * a server API can replace the browser adapter without changing page layouts.
 *
 * Semua operasi melempar Error berisi pesan dari server bila gagal. Pemanggil
 * wajib menampilkan pesannya; kegagalan tidak boleh tampak seperti data kosong.
 */
export interface ClaraDataSource {
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getAllAlerts(): Promise<Alert[]>;
  getActivePersona(): Promise<UserPersonaId>;
  addProject(project: Project): Promise<void>;
  addProjectEvent(
    projectId: string,
    event: Omit<ProjectEvent, 'id' | 'projectId'> & { milestoneId?: string },
  ): Promise<Project>;
  addActualCost(projectId: string, cost: Omit<ActualCostItem, 'id' | 'projectId'>): Promise<Project>;
  addChangeRequest(projectId: string, request: Omit<ChangeRequest, 'id' | 'projectId' | 'createdAt' | 'status'>): Promise<Project>;
  approveChangeRequest(projectId: string, requestId: string): Promise<Project>;
  createInvoice(projectId: string, milestoneId: string): Promise<Project>;
  recordPayment(projectId: string, invoiceId: string, paymentDate?: string): Promise<Project>;
  acknowledgeAlert(alertId: string): Promise<void>;
  setActivePersona(persona: UserPersonaId): Promise<void>;
  /** withSeed=true (default) memulihkan proyek contoh; false mengosongkan semua proyek. */
  resetDemo(withSeed?: boolean): Promise<void>;
  subscribeData(listener: () => void): () => void;
  subscribePersona(listener: () => void): () => void;
}

const subscribe = (eventName: string, listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
};

const notifyData = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('clara_data_updated'));
};

const notifyPersona = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('clara_persona_changed'));
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Kirim request ke API dan pastikan keberhasilannya. Respons non-2xx, body
 * bukan JSON, atau success=false selalu menjadi ApiError.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.', 0);
  }

  let json: ApiEnvelope<T> | undefined;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = undefined;
  }

  if (!res.ok || !json || !json.success) {
    throw new ApiError(json?.error || `Permintaan gagal (HTTP ${res.status}).`, res.status);
  }
  return json.data as T;
}

const postJson = <T>(url: string, body?: unknown) =>
  request<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/**
 * SQLite Server API Data Source
 * Connects directly to Next.js server Route Handlers backed by clara.db (SQLite)
 */
const apiDataSource: ClaraDataSource = {
  async getProjects() {
    // Saat build/SSR tidak ada server API yang dapat dipanggil dari klien.
    if (typeof window === 'undefined') return [];
    return request<Project[]>('/api/projects');
  },

  async getProject(id) {
    if (typeof window === 'undefined') return undefined;
    try {
      return await request<Project>(`/api/projects/${id}`);
    } catch (error) {
      // 404 berarti proyek memang tidak ada; kegagalan lain tetap dilempar.
      if (error instanceof ApiError && error.status === 404) return undefined;
      throw error;
    }
  },

  async getAllAlerts() {
    if (typeof window === 'undefined') return [];
    return request<Alert[]>('/api/alerts');
  },

  async getActivePersona() {
    if (typeof window === 'undefined') return 'BUDI';
    const session = await request<{ activePersonaId: UserPersonaId }>('/api/demo/session');
    return session.activePersonaId;
  },

  async addProject(project) {
    await postJson<Project>('/api/projects', project);
    notifyData();
  },

  async addProjectEvent(projectId, event) {
    const project = await postJson<Project>(`/api/projects/${projectId}/events`, event);
    notifyData();
    return project;
  },

  async addActualCost(projectId, cost) {
    const project = await postJson<Project>(`/api/projects/${projectId}/costs`, cost);
    notifyData();
    return project;
  },

  async addChangeRequest(projectId, changeRequest) {
    const project = await postJson<Project>(`/api/projects/${projectId}/change-requests`, changeRequest);
    notifyData();
    return project;
  },

  async approveChangeRequest(projectId, requestId) {
    const project = await postJson<Project>(
      `/api/projects/${projectId}/change-requests/${requestId}/approve`,
    );
    notifyData();
    return project;
  },

  async createInvoice(projectId, milestoneId) {
    const project = await postJson<Project>(`/api/projects/${projectId}/invoices`, { milestoneId });
    notifyData();
    return project;
  },

  async recordPayment(projectId, invoiceId, paymentDate) {
    const project = await postJson<Project>(`/api/projects/${projectId}/payments`, { invoiceId, paymentDate });
    notifyData();
    return project;
  },

  async acknowledgeAlert(alertId) {
    await postJson<unknown>(`/api/alerts/${alertId}/acknowledge`);
    notifyData();
  },

  async setActivePersona(persona) {
    await postJson<unknown>('/api/demo/session', { personaId: persona });
    notifyPersona();
  },

  async resetDemo(withSeed = true) {
    await postJson<unknown>('/api/demo/reset', { withSeed });
    notifyData();
    notifyPersona();
  },

  subscribeData(listener) {
    return subscribe('clara_data_updated', listener);
  },

  subscribePersona(listener) {
    return subscribe('clara_persona_changed', listener);
  },
};

// Connected to SQLite API
export const dataClient: ClaraDataSource = apiDataSource;
