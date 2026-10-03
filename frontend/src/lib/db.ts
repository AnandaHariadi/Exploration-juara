// SQLite persistence for business data. Server-only: the browser reaches this
// exclusively through Next.js API routes.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Alert, PortfolioSummary, Project, UserPersonaId } from '../types/index';
import { USER_PERSONAS } from '../types/index';
import { reconcile } from './engine';
import { actorFor, randomId, type Ctx } from './domain';
import { notFound } from './api';
import { buildSeed } from './seed';
import { clearUploads, saveDocumentFile } from './files';

/** Bump when the stored project shape changes; older databases are re-seeded. */
const DATA_VERSION = '3';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'clara.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run SQL migrations in data/migrations exactly once, in order.
const migrationsDir = path.join(dataDir, 'migrations');
db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`);
if (!fs.existsSync(migrationsDir)) throw new Error(`Folder migrasi SQLite tidak ditemukan: ${migrationsDir}`);
const applied = new Set((db.prepare('SELECT version FROM schema_migrations').all() as { version: string }[]).map((r) => r.version));
for (const file of fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
  })();
}

function seedUsers() {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO demo_users (id, name, role_title, department, initials, avatar_bg, badge_bg, badge_text, description, primary_focus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of Object.values(USER_PERSONAS)) {
    insert.run(p.id, p.name, p.roleTitle, p.department, p.initials, p.avatarBg, p.badgeBg, p.badgeText, p.description, p.primaryFocus);
  }
  db.prepare(`INSERT OR REPLACE INTO demo_session (id, active_user_id, updated_at) VALUES (1, 'BUDI', ?)`).run(new Date().toISOString());
}

function writeProject(project: Project) {
  const json = JSON.stringify(project);
  const values = [
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
    project.agreementBaseline?.revisionLimit ?? 0,
    project.activeRevisionCount,
    json,
  ];
  const updated = db
    .prepare(`UPDATE projects SET name=?, client=?, status=?, contract_value=?, planned_cost=?, actual_cost=?, billable_value=?, billed_value=?, paid_value=?,
      progress=?, baseline_version=?, start_date=?, end_date=?, revision_limit=?, active_revision_count=?, data_json=? WHERE id=?`)
    .run(...values, project.id);
  if (updated.changes === 0) {
    db.prepare(`INSERT INTO projects (name, client, status, contract_value, planned_cost, actual_cost, billable_value, billed_value, paid_value,
      progress, baseline_version, start_date, end_date, revision_limit, active_revision_count, data_json, id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...values, project.id);
  }
}

function readProject(id: string): Project | undefined {
  const row = db.prepare('SELECT data_json FROM projects WHERE id = ?').get(id) as { data_json: string } | undefined;
  return row ? (JSON.parse(row.data_json) as Project) : undefined;
}

function resetDemoData(): void {
  const seed = buildSeed();
  db.transaction(() => {
    db.prepare('DELETE FROM projects').run();
    seedUsers();
    for (const project of seed.projects) writeProject(project);
    db.prepare("INSERT OR REPLACE INTO demo_meta (key, value) VALUES ('data_version', ?)").run(DATA_VERSION);
  })();
  clearUploads();
  for (const file of seed.files) saveDocumentFile(file.projectId, file.id, file.data);
  console.log(`[DEMO] reset complete: ${seed.projects.length} projects seeded`);
}

const version = db.prepare("SELECT value FROM demo_meta WHERE key = 'data_version'").get() as { value: string } | undefined;
if (version?.value !== DATA_VERSION) resetDemoData();

export function makeCtx(): Ctx {
  return { now: new Date().toISOString(), actor: actorFor(claraDb.getActivePersona()), nextId: randomId };
}

export const claraDb = {
  getDemoUsers() {
    return db.prepare('SELECT * FROM demo_users ORDER BY rowid').all();
  },

  getActivePersona(): UserPersonaId {
    const row = db.prepare('SELECT active_user_id FROM demo_session WHERE id = 1').get() as { active_user_id: UserPersonaId } | undefined;
    return row?.active_user_id ?? 'BUDI';
  },

  setActivePersona(personaId: UserPersonaId) {
    db.prepare('UPDATE demo_session SET active_user_id = ?, updated_at = ? WHERE id = 1').run(personaId, new Date().toISOString());
  },

  getProjects(): Project[] {
    const rows = db.prepare('SELECT data_json FROM projects ORDER BY rowid DESC').all() as { data_json: string }[];
    return rows.map((r) => JSON.parse(r.data_json) as Project);
  },

  getProject(id: string): Project | undefined {
    return readProject(id);
  },

  requireProject(id: string): Project {
    const project = readProject(id);
    if (!project) throw notFound('Proyek tidak ditemukan.', 'PROJECT_NOT_FOUND');
    return project;
  },

  /** Insert a brand-new project (already reconciled by the caller's mutate path). */
  createProject(project: Project): Project {
    const reconciled = reconcile(project, new Date().toISOString());
    writeProject(reconciled);
    return reconciled;
  },

  /**
   * Read → mutate → reconcile → write in one transaction. If `mutate` throws,
   * nothing is written. Returns the reconciled project.
   */
  mutate<T>(id: string, mutateFn: (project: Project) => T): { project: Project; result: T } {
    return db.transaction(() => {
      const project = this.requireProject(id);
      const result = mutateFn(project);
      const reconciled = reconcile(project, new Date().toISOString());
      writeProject(reconciled);
      const before = project.alerts.filter((a) => a.status !== 'RESOLVED').length;
      const after = reconciled.metrics.openAlerts;
      console.log(`[RECONCILIATION] project=${id} baseline=${reconciled.baselineVersion} openAlerts=${after}${after !== before ? ` (was ${before})` : ''}`);
      return { project: reconciled, result };
    })();
  },

  deleteProject(id: string): void {
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    if (result.changes === 0) throw notFound('Proyek tidak ditemukan.', 'PROJECT_NOT_FOUND');
  },

  findAlertProject(alertId: string): Project {
    const project = this.getProjects().find((p) => p.alerts.some((a) => a.id === alertId));
    if (!project) throw notFound('Peringatan tidak ditemukan.', 'ALERT_NOT_FOUND');
    return project;
  },

  getAllAlerts(): Alert[] {
    return this.getProjects().flatMap((p) => p.alerts);
  },

  portfolioSummary(): PortfolioSummary {
    const projects = this.getProjects();
    const active = projects.filter((p) => p.metrics.hasBaseline);
    const sum = (pick: (p: Project) => number) => active.reduce((s, p) => s + pick(p), 0);
    const planned = sum((p) => p.metrics.plannedCost);
    const actual = sum((p) => p.metrics.actualCost);
    return {
      projectCount: projects.length,
      activeProjectCount: active.length,
      contractValue: sum((p) => p.metrics.contractValue),
      plannedCost: planned,
      actualCost: actual,
      budgetUtilization: planned > 0 ? Math.round((actual / planned) * 1000) / 10 : null,
      billableValue: sum((p) => p.metrics.billableValue),
      billedValue: sum((p) => p.metrics.billedValue),
      paidValue: sum((p) => p.metrics.paidValue),
      unbilledValue: sum((p) => p.metrics.unbilledValue),
      averageProgress: active.length ? Math.round(sum((p) => p.metrics.progress) / active.length) : null,
      openAlerts: projects.reduce((s, p) => s + p.metrics.openAlerts, 0),
      newAlerts: projects.reduce((s, p) => s + p.metrics.newAlerts, 0),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        client: p.client,
        status: p.status,
        progress: p.metrics.progress,
        contractValue: p.metrics.contractValue,
        unbilledValue: p.metrics.unbilledValue,
        openAlerts: p.metrics.openAlerts,
        baselineVersion: p.metrics.baselineVersion ?? '-',
      })),
      computedAt: new Date().toISOString(),
    };
  },

  resetDemoData,
};
