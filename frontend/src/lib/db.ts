import path from 'path';
import fs from 'fs';
import { Project, UserPersonaId, USER_PERSONAS, Alert } from '../types/index';

// Ensure data folder exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storePath = path.join(dataDir, 'clara_store.json');

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
  changeRequests: [],
  alerts: [],
};

interface ClaraStoreData {
  activePersona: UserPersonaId;
  demoUsers: Record<string, unknown>[];
  projects: Project[];
  meta: Record<string, string>;
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
      return JSON.parse(raw);
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

  deleteProject(id: string): void {
    const store = loadStore();
    store.projects = store.projects.filter((p) => p.id !== id);
    saveStore(store);
  },

  getAllAlerts(): Alert[] {
    const projects = this.getProjects();
    const alerts: Alert[] = [];
    projects.forEach((p) => {
      if (p.alerts) alerts.push(...p.alerts);
    });
    return alerts;
  },

  resetDemoData(withSeed: boolean = true): void {
    const store = loadStore();
    store.projects = withSeed ? [SAMPLE_CONSISTENT_PROJECT] : [];
    store.activePersona = 'BUDI';
    store.meta.sample_seeded = '1';
    saveStore(store);
  },
};
