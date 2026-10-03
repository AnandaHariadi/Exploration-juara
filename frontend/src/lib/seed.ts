// Deterministic demo dataset. Built through the same domain functions and
// engine as live data, with fixed timestamps and sequential IDs, so every
// reset produces exactly the same state.

import type { ExtractionCandidate, Project } from '@/types';
import { reconcile } from './engine';
import {
  actorFor,
  addCost,
  addDocument,
  addMonitoringEvent,
  confirmBaseline,
  createInvoice,
  newProject,
  recordPayment,
  type Ctx,
} from './domain';
import { readSample, SAMPLE_CONTRACT_FILE, SAMPLE_RAB_FILE } from './files';
import { manualCandidate } from './samples';

export const PITCH_PROJECT_ID = 'PRJ-ASL';
export const SEED_NOW = '2026-10-01T08:00:00.000Z';

function makeCtx(prefix: string) {
  let counter = 0;
  const ctx: Ctx = {
    now: SEED_NOW,
    actor: actorFor('BUDI'),
    nextId: (p) => `${p}-${prefix}${String(++counter).padStart(3, '0')}`,
  };
  const at = (date: string, persona: 'BUDI' | 'SITI' = 'BUDI') => {
    ctx.now = `${date}T09:00:00.000Z`;
    ctx.actor = actorFor(persona);
    return ctx;
  };
  return { ctx, at };
}

function seededCandidate(base: ExtractionCandidate, values: Partial<ExtractionCandidate['contract']>, milestones: ExtractionCandidate['milestones']): ExtractionCandidate {
  return { ...base, contract: { ...base.contract, ...values }, milestones };
}

/** Pitch project: contract + RAB uploaded, waiting for analysis. */
function pitchProject(): { project: Project; files: { id: string; data: Buffer }[] } {
  const { ctx, at } = makeCtx('ASL');
  const project = newProject(PITCH_PROJECT_ID, 'Sistem Manajemen Armada & Logistik', 'PT Astra Sahabat Logistik', at('2026-10-01'), true);
  const contract = readSample(SAMPLE_CONTRACT_FILE);
  const rab = readSample(SAMPLE_RAB_FILE);
  const c = addDocument(project, ctx, { kind: 'CONTRACT', fileName: SAMPLE_CONTRACT_FILE, mimeType: 'application/pdf', size: contract.length, isSample: true }, 'DOC-ASL-CONTRACT');
  const r = addDocument(project, ctx, { kind: 'RAB', fileName: SAMPLE_RAB_FILE, mimeType: 'text/csv', size: rab.length, isSample: true }, 'DOC-ASL-RAB');
  return { project: reconcile(project, SEED_NOW), files: [{ id: c.id, data: contract }, { id: r.id, data: rab }] };
}

/** Healthy running project for portfolio context. */
function retailProject(): Project {
  const { ctx, at } = makeCtx('NSR');
  const project = newProject('PRJ-NSR', 'Portal Layanan Pelanggan', 'PT Nusantara Sejahtera Retail', at('2026-07-01'), true);
  const rabItems = [
    { id: 'RAB-1', category: 'Pengembangan', description: 'Tim pengembang portal', plannedAmount: 32_000_000 },
    { id: 'RAB-2', category: 'Desain', description: 'Riset & desain UI/UX', plannedAmount: 8_000_000 },
    { id: 'RAB-3', category: 'Infrastruktur', description: 'Hosting & CDN 6 bulan', plannedAmount: 6_000_000 },
    { id: 'RAB-4', category: 'Pengujian', description: 'QA & uji beban', plannedAmount: 4_000_000 },
  ];
  project.extraction = seededCandidate(
    manualCandidate(project.client, project.name, ctx.now, { items: rabItems, total: 50_000_000, warnings: [] }),
    {
      contractNumber: 'SPK/NSR/2026/014',
      contractValue: 80_000_000,
      startDate: '2026-07-01',
      deadline: '2026-12-15',
      revisionLimit: 3,
      paymentTerms: '30% uang muka, 30% setelah desain disetujui, 40% setelah go-live.',
      scope: ['Portal tiket keluhan pelanggan', 'Basis pengetahuan & FAQ', 'Integrasi CRM'],
    },
    [
      { id: 'MLS-1', title: 'Uang muka', percentage: 30, trigger: 'Kontrak ditandatangani', targetDate: '2026-07-03' },
      { id: 'MLS-2', title: 'Desain disetujui', percentage: 30, trigger: 'Desain UI disetujui klien', targetDate: '2026-09-05' },
      { id: 'MLS-3', title: 'Go-live', percentage: 40, trigger: 'Portal go-live di produksi', targetDate: '2026-12-10' },
    ],
  );
  confirmBaseline(project, ctx);
  addMonitoringEvent(project, { type: 'MILESTONE_COMPLETED', milestoneId: 'MLS-1', date: '2026-07-03' }, at('2026-07-03'));
  createInvoice(project, { milestoneId: 'MLS-1', issueDate: '2026-07-04' }, at('2026-07-04', 'SITI'));
  recordPayment(project, { invoiceId: project.invoices[0].id, paymentDate: '2026-07-15' }, at('2026-07-15', 'SITI'));
  addCost(project, { amount: 14_000_000, category: 'DEVELOPMENT', description: 'Sprint 1–3 pengembang portal', date: '2026-08-01' }, at('2026-08-01', 'SITI'));
  addCost(project, { amount: 7_000_000, category: 'DESIGN', description: 'Riset & desain UI/UX', date: '2026-08-20' }, at('2026-08-20', 'SITI'));
  addMonitoringEvent(project, { type: 'REVISION_LOGGED', revisionCount: 2, title: 'Revisi desain halaman tiket', date: '2026-08-28' }, at('2026-08-28'));
  addMonitoringEvent(project, { type: 'MILESTONE_COMPLETED', milestoneId: 'MLS-2', date: '2026-09-05' }, at('2026-09-05'));
  createInvoice(project, { milestoneId: 'MLS-2', issueDate: '2026-09-06' }, at('2026-09-06', 'SITI'));
  addCost(project, { amount: 10_000_000, category: 'DEVELOPMENT', description: 'Sprint 4–5 integrasi CRM', date: '2026-09-25' }, at('2026-09-25', 'SITI'));
  addMonitoringEvent(project, { type: 'PROGRESS_UPDATED', progress: 55, projectedFinishDate: '2026-12-10', date: '2026-09-30' }, at('2026-09-30'));
  return reconcile(project, SEED_NOW);
}

/** Running project with one task flagged for scope review. */
function cafeProject(): Project {
  const { ctx, at } = makeCtx('KOP');
  const project = newProject('PRJ-KOPI', 'Aplikasi Kasir & Loyalti', 'CV Kopi Nusantara', at('2026-09-01'), true);
  const rabItems = [
    { id: 'RAB-1', category: 'Pengembangan', description: 'Aplikasi kasir Android', plannedAmount: 18_000_000 },
    { id: 'RAB-2', category: 'Pengembangan', description: 'Modul poin loyalti', plannedAmount: 8_000_000 },
    { id: 'RAB-3', category: 'Infrastruktur', description: 'Server & database', plannedAmount: 4_000_000 },
  ];
  project.extraction = seededCandidate(
    manualCandidate(project.client, project.name, ctx.now, { items: rabItems, total: 30_000_000, warnings: [] }),
    {
      contractNumber: 'SPK/KOPI/2026/003',
      contractValue: 45_000_000,
      startDate: '2026-09-01',
      deadline: '2026-12-20',
      revisionLimit: 2,
      paymentTerms: '40% uang muka, 60% setelah aplikasi diterima.',
      scope: ['Aplikasi kasir Android', 'Program poin loyalti pelanggan', 'Laporan penjualan harian'],
    },
    [
      { id: 'MLS-1', title: 'Uang muka', percentage: 40, trigger: 'Kontrak ditandatangani', targetDate: '2026-09-02' },
      { id: 'MLS-2', title: 'Aplikasi diterima', percentage: 60, trigger: 'Berita acara serah terima aplikasi', targetDate: '2026-12-20' },
    ],
  );
  confirmBaseline(project, ctx);
  addMonitoringEvent(project, { type: 'MILESTONE_COMPLETED', milestoneId: 'MLS-1', date: '2026-09-02' }, at('2026-09-02'));
  createInvoice(project, { milestoneId: 'MLS-1', issueDate: '2026-09-03' }, at('2026-09-03', 'SITI'));
  recordPayment(project, { invoiceId: project.invoices[0].id, paymentDate: '2026-09-12' }, at('2026-09-12', 'SITI'));
  addCost(project, { amount: 12_000_000, category: 'DEVELOPMENT', description: 'Sprint 1–2 aplikasi kasir', date: '2026-09-26' }, at('2026-09-26', 'SITI'));
  addMonitoringEvent(project, { type: 'PROGRESS_UPDATED', progress: 30, projectedFinishDate: '2026-12-18', date: '2026-09-28' }, at('2026-09-28'));
  addMonitoringEvent(
    project,
    { type: 'SCOPE_ADDED', title: 'Integrasi notifikasi WhatsApp', description: 'Klien meminta notifikasi poin via WhatsApp saat rapat mingguan.', date: '2026-09-29' },
    at('2026-09-29'),
  );
  return reconcile(project, SEED_NOW);
}

export function buildSeed() {
  const pitch = pitchProject();
  // Insert order defines list order (newest first): pitch project appears on top.
  return { projects: [retailProject(), cafeProject(), pitch.project], files: pitch.files.map((f) => ({ projectId: PITCH_PROJECT_ID, ...f })) };
}
