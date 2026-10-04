import path from 'path';
import fs from 'fs';
import os from 'os';
import type { Alert, PortfolioSummary, Project, UserPersonaId } from '../types/index';
import { USER_PERSONAS } from '../types/index';
import { actorFor, randomId, type Ctx } from './domain';
import { notFound } from './api';
import { reconcile } from './engine';

// Ensure data folder exists
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isServerless ? path.join(os.tmpdir(), 'clara-data') : path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storePath = path.join(dataDir, 'clara_store.json');
const bundledStorePath = path.join(process.cwd(), 'data', 'clara_store.json');

/**
 * Standard project sample from PRD for consistent testing
 */
export const SAMPLE_CONSISTENT_PROJECT: Project = {
  id: 'PRJ-101',
  name: 'Implementasi Core Logistics & Fleet Tracker',
  client: 'PT Astra Sahabat Logistik',
  status: 'ACTIVE',
  contractValue: 120000000,
  plannedCost: 75000000,
  actualCost: 64000000,
  billableValue: 30000000,
  billedValue: 30000000,
  paidValue: 30000000,
  progress: 45,
  baselineVersion: 'V1.0',
  startDate: '2026-08-01',
  endDate: '2026-12-31',
  activeRevisionCount: 2,
  agreementBaseline: {
    contractNumber: 'PKS/ASL/2026/089',
    title: 'Implementasi Core Logistics & Fleet Tracker',
    clientName: 'PT Astra Sahabat Logistik',
    contractValue: 120000000,
    startDate: '2026-08-01',
    deadline: '2026-12-31',
    paymentTerms: '25% DP (Rp 30 Jt), 35% UAT Delivery (Rp 42 Jt), 40% Go-Live (Rp 48 Jt)',
    revisionLimit: 3,
    scopeItems: [
      { id: 'SCP-01', title: 'GPS Fleet Tracking Gateway', description: 'Pelacakan real-time posisi armada truk', category: 'CORE_FEATURE', status: 'MATCH' },
      { id: 'SCP-02', title: 'Driver Telematics Integration', description: 'Integrasi IoT data akselerasi & konsumsi bahan bakar', category: 'INTEGRATION', status: 'MATCH' },
      { id: 'SCP-03', title: 'Logistics Command Dispatcher', description: 'Sistem alokasi rute pengiriman otomatis', category: 'CORE_FEATURE', status: 'MATCH' },
    ],
    milestones: [
      { id: 'MLS-01', title: 'Termin 1: Down Payment (25%)', percentage: 25, value: 30000000, targetDate: '2026-08-15', completionDate: '2026-08-14', status: 'COMPLETED', billingStatus: 'PAID', invoiceId: 'INV-2026-001' },
      { id: 'MLS-02', title: 'Termin 2: UAT Delivery (35%)', percentage: 35, value: 42000000, targetDate: '2026-10-30', status: 'IN_PROGRESS', billingStatus: 'UNBILLED' },
      { id: 'MLS-03', title: 'Termin 3: Go-Live & Retensi (40%)', percentage: 40, value: 48000000, targetDate: '2026-12-31', status: 'PENDING', billingStatus: 'UNBILLED' },
    ],
    clausesSummary: [
      { clauseNumber: 'Pasal 5', title: 'Batas Revisi', description: 'Maksimal 3 putaran revisi resmi tanpa adendum biaya.' },
      { clauseNumber: 'Pasal 8', title: 'Jatuh Tempo Pembayaran', description: 'Jatuh tempo 14 hari kalender setelah invoice resmi terbit.' },
      { clauseNumber: 'Pasal 9', title: 'Denda Keterlambatan', description: 'Denda 1 permil per hari keterlambatan pembayaran invoice.' },
    ],
  },
  planBaseline: {
    totalPlannedCost: 75000000,
    contingencyBudget: 3750000,
    items: [
      { id: 'RAB-1', category: 'Software Engineering', description: 'Backend & IoT Engineers', plannedAmount: 50000000, actualAmount: 42000000 },
      { id: 'RAB-2', category: 'Hardware & Cloud Cluster', description: 'Server hosting & Telematics gateway', plannedAmount: 18000000, actualAmount: 16000000 },
      { id: 'RAB-3', category: 'UAT & Quality Testing', description: 'UAT lapangan & audit keamanan', plannedAmount: 7000000, actualAmount: 6000000 },
    ],
  },
  actualCosts: [
    { id: 'CST-01', projectId: 'PRJ-101', date: '2026-08-20', category: 'DEVELOPMENT', description: 'Sprint 1 Core GPS tracker development', amount: 25000000, submittedBy: 'Siti Rahma' },
    { id: 'CST-02', projectId: 'PRJ-101', date: '2026-09-10', category: 'INFRASTRUCTURE', description: 'Penyewaan server cluster & gateway API', amount: 16000000, submittedBy: 'Siti Rahma' },
    { id: 'CST-03', projectId: 'PRJ-101', date: '2026-09-28', category: 'DEVELOPMENT', description: 'Sprint 2 Telematics integration', amount: 17000000, submittedBy: 'Siti Rahma' },
    { id: 'CST-04', projectId: 'PRJ-101', date: '2026-10-01', category: 'DEVELOPMENT', description: 'QA sprint preparation for UAT', amount: 6000000, submittedBy: 'Siti Rahma' },
  ],
  invoices: [
    {
      id: 'INV-2026-001',
      invoiceNumber: 'INV/2026/08/ASL-001',
      projectId: 'PRJ-101',
      milestoneId: 'MLS-01',
      milestoneTitle: 'Termin 1: Down Payment (25%)',
      amount: 30000000,
      status: 'PAID',
      issueDate: '2026-08-15',
      dueDate: '2026-08-29',
      paymentDate: '2026-08-25',
    },
  ],
  events: [
    {
      id: 'EVT-01',
      projectId: 'PRJ-101',
      type: 'MILESTONE_COMPLETED',
      title: 'Termin 1: Down Payment Diterima',
      description: 'Kas masuk termin awal telah diverifikasi masuk rekening perusahaan.',
      date: '2026-08-25',
      author: 'Siti Rahma (Finance)',
    },
    {
      id: 'EVT-02',
      projectId: 'PRJ-101',
      type: 'REVISION_LOGGED',
      title: 'Revisi Desain Dashboard Dispatcher Putaran #1',
      description: 'Penyesuaian tata letak peta pemantauan truk berdasarkan masukan tim operasional ASL.',
      date: '2026-09-15',
      author: 'Budi Santoso (PM)',
    },
    {
      id: 'EVT-03',
      projectId: 'PRJ-101',
      type: 'REVISION_LOGGED',
      title: 'Revisi Format Laporan Throughput Putaran #2',
      description: 'Penambahan kolom tonase muatan pada ekspor spreadsheet.',
      date: '2026-09-25',
      author: 'Budi Santoso (PM)',
    },
  ],
  documents: [],
  extraction: null,
  baselines: [],
  payments: [
    {
      id: 'PAY-2026-001',
      projectId: 'PRJ-101',
      invoiceId: 'INV-2026-001',
      invoiceNumber: 'INV/2026/08/ASL-001',
      amount: 30000000,
      date: '2026-08-25',
      recordedBy: 'Siti Rahma',
    },
  ],
  changeRequests: [],
  drafts: [],
  alerts: [],
  reconciliation: [],
  metrics: {
    hasBaseline: true,
    baselineVersion: 'V1.0',
    contractValue: 120000000,
    plannedCost: 75000000,
    actualCost: 64000000,
    budgetVariance: -11000000,
    budgetUtilization: 85.3,
    progress: 45,
    billableValue: 30000000,
    billedValue: 30000000,
    paidValue: 30000000,
    unbilledValue: 0,
    outstandingReceivable: 0,
    plannedProfit: 45000000,
    actualProfit: 56000000,
    actualProfitNote: 'Margin laba aman',
    includedRevisions: 3,
    actualRevisions: 2,
    revisionVariance: 0,
    deadline: '2026-12-31',
    projectedFinish: '2026-12-28',
    deadlineVarianceDays: 3,
    openAlerts: 0,
    newAlerts: 0,
    alertsByType: {
      BUDGET_VARIANCE: 0,
      SCOPE_VARIANCE: 0,
      BILLING_VARIANCE: 0,
      REVISION_LIMIT: 0,
      DEADLINE_RISK: 0,
      CONTRACT_RISK: 0,
      FINANCIAL_ANOMALY: 0,
      DOCUMENT_INCONSISTENCY: 0,
      POTENTIAL_IRREGULARITY: 0,
    },
    computedAt: '2026-10-01T08:00:00.000Z',
  },
};

interface ClaraStoreData {
  activePersona: UserPersonaId;
  demoUsers: Record<string, unknown>[];
  projects: Project[];
  meta: Record<string, string>;
}

function sanitizeProject(p: any): Project {
  if (!p) return p;
  p.documents = Array.isArray(p.documents) ? p.documents : [];
  p.baselines = Array.isArray(p.baselines) ? p.baselines : [];
  p.actualCosts = Array.isArray(p.actualCosts) ? p.actualCosts : [];
  p.invoices = Array.isArray(p.invoices) ? p.invoices : [];
  p.payments = Array.isArray(p.payments) ? p.payments : [];
  p.events = Array.isArray(p.events) ? p.events : [];
  p.changeRequests = Array.isArray(p.changeRequests) ? p.changeRequests : [];
  p.drafts = Array.isArray(p.drafts) ? p.drafts : [];
  p.alerts = Array.isArray(p.alerts) ? p.alerts : [];
  p.reconciliation = Array.isArray(p.reconciliation) ? p.reconciliation : [];
  p.extraction = p.extraction ?? null;
  if (!p.metrics) {
    p.metrics = {
      hasBaseline: Boolean(p.agreementBaseline),
      baselineVersion: p.baselineVersion || 'V1.0',
      contractValue: p.contractValue || 0,
      plannedCost: p.plannedCost || 0,
      actualCost: p.actualCost || 0,
      budgetVariance: (p.actualCost || 0) - (p.plannedCost || 0),
      budgetUtilization: p.plannedCost ? Math.round(((p.actualCost || 0) / p.plannedCost) * 1000) / 10 : null,
      progress: p.progress || 0,
      billableValue: p.billableValue || 0,
      billedValue: p.billedValue || 0,
      paidValue: p.paidValue || 0,
      unbilledValue: Math.max(0, (p.billableValue || 0) - (p.billedValue || 0)),
      outstandingReceivable: Math.max(0, (p.billedValue || 0) - (p.paidValue || 0)),
      plannedProfit: (p.contractValue || 0) - (p.plannedCost || 0),
      actualProfit: (p.contractValue || 0) - (p.actualCost || 0),
      actualProfitNote: 'Margin laba terkontrol',
      includedRevisions: p.agreementBaseline?.revisionLimit ?? 3,
      actualRevisions: p.activeRevisionCount || 0,
      revisionVariance: Math.max(0, (p.activeRevisionCount || 0) - (p.agreementBaseline?.revisionLimit ?? 3)),
      deadline: p.agreementBaseline?.deadline || p.endDate || null,
      projectedFinish: p.endDate || null,
      deadlineVarianceDays: 0,
      openAlerts: p.alerts.length,
      newAlerts: p.alerts.filter((a: any) => a.status === 'NEW').length,
      alertsByType: {
        BUDGET_VARIANCE: 0,
        SCOPE_VARIANCE: 0,
        BILLING_VARIANCE: 0,
        REVISION_LIMIT: 0,
        DEADLINE_RISK: 0,
        CONTRACT_RISK: 0,
        FINANCIAL_ANOMALY: 0,
        DOCUMENT_INCONSISTENCY: 0,
        POTENTIAL_IRREGULARITY: 0,
      },
      computedAt: new Date().toISOString(),
    };
  }
  return p as Project;
}

function getInitialStore(): ClaraStoreData {
  return {
    activePersona: 'BUDI',
    demoUsers: Object.values(USER_PERSONAS).map((p) => ({
      id: p.id,
      name: p.name,
      role_title: p.roleTitle,
      department: p.department,
      initials: p.initials,
      avatar_bg: p.avatarBg,
      badge_bg: p.badgeBg,
      badge_text: p.badgeText,
      description: p.description,
      primary_focus: p.primaryFocus,
    })),
    projects: [SAMPLE_CONSISTENT_PROJECT],
    meta: { sample_seeded: '1' },
  };
}

function loadStore(): ClaraStoreData {
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.projects)) {
        parsed.projects = parsed.projects.map(sanitizeProject);
      }
      return parsed;
    } else if (isServerless && fs.existsSync(bundledStorePath)) {
      const raw = fs.readFileSync(bundledStorePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.projects)) {
        parsed.projects = parsed.projects.map(sanitizeProject);
      }
      saveStore(parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Failed reading store file, falling back to initial store:', err);
  }
  const initial = getInitialStore();
  saveStore(initial);
  return initial;
}

function saveStore(data: ClaraStoreData): void {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing store file:', err);
  }
}

export function makeCtx(): Ctx {
  return { now: new Date().toISOString(), actor: actorFor(claraDb.getActivePersona()), nextId: randomId };
}

// Database helper functions with identical API
export const claraDb = {
  getDemoUsers() {
    const store = loadStore();
    return store.demoUsers;
  },

  getActivePersona(): UserPersonaId {
    const store = loadStore();
    return store.activePersona || 'BUDI';
  },

  setActivePersona(personaId: UserPersonaId): void {
    const store = loadStore();
    store.activePersona = personaId;
    saveStore(store);
  },

  getProjects(): Project[] {
    const store = loadStore();
    return store.projects || [];
  },

  getProject(id: string): Project | undefined {
    const store = loadStore();
    return store.projects.find((p) => p.id === id);
  },

  requireProject(id: string): Project {
    const project = this.getProject(id);
    if (!project) throw notFound('Proyek tidak ditemukan.', 'PROJECT_NOT_FOUND');
    return project;
  },

  saveProject(project: Project): void {
    const store = loadStore();
    const index = store.projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      store.projects[index] = project;
    } else {
      store.projects.push(project);
    }
    saveStore(store);
  },

  createProject(project: Project): Project {
    const reconciled = reconcile(project, new Date().toISOString());
    this.saveProject(reconciled);
    return reconciled;
  },

  mutate<T>(id: string, mutateFn: (project: Project) => T): { project: Project; result: T } {
    const store = loadStore();
    const index = store.projects.findIndex((p) => p.id === id);
    if (index === -1) throw notFound('Proyek tidak ditemukan.', 'PROJECT_NOT_FOUND');
    const project = store.projects[index];
    const result = mutateFn(project);
    const reconciled = reconcile(project, new Date().toISOString());
    store.projects[index] = reconciled;
    saveStore(store);
    return { project: reconciled, result };
  },

  deleteProject(id: string): void {
    const store = loadStore();
    store.projects = store.projects.filter((p) => p.id !== id);
    saveStore(store);
  },

  findAlertProject(alertId: string): Project {
    const project = this.getProjects().find((p) => (p.alerts ?? []).some((a) => a.id === alertId));
    if (!project) throw notFound('Peringatan tidak ditemukan.', 'ALERT_NOT_FOUND');
    return project;
  },

  getAllAlerts(): Alert[] {
    const projects = this.getProjects();
    const alerts: Alert[] = [];
    projects.forEach((p) => {
      if (p.alerts) alerts.push(...p.alerts);
    });
    return alerts;
  },

  portfolioSummary(): PortfolioSummary {
    const projects = this.getProjects();
    const active = projects.filter((p) => p.metrics?.hasBaseline);
    const sum = (pick: (p: Project) => number) => active.reduce((s, p) => s + (pick(p) || 0), 0);
    const planned = sum((p) => p.metrics?.plannedCost ?? 0);
    const actual = sum((p) => p.metrics?.actualCost ?? 0);
    return {
      projectCount: projects.length,
      activeProjectCount: active.length,
      contractValue: sum((p) => p.metrics?.contractValue ?? 0),
      plannedCost: planned,
      actualCost: actual,
      budgetUtilization: planned > 0 ? Math.round((actual / planned) * 1000) / 10 : null,
      billableValue: sum((p) => p.metrics?.billableValue ?? 0),
      billedValue: sum((p) => p.metrics?.billedValue ?? 0),
      paidValue: sum((p) => p.metrics?.paidValue ?? 0),
      unbilledValue: sum((p) => p.metrics?.unbilledValue ?? 0),
      averageProgress: active.length ? Math.round(sum((p) => p.metrics?.progress ?? 0) / active.length) : null,
      openAlerts: projects.reduce((s, p) => s + (p.metrics?.openAlerts ?? 0), 0),
      newAlerts: projects.reduce((s, p) => s + (p.metrics?.newAlerts ?? 0), 0),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        client: p.client,
        status: p.status,
        progress: p.metrics?.progress ?? 0,
        contractValue: p.metrics?.contractValue ?? 0,
        unbilledValue: p.metrics?.unbilledValue ?? 0,
        openAlerts: p.metrics?.openAlerts ?? 0,
        baselineVersion: p.metrics?.baselineVersion ?? '-',
      })),
      computedAt: new Date().toISOString(),
    };
  },

  resetDemoData(withSeed: boolean = true): void {
    const store = loadStore();
    store.projects = withSeed ? [SAMPLE_CONSISTENT_PROJECT] : [];
    store.activePersona = 'BUDI';
    store.meta.sample_seeded = '1';
    saveStore(store);
  },
};
