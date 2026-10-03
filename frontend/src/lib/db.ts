import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Project, UserPersonaId, USER_PERSONAS, Alert } from '../types/index';

// Ensure data folder exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'clara.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Jalankan berkas migrasi SQL di data/migrations secara berurutan, tepat satu kali.
const migrationsDir = path.join(dataDir, 'migrations');
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  );
`);

if (!fs.existsSync(migrationsDir)) {
  throw new Error(`Folder migrasi SQLite tidak ditemukan: ${migrationsDir}`);
}

const appliedVersions = new Set(
  (db.prepare('SELECT version FROM schema_migrations').all() as { version: string }[]).map((r) => r.version)
);

fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .forEach((file) => {
    if (appliedVersions.has(file)) return;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    })();
  });

// Seed Demo Users if not present
const countUsers = db.prepare('SELECT COUNT(*) as count FROM demo_users').get() as { count: number };
if (countUsers.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO demo_users (id, name, role_title, department, initials, avatar_bg, badge_bg, badge_text, description, primary_focus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  Object.values(USER_PERSONAS).forEach((p) => {
    insertUser.run(
      p.id,
      p.name,
      p.roleTitle,
      p.department,
      p.initials,
      p.avatarBg,
      p.badgeBg,
      p.badgeText,
      p.description,
      p.primaryFocus
    );
  });
}

// Seed Active Session if not present
const session = db.prepare('SELECT * FROM demo_session WHERE id = 1').get();
if (!session) {
  db.prepare(`
    INSERT INTO demo_session (id, active_user_id, updated_at)
    VALUES (1, 'BUDI', ?)
  `).run(new Date().toISOString());
}

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

// Database helper functions
export const claraDb = {
  // Demo Users & Session
  getDemoUsers() {
    return db.prepare('SELECT * FROM demo_users').all();
  },

  getActivePersona(): UserPersonaId {
    const row = db.prepare('SELECT active_user_id FROM demo_session WHERE id = 1').get() as { active_user_id: UserPersonaId } | undefined;
    return row?.active_user_id || 'BUDI';
  },

  setActivePersona(personaId: UserPersonaId) {
    db.prepare('UPDATE demo_session SET active_user_id = ?, updated_at = ? WHERE id = 1').run(
      personaId,
      new Date().toISOString()
    );
  },

  // Projects
  getProjects(): Project[] {
    const rows = db.prepare('SELECT data_json FROM projects ORDER BY rowid DESC').all() as { data_json: string }[];
    return rows.map((r) => JSON.parse(r.data_json));
  },

  getProject(id: string): Project | undefined {
    const row = db.prepare('SELECT data_json FROM projects WHERE id = ?').get(id) as { data_json: string } | undefined;
    return row ? JSON.parse(row.data_json) : undefined;
  },

  saveProject(project: Project): void {
    const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(project.id);
    const jsonStr = JSON.stringify(project);

    if (existing) {
      db.prepare(`
        UPDATE projects SET
          name = ?, client = ?, status = ?, contract_value = ?, planned_cost = ?,
          actual_cost = ?, billable_value = ?, billed_value = ?, paid_value = ?,
          progress = ?, baseline_version = ?, start_date = ?, end_date = ?,
          revision_limit = ?, active_revision_count = ?, data_json = ?
        WHERE id = ?
      `).run(
        project.name,
        project.client,
        project.status,
        project.contractValue,
        project.plannedCost,
        project.actualCost,
        project.billableValue,
        project.billedValue,
        project.paidValue,
        project.progress,
        project.baselineVersion,
        project.startDate,
        project.endDate,
        project.agreementBaseline?.revisionLimit || 3,
        project.activeRevisionCount,
        jsonStr,
        project.id
      );
    } else {
      db.prepare(`
        INSERT INTO projects (
          id, name, client, status, contract_value, planned_cost,
          actual_cost, billable_value, billed_value, paid_value,
          progress, baseline_version, start_date, end_date,
          revision_limit, active_revision_count, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        project.id,
        project.name,
        project.client,
        project.status,
        project.contractValue,
        project.plannedCost,
        project.actualCost,
        project.billableValue,
        project.billedValue,
        project.paidValue,
        project.progress,
        project.baselineVersion,
        project.startDate,
        project.endDate,
        project.agreementBaseline?.revisionLimit || 3,
        project.activeRevisionCount,
        jsonStr
      );
    }
  },

  deleteProject(id: string): void {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  },

  getAllAlerts(): Alert[] {
    const projects = this.getProjects();
    const alerts: Alert[] = [];
    projects.forEach((p) => {
      if (p.alerts) alerts.push(...p.alerts);
    });
    return alerts;
  },

  // Reset demo dataset. Default: kembalikan ke proyek contoh yang konsisten.
  // withSeed=false mengosongkan semua proyek untuk memulai dari nol.
  resetDemoData(withSeed: boolean = true): void {
    db.transaction(() => {
      db.prepare('DELETE FROM projects').run();
      this.setActivePersona('BUDI');

      if (withSeed) {
        this.saveProject(SAMPLE_CONSISTENT_PROJECT);
      }
      db.prepare("INSERT OR REPLACE INTO demo_meta (key, value) VALUES ('sample_seeded', '1')").run();
    })();
  },
};

// Seed proyek contoh sekali saja pada database yang baru dibuat, agar demo siap
// dipakai tanpa langkah manual. Proyek yang dihapus pengguna tidak di-seed ulang;
// gunakan reset demo untuk mengembalikannya.
const sampleSeeded = db.prepare("SELECT value FROM demo_meta WHERE key = 'sample_seeded'").get();
if (!sampleSeeded) {
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    claraDb.saveProject(SAMPLE_CONSISTENT_PROJECT);
  }
  db.prepare("INSERT OR REPLACE INTO demo_meta (key, value) VALUES ('sample_seeded', '1')").run();
}
