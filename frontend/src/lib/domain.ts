// Business mutations. Each function changes the raw records of a project and
// leaves every derived value to engine.reconcile(), which the DB layer runs
// after every mutation.

import { randomUUID } from 'crypto';
import type {
  ActualCostItem,
  BaselineVersion,
  CandidateMilestone,
  CandidateRabItem,
  ChangeRequest,
  DocumentKind,
  ExtractionCandidate,
  GeneratedDocument,
  Milestone,
  Project,
  ProjectDocument,
  ProjectEvent,
  ProjectEventType,
  ScopeItem,
  UserPersonaId,
} from '@/types';
import { EMPTY_TERMS, USER_PERSONAS } from '@/types';
import { addDays, allocateMilestoneValues, emptyMetrics, formatDay, idr, isIsoDate } from './engine';
import { badRequest, conflict, HttpError, int, MAX_RUPIAH, notFound, oneOf, str } from './api';

export interface Ctx {
  now: string;
  actor: { id: UserPersonaId; name: string; label: string };
  nextId: (prefix: string) => string;
}

export function actorFor(id: UserPersonaId) {
  const persona = USER_PERSONAS[id] ?? USER_PERSONAS.BUDI;
  const role = { BUDI: 'Pengelola proyek', SITI: 'Keuangan', HENDRA: 'Pimpinan', ADMIN: 'Admin' }[persona.id];
  return { id: persona.id, name: persona.name, label: `${persona.name} (${role})` };
}

export const randomId = (prefix: string) => `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;

const today = (ctx: Ctx) => ctx.now.slice(0, 10);

function pushEvent(project: Project, ctx: Ctx, type: ProjectEventType, title: string, description: string, date = today(ctx), metadata?: ProjectEvent['metadata']): ProjectEvent {
  const event: ProjectEvent = { id: ctx.nextId('EVT'), projectId: project.id, type, title, description, date, author: ctx.actor.label, createdAt: ctx.now, metadata };
  project.events.unshift(event);
  return event;
}

function requireBaseline(project: Project): BaselineVersion {
  const active = project.baselines.find((b) => b.status === 'ACTIVE');
  if (!active) throw conflict('Setujui acuan proyek (baseline) terlebih dahulu sebelum mencatat data pemantauan.', 'BASELINE_REQUIRED');
  return active;
}

function requireRole(ctx: Ctx, roles: UserPersonaId[], message: string) {
  if (!roles.includes(ctx.actor.id)) throw new HttpError(403, 'ROLE_REQUIRED', `${message} Ganti pengguna demo di kanan atas.`);
}

// ---------------------------------------------------------------- projects

export function newProject(id: string, name: string, client: string, ctx: Ctx, isDemo = false): Project {
  return {
    id,
    name,
    client,
    status: 'DRAFT',
    isDemo,
    createdAt: ctx.now,
    contractValue: 0,
    plannedCost: 0,
    actualCost: 0,
    billableValue: 0,
    billedValue: 0,
    paidValue: 0,
    progress: 0,
    baselineVersion: '-',
    startDate: '',
    endDate: '',
    activeRevisionCount: 0,
    agreementBaseline: { contractNumber: '', title: name, clientName: client, contractValue: 0, startDate: '', deadline: '', paymentTerms: '', revisionLimit: 0, scopeItems: [], milestones: [], clausesSummary: [] },
    planBaseline: { totalPlannedCost: 0, items: [], contingencyBudget: 0 },
    baselines: [],
    documents: [],
    extraction: null,
    actualCosts: [],
    invoices: [],
    payments: [],
    events: [],
    changeRequests: [],
    drafts: [],
    alerts: [],
    reconciliation: [],
    metrics: emptyMetrics(ctx.now),
  };
}

export function updateProjectInfo(project: Project, body: Record<string, unknown>) {
  const name = str(body, 'name', { max: 160, label: 'Nama proyek' });
  const client = str(body, 'client', { max: 160, label: 'Nama klien' });
  if (!name && !client) throw badRequest('Tidak ada perubahan. Kirim name atau client.');
  if (name) project.name = name;
  if (client) project.client = client;
}

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  CONTRACT: 'Kontrak',
  RAB: 'RAB',
  INVOICE: 'Invoice',
  ADDENDUM: 'Adendum',
  CLIENT_APPROVAL: 'Bukti persetujuan klien',
  SUPPORTING: 'Dokumen pendukung',
};

/**
 * Register an uploaded document. Before the baseline: contract, RAB and supporting
 * files. After the baseline: invoices, addenda, client approvals and supporting
 * files (the active contract and RAB can only change through a change request).
 */
export function addDocument(project: Project, ctx: Ctx, doc: Omit<ProjectDocument, 'id' | 'uploadedAt' | 'uploadedBy' | 'status'> & { status?: ProjectDocument['status'] }, id = ctx.nextId('DOC')): ProjectDocument {
  const hasBaseline = project.baselines.length > 0;
  if (hasBaseline && (doc.kind === 'CONTRACT' || doc.kind === 'RAB')) throw conflict('Acuan proyek sudah disetujui. Unggah adendum, lalu ajukan permintaan perubahan.', 'BASELINE_LOCKED');
  if (!hasBaseline && (doc.kind === 'INVOICE' || doc.kind === 'ADDENDUM' || doc.kind === 'CLIENT_APPROVAL')) throw conflict('Setujui acuan proyek terlebih dahulu sebelum mengunggah invoice, adendum, atau bukti persetujuan.', 'BASELINE_REQUIRED');
  if (!hasBaseline && doc.kind === 'CONTRACT' && project.extraction?.status === 'PROCESSING') throw conflict('Analisis dokumen sedang berjalan. Tunggu hingga selesai.', 'EXTRACTION_IN_PROGRESS');
  const record: ProjectDocument = { ...doc, status: doc.status ?? 'UPLOADED', statusAt: ctx.now, id, uploadedAt: ctx.now, uploadedBy: ctx.actor.label };
  project.documents.push(record);
  pushEvent(project, ctx, 'DOCUMENT_UPLOADED', `${DOCUMENT_KIND_LABEL[doc.kind]} diunggah: ${doc.fileName}`, doc.isSample ? 'Berkas contoh untuk demo · dianalisis otomatis oleh CLARA.' : `${Math.ceil(doc.size / 1024)} KB · dianalisis otomatis oleh CLARA.`);
  return record;
}

export function findDocument(project: Project, documentId: string) {
  const doc = project.documents.find((d) => d.id === documentId);
  if (!doc) throw notFound('Dokumen tidak ditemukan.');
  return doc;
}

/** Human decision on an analyzed supporting document / invoice / addendum. */
export function decideDocument(project: Project, documentId: string, body: Record<string, unknown>, ctx: Ctx) {
  const doc = findDocument(project, documentId);
  const decision = oneOf(body, 'decision', ['APPROVED', 'REJECTED'] as const);
  if (doc.status === 'PROCESSING') throw conflict('Dokumen masih dianalisis.', 'DOCUMENT_PROCESSING');
  if (doc.kind === 'CONTRACT' || doc.kind === 'RAB') throw conflict('Kontrak dan RAB disetujui melalui persetujuan acuan proyek.', 'INVALID_TRANSITION');
  doc.status = decision;
  doc.statusAt = ctx.now;
  const note = str(body, 'note', { max: 300 });
  pushEvent(project, ctx, 'DOCUMENT_UPLOADED', `${DOCUMENT_KIND_LABEL[doc.kind]} ${doc.fileName} ${decision === 'APPROVED' ? 'diterima' : 'ditolak'}`, note || (decision === 'REJECTED' ? 'Dokumen tidak dipakai sebagai dasar; temuan terkait ditutup.' : 'Dokumen diterima sebagai bukti.'));
}

/** Turn an analyzed invoice document into a recorded invoice — human action, normal entitlement checks apply. */
export function recordInvoiceFromDocument(project: Project, documentId: string, ctx: Ctx) {
  const doc = findDocument(project, documentId);
  const inv = doc.analysis?.invoice;
  if (doc.kind !== 'INVOICE' || !inv) throw conflict('Dokumen ini belum dianalisis sebagai invoice.', 'NOT_AN_INVOICE');
  if (inv.recordedInvoiceId) throw conflict('Invoice dari dokumen ini sudah dicatat. Pencatatan ganda dicegah.', 'ALREADY_RECORDED');
  if (!inv.matchedMilestoneId) throw conflict('Termin invoice tidak cocok dengan tahap pada acuan aktif. Catat tagihan manual dari tab Keuangan.', 'MILESTONE_NOT_MATCHED');
  if (inv.total === null) throw conflict('Total invoice tidak terbaca. Catat tagihan manual dari tab Keuangan.', 'TOTAL_MISSING');
  const invoice = createInvoice(project, { milestoneId: inv.matchedMilestoneId, amount: inv.total, issueDate: inv.issueDate ?? undefined, invoiceNumber: inv.invoiceNumber ?? undefined }, ctx);
  inv.recordedInvoiceId = invoice.id;
  doc.status = 'APPROVED';
  doc.statusAt = ctx.now;
  return invoice;
}

export const latestDocument = (project: Project, kind: ProjectDocument['kind']) => [...project.documents].reverse().find((d) => d.kind === kind);

// ---------------------------------------------------------------- candidate

export function validateCandidate(c: ExtractionCandidate): string[] {
  const errors: string[] = [];
  const k = c.contract;
  if (!Number.isSafeInteger(k.contractValue) || (k.contractValue ?? 0) <= 0 || (k.contractValue ?? 0) > MAX_RUPIAH) errors.push('Nilai kontrak harus berupa bilangan bulat rupiah lebih dari 0.');
  if (!Number.isSafeInteger(c.rab.total) || (c.rab.total ?? 0) <= 0) errors.push('Rencana biaya (RAB) belum tersedia. Unggah RAB CSV atau isi item RAB.');
  if (!isIsoDate(k.startDate)) errors.push('Tanggal mulai belum valid.');
  if (!isIsoDate(k.deadline)) errors.push('Tenggat belum valid.');
  if (isIsoDate(k.startDate) && isIsoDate(k.deadline) && k.startDate > k.deadline) errors.push('Tanggal mulai tidak boleh setelah tenggat.');
  if (!Number.isInteger(k.revisionLimit) || (k.revisionLimit ?? -1) < 0 || (k.revisionLimit ?? 0) > 1000) errors.push('Batas revisi harus bilangan bulat 0 atau lebih.');
  if (c.milestones.length === 0) errors.push('Tambahkan minimal satu tahap pembayaran (milestone).');
  c.milestones.forEach((m, i) => {
    if (!m.title.trim()) errors.push(`Tahap ${i + 1}: nama wajib diisi.`);
    if (typeof m.percentage !== 'number' || !(m.percentage > 0 && m.percentage <= 100)) errors.push(`Tahap ${i + 1}: persentase harus di antara 0 dan 100.`);
    if (m.targetDate && !isIsoDate(m.targetDate)) errors.push(`Tahap ${i + 1}: tanggal target tidak valid.`);
  });
  const sum = c.milestones.reduce((s, m) => s + (m.percentage ?? 0), 0);
  if (c.milestones.length > 0 && Math.abs(sum - 100) > 0.01) errors.push(`Total persentase tahap pembayaran ${sum.toLocaleString('id-ID')}%, harus 100%.`);
  if (k.scope.filter((s) => s.trim()).length === 0) errors.push('Ruang lingkup pekerjaan wajib diisi minimal satu.');
  return errors;
}

function parseMilestones(raw: unknown): CandidateMilestone[] {
  if (!Array.isArray(raw)) throw badRequest('milestones harus berupa daftar.');
  if (raw.length > 20) throw badRequest('Maksimal 20 tahap pembayaran.');
  return raw.map((item, i) => {
    if (!item || typeof item !== 'object') throw badRequest(`Tahap ${i + 1} tidak valid.`);
    const m = item as Record<string, unknown>;
    const pct = m.percentage === null || m.percentage === '' || m.percentage === undefined ? null : Number(m.percentage);
    if (pct !== null && (!Number.isFinite(pct) || pct < 0 || pct > 100)) throw badRequest(`Tahap ${i + 1}: persentase harus 0–100.`);
    const targetDate = typeof m.targetDate === 'string' && m.targetDate ? m.targetDate : null;
    if (targetDate && !isIsoDate(targetDate)) throw badRequest(`Tahap ${i + 1}: tanggal target tidak valid.`);
    return {
      id: typeof m.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(m.id) ? m.id : `MLS-${i + 1}`,
      title: String(m.title ?? '').slice(0, 160),
      percentage: pct,
      trigger: String(m.trigger ?? '').slice(0, 300),
      targetDate,
      source: m.source && typeof m.source === 'object' ? (m.source as CandidateMilestone['source']) : undefined,
    };
  });
}

function parseRabItems(raw: unknown): CandidateRabItem[] {
  if (!Array.isArray(raw)) throw badRequest('rab.items harus berupa daftar.');
  return raw.map((item, i) => {
    const r = (item ?? {}) as Record<string, unknown>;
    const amount = Number(r.plannedAmount);
    if (!Number.isSafeInteger(amount) || amount <= 0) throw badRequest(`Item RAB ${i + 1}: jumlah harus bilangan bulat rupiah lebih dari 0.`);
    const description = String(r.description ?? '').trim();
    if (!description) throw badRequest(`Item RAB ${i + 1}: deskripsi wajib diisi.`);
    return { id: `RAB-${i + 1}`, category: String(r.category ?? 'Lainnya').slice(0, 80) || 'Lainnya', description: description.slice(0, 200), plannedAmount: amount };
  });
}

const nullableInt = (body: Record<string, unknown>, key: string, label: string, max: number) => {
  const raw = body[key];
  if (raw === null || raw === '' || raw === undefined) return null;
  return int(body, key, { min: 0, max, label });
};

const nullableDate = (body: Record<string, unknown>, key: string, label: string) => {
  const raw = body[key];
  if (raw === null || raw === '') return null;
  if (!isIsoDate(raw)) throw badRequest(`${label} harus berformat YYYY-MM-DD.`);
  return raw;
};

/** Human corrections to the candidate. Only fields present in the patch change. */
export function updateCandidate(project: Project, patch: Record<string, unknown>) {
  if (project.baselines.length > 0) throw conflict('Acuan proyek sudah disetujui. Gunakan permintaan perubahan.', 'BASELINE_LOCKED');
  const c = project.extraction;
  if (!c || c.status !== 'READY') throw conflict('Belum ada hasil analisis yang dapat ditinjau.', 'NO_CANDIDATE');
  const edited = new Set(c.editedFields);
  const contract = (patch.contract ?? {}) as Record<string, unknown>;
  if (typeof contract !== 'object' || Array.isArray(contract)) throw badRequest('contract harus berupa objek.');

  const k = c.contract;
  const setIfPresent = (key: keyof typeof k, value: () => unknown) => {
    if (!(key in contract)) return;
    const next = value();
    if (JSON.stringify(next) !== JSON.stringify(k[key])) edited.add(key);
    (k as Record<string, unknown>)[key] = next;
  };
  setIfPresent('contractValue', () => nullableInt(contract, 'contractValue', 'Nilai kontrak', MAX_RUPIAH));
  setIfPresent('revisionLimit', () => nullableInt(contract, 'revisionLimit', 'Batas revisi', 1000));
  setIfPresent('startDate', () => nullableDate(contract, 'startDate', 'Tanggal mulai'));
  setIfPresent('deadline', () => nullableDate(contract, 'deadline', 'Tenggat'));
  setIfPresent('contractNumber', () => str(contract, 'contractNumber', { max: 120, label: 'Nomor kontrak' }));
  setIfPresent('title', () => str(contract, 'title', { max: 200, label: 'Judul' }));
  setIfPresent('clientName', () => str(contract, 'clientName', { max: 160, label: 'Klien' }));
  setIfPresent('paymentTerms', () => str(contract, 'paymentTerms', { max: 1000, label: 'Ketentuan pembayaran' }));
  setIfPresent('scope', () => {
    if (!Array.isArray(contract.scope)) throw badRequest('scope harus berupa daftar.');
    return contract.scope.map((s) => String(s).trim().slice(0, 200)).filter(Boolean).slice(0, 50);
  });

  if ('milestones' in patch) {
    const next = parseMilestones(patch.milestones);
    if (JSON.stringify(next) !== JSON.stringify(c.milestones)) edited.add('milestones');
    c.milestones = next;
  }
  if ('terms' in patch) {
    const t = (patch.terms ?? {}) as Record<string, unknown>;
    if (typeof t !== 'object' || Array.isArray(t)) throw badRequest('terms harus berupa objek.');
    const pct = (key: string, label: string) => {
      const raw = t[key];
      if (raw === null || raw === '' || raw === undefined) return null;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 100) throw badRequest(`${label} harus 0–100.`);
      return n;
    };
    const next = {
      hourlyRate: nullableInt(t, 'hourlyRate', 'Tarif per jam', MAX_RUPIAH),
      revisionUnitPrice: nullableInt(t, 'revisionUnitPrice', 'Biaya revisi tambahan', MAX_RUPIAH),
      revisionExtensionDays: nullableInt(t, 'revisionExtensionDays', 'Tambahan hari per adendum revisi', 365),
      penaltyPerDayPercent: pct('penaltyPerDayPercent', 'Denda per hari'),
      penaltyCapPercent: pct('penaltyCapPercent', 'Batas denda'),
      paymentDueDays: nullableInt(t, 'paymentDueDays', 'Tempo pembayaran', 365),
    };
    if (JSON.stringify(next) !== JSON.stringify(c.terms)) edited.add('terms');
    c.terms = next;
  }
  if ('rabItems' in patch) {
    const items = parseRabItems(patch.rabItems);
    edited.add('rab');
    c.rab = { ...c.rab, items, total: items.reduce((s, i) => s + i.plannedAmount, 0) };
  }
  c.editedFields = [...edited];
}

export function confirmBaseline(project: Project, ctx: Ctx): BaselineVersion {
  if (project.baselines.length > 0) throw conflict('Acuan V1 sudah disetujui. Perubahan berikutnya melalui permintaan perubahan.', 'BASELINE_EXISTS');
  const c = project.extraction;
  if (!c || c.status !== 'READY') throw conflict('Belum ada hasil analisis yang siap disetujui.', 'NO_CANDIDATE');
  const errors = validateCandidate(c);
  if (errors.length) throw badRequest(errors.join(' '), 'CANDIDATE_INVALID');

  const k = c.contract;
  const contractValue = k.contractValue as number;
  const values = allocateMilestoneValues(contractValue, c.milestones.map((m) => m.percentage as number));
  const milestones: Milestone[] = c.milestones.map((m, i) => ({
    id: m.id,
    title: m.title.trim(),
    percentage: m.percentage as number,
    value: values[i],
    basisContractValue: contractValue,
    trigger: m.trigger.trim() || m.title.trim(),
    targetDate: m.targetDate ?? '',
    status: 'PENDING',
    billingStatus: 'UNBILLED',
    source: m.source,
  }));
  const scopeItems: ScopeItem[] = k.scope.filter((s) => s.trim()).map((title, i) => ({
    id: `SCP-${i + 1}`,
    title: title.trim(),
    description: c.source === 'MANUAL' ? 'Diisi manual saat membuat acuan.' : 'Dari ruang lingkup kontrak.',
    category: 'CORE_FEATURE',
    status: 'MATCH',
    origin: 'BASELINE',
    contractClauseRef: c.sources.scope?.page ? `hal. ${c.sources.scope.page}` : undefined,
  }));
  const rabItems = c.rab.items.map((item) => ({ ...item, actualAmount: 0 }));
  const sourceDetail = c.source === 'AI' ? `Analisis AI (${c.extractionMeta?.engine ?? 'CLARA AI'}) ditinjau pengguna` : c.source === 'SAMPLE' ? 'Data contoh ditinjau pengguna' : 'Input manual pengguna';

  const version: BaselineVersion = {
    id: ctx.nextId('BLV'),
    version: 1,
    label: 'V1',
    status: 'ACTIVE',
    contractValue,
    plannedCost: c.rab.total as number,
    startDate: k.startDate as string,
    deadline: k.deadline as string,
    revisionLimit: k.revisionLimit as number,
    paymentTerms: k.paymentTerms,
    milestones: structuredClone(milestones),
    scopeItems: structuredClone(scopeItems),
    rabItems,
    terms: { ...EMPTY_TERMS, ...c.terms },
    source: 'EXTRACTION_CONFIRMED',
    sourceDetail,
    createdAt: ctx.now,
    createdBy: ctx.actor.label,
  };
  project.baselines.push(version);
  project.agreementBaseline = {
    contractNumber: k.contractNumber,
    title: k.title || project.name,
    clientName: k.clientName || project.client,
    contractValue,
    startDate: version.startDate,
    deadline: version.deadline,
    paymentTerms: k.paymentTerms,
    revisionLimit: version.revisionLimit,
    scopeItems,
    milestones,
    clausesSummary: [
      ...k.penalties.map((p, i) => ({ clauseNumber: `Denda ${i + 1}`, title: 'Denda', description: p })),
      ...k.obligations.map((o, i) => ({ clauseNumber: `Kewajiban ${i + 1}`, title: 'Kewajiban', description: o })),
    ],
    sources: c.sources,
    terms: { ...EMPTY_TERMS, ...c.terms },
  };
  for (const doc of project.documents) {
    if ((doc.kind === 'CONTRACT' || doc.kind === 'RAB') && doc.status !== 'FAILED') {
      doc.status = 'APPROVED';
      doc.statusAt = ctx.now;
    }
  }
  project.planBaseline = { totalPlannedCost: version.plannedCost, items: rabItems, contingencyBudget: 0, sourceFile: c.rab.sourceFile };
  c.status = 'CONFIRMED';
  pushEvent(
    project,
    ctx,
    'BASELINE_CONFIRMED',
    'Acuan proyek V1 disetujui',
    `Nilai kontrak ${idr(contractValue)}, RAB ${idr(version.plannedCost)}, tenggat ${formatDay(version.deadline)}, ${version.revisionLimit} revisi. Sumber: ${sourceDetail}.`,
  );
  console.log(`[BASELINE] project=${project.id} V1 confirmed by ${ctx.actor.name}`);
  return version;
}

// ---------------------------------------------------------------- monitoring

const EVENT_TYPES = ['PROGRESS_UPDATED', 'MILESTONE_COMPLETED', 'REVISION_LOGGED', 'SCOPE_ADDED'] as const;

export function addMonitoringEvent(project: Project, body: Record<string, unknown>, ctx: Ctx): ProjectEvent {
  requireBaseline(project);
  const type = oneOf(body, 'type', EVENT_TYPES);
  const date = body.date ? String(body.date) : today(ctx);
  if (!isIsoDate(date)) throw badRequest('Tanggal kegiatan harus berformat YYYY-MM-DD.');
  const description = str(body, 'description', { max: 1000, label: 'Keterangan' });
  let title = str(body, 'title', { max: 200, label: 'Judul' });

  if (type === 'PROGRESS_UPDATED') {
    const progress = int(body, 'progress', { required: true, min: 0, max: 100, label: 'Progres' });
    const projected = body.projectedFinishDate ? String(body.projectedFinishDate) : undefined;
    if (projected && !isIsoDate(projected)) throw badRequest('Perkiraan selesai harus berformat YYYY-MM-DD.');
    return pushEvent(project, ctx, type, title || `Progres diperbarui ke ${progress}%`, description || (projected ? `Perkiraan selesai ${formatDay(projected)}.` : ''), date, {
      progress,
      ...(projected ? { projectedFinishDate: projected } : {}),
    });
  }

  if (type === 'MILESTONE_COMPLETED') {
    const milestoneId = str(body, 'milestoneId', { required: true, label: 'Tahap pekerjaan' });
    const milestone = project.agreementBaseline.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw notFound('Tahap pekerjaan tidak ditemukan pada acuan aktif.');
    if (milestone.status === 'COMPLETED') throw conflict(`${milestone.title} sudah ditandai selesai sebelumnya.`, 'ALREADY_COMPLETED');
    const event = pushEvent(project, ctx, type, title || `${milestone.title} selesai`, description || `Syarat tagih: ${milestone.trigger ?? milestone.title}.`, date, { milestoneId });
    milestone.status = 'COMPLETED';
    milestone.completionDate = date;
    milestone.completedEventId = event.id;
    return event;
  }

  if (type === 'REVISION_LOGGED') {
    const revisionCount = int(body, 'revisionCount', { min: 1, max: 50, fallback: 1, label: 'Jumlah revisi' });
    return pushEvent(project, ctx, type, title || (revisionCount > 1 ? `${revisionCount} revisi dicatat` : 'Revisi dicatat'), description, date, { revisionCount });
  }

  // SCOPE_ADDED: a task that may be outside the contracted scope.
  if (!title) throw badRequest('Nama pekerjaan tambahan wajib diisi.');
  const existing = project.agreementBaseline.scopeItems.find((s) => s.title.toLowerCase() === title.toLowerCase());
  if (existing) throw conflict(`"${title}" sudah ada di ruang lingkup (${existing.status === 'NEEDS_REVIEW' ? 'menunggu tinjauan' : 'tercatat'}).`, 'SCOPE_EXISTS');
  const scopeId = ctx.nextId('SCP');
  const event = pushEvent(project, ctx, type, title, description || 'Pekerjaan baru dicatat; belum ditemukan di ruang lingkup acuan.', date, { scopeItemId: scopeId });
  project.agreementBaseline.scopeItems.push({
    id: scopeId,
    title,
    description: description || 'Pekerjaan baru dari catatan kegiatan.',
    category: 'CORE_FEATURE',
    status: 'NEEDS_REVIEW',
    origin: 'EVENT',
    eventId: event.id,
    deviationNotes: 'Kemungkinan di luar ruang lingkup — perlu tinjauan.',
  });
  return event;
}

export function reviewScope(project: Project, scopeId: string, body: Record<string, unknown>, ctx: Ctx) {
  requireBaseline(project);
  const decision = oneOf(body, 'decision', ['MATCH'] as const);
  const scope = project.agreementBaseline.scopeItems.find((s) => s.id === scopeId);
  if (!scope) throw notFound('Pekerjaan tidak ditemukan.');
  if (scope.status !== 'NEEDS_REVIEW') throw conflict('Pekerjaan ini sudah ditinjau.', 'ALREADY_REVIEWED');
  const note = str(body, 'note', { max: 500 });
  scope.status = decision;
  scope.deviationNotes = `Ditinjau ${ctx.actor.name}: termasuk ruang lingkup kontrak.${note ? ` ${note}` : ''}`;
  pushEvent(project, ctx, 'SCOPE_REVIEWED', `Ruang lingkup ditinjau: ${scope.title}`, 'Dinyatakan termasuk ruang lingkup kontrak yang berlaku.', today(ctx), { scopeItemId: scope.id });
}

// ---------------------------------------------------------------- finance

const COST_CATEGORIES = ['DEVELOPMENT', 'INFRASTRUCTURE', 'DESIGN', 'THIRD_PARTY_API', 'OTHER'] as const;

export function addCost(project: Project, body: Record<string, unknown>, ctx: Ctx): ActualCostItem {
  requireBaseline(project);
  const amount = int(body, 'amount', { required: true, min: 1, max: MAX_RUPIAH, label: 'Jumlah biaya' });
  const date = body.date ? String(body.date) : today(ctx);
  if (!isIsoDate(date)) throw badRequest('Tanggal biaya harus berformat YYYY-MM-DD.');
  const cost: ActualCostItem = {
    id: ctx.nextId('CST'),
    projectId: project.id,
    date,
    category: oneOf(body, 'category', COST_CATEGORIES, 'OTHER'),
    description: str(body, 'description', { required: true, max: 300, label: 'Keterangan biaya' }),
    amount,
    submittedBy: ctx.actor.name,
  };
  project.actualCosts.unshift(cost);
  pushEvent(project, ctx, 'COST_RECORDED', `Biaya aktual dicatat ${idr(amount)}`, cost.description, date);
  return cost;
}

export function createInvoice(project: Project, body: Record<string, unknown>, ctx: Ctx) {
  requireBaseline(project);
  const milestoneId = str(body, 'milestoneId', { required: true, label: 'Tahap pekerjaan' });
  const milestone = project.agreementBaseline.milestones.find((m) => m.id === milestoneId);
  if (!milestone) throw notFound('Tahap pekerjaan tidak ditemukan pada acuan aktif.');
  if (milestone.status !== 'COMPLETED') throw conflict(`${milestone.title} belum selesai, sehingga belum siap ditagih.`, 'MILESTONE_NOT_COMPLETED');
  const billed = project.invoices.filter((i) => i.milestoneId === milestone.id && i.status !== 'DRAFT').reduce((s, i) => s + i.amount, 0);
  const remaining = milestone.value - billed;
  if (remaining <= 0) throw conflict(`${milestone.title} sudah ditagih penuh. Tagihan ganda dicegah.`, 'ALREADY_BILLED');
  const amount = int(body, 'amount', { min: 1, max: remaining, fallback: remaining, label: 'Nominal tagihan' });
  const issueDate = body.issueDate ? String(body.issueDate) : today(ctx);
  if (!isIsoDate(issueDate)) throw badRequest('Tanggal tagihan harus berformat YYYY-MM-DD.');
  const seq = project.invoices.length + 1;
  const customNumber = str(body, 'invoiceNumber', { max: 80 });
  if (customNumber && project.invoices.some((i) => i.invoiceNumber.toLowerCase() === customNumber.toLowerCase())) throw conflict(`Nomor invoice ${customNumber} sudah tercatat. Tagihan ganda dicegah.`, 'DUPLICATE_INVOICE_NUMBER');
  const invoice = {
    id: ctx.nextId('INV'),
    invoiceNumber: customNumber || `INV/${issueDate.slice(0, 4)}/${issueDate.slice(5, 7)}/${project.id}-${String(seq).padStart(3, '0')}`,
    projectId: project.id,
    milestoneId: milestone.id,
    milestoneTitle: milestone.title,
    amount,
    status: 'SENT' as const,
    issueDate,
    dueDate: addDays(issueDate, 14),
    createdBy: ctx.actor.name,
  };
  project.invoices.unshift(invoice);
  pushEvent(project, ctx, 'INVOICE_SENT', `Tagihan ${invoice.invoiceNumber} dicatat`, `${milestone.title}: ${idr(amount)}${amount < remaining ? ` (sebagian dari sisa ${idr(remaining)})` : ''}. Jatuh tempo ${formatDay(invoice.dueDate)}.`, issueDate);
  return invoice;
}

export function recordPayment(project: Project, body: Record<string, unknown>, ctx: Ctx) {
  requireBaseline(project);
  const invoiceId = str(body, 'invoiceId', { required: true, label: 'Tagihan' });
  const invoice = project.invoices.find((i) => i.id === invoiceId);
  if (!invoice) throw notFound('Tagihan tidak ditemukan pada proyek ini.');
  if (invoice.status === 'DRAFT') throw conflict('Tagihan masih draf dan belum dikirim.', 'INVOICE_DRAFT');
  const paid = project.payments.filter((p) => p.invoiceId === invoice.id).reduce((s, p) => s + p.amount, 0);
  const outstanding = invoice.amount - paid;
  if (outstanding <= 0 || invoice.status === 'PAID') throw conflict('Tagihan ini sudah lunas. Pembayaran ganda dicegah.', 'ALREADY_PAID');
  const amount = int(body, 'amount', { min: 1, max: outstanding, fallback: outstanding, label: 'Nominal pembayaran' });
  const date = body.paymentDate ? String(body.paymentDate) : today(ctx);
  if (!isIsoDate(date)) throw badRequest('Tanggal pembayaran harus berformat YYYY-MM-DD.');
  const payment = { id: ctx.nextId('PAY'), projectId: project.id, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, amount, date, recordedBy: ctx.actor.name };
  project.payments.unshift(payment);
  if (amount === outstanding) invoice.paymentDate = date;
  pushEvent(project, ctx, 'PAYMENT_RECEIVED', `Pembayaran ${invoice.invoiceNumber} diterima`, `${idr(amount)}${amount < outstanding ? ` (sebagian, sisa ${idr(outstanding - amount)})` : ' (lunas)'}.`, date);
  return payment;
}

// ---------------------------------------------------------------- change requests

export function createChangeRequest(project: Project, body: Record<string, unknown>, ctx: Ctx): ChangeRequest {
  const active = requireBaseline(project);
  const title = str(body, 'title', { required: true, max: 200, label: 'Judul perubahan' });
  const rawScope = body.additionalScope;
  const additionalScope = (Array.isArray(rawScope) ? rawScope.map(String) : typeof rawScope === 'string' ? rawScope.split(',') : [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const additionalValue = int(body, 'additionalValue', { min: 0, max: MAX_RUPIAH, label: 'Tambahan nilai' });
  const additionalRevisions = int(body, 'additionalRevisions', { min: 0, max: 100, label: 'Tambahan revisi' });
  const deadlineExtensionDays = int(body, 'deadlineExtensionDays', { min: 0, max: 730, label: 'Perpanjangan waktu' });
  if (!additionalScope.length && !additionalValue && !additionalRevisions && !deadlineExtensionDays) {
    throw badRequest('Isi minimal satu perubahan: pekerjaan, nilai, revisi, atau perpanjangan waktu.');
  }
  const submit = body.submit !== false;
  if (submit) requireRole(ctx, ['BUDI', 'ADMIN'], 'Pengajuan perubahan dilakukan oleh pengelola proyek (Budi).');
  const cr: ChangeRequest = {
    id: ctx.nextId('CR'),
    projectId: project.id,
    crNumber: `CR/${project.id}/${String(project.changeRequests.length + 1).padStart(3, '0')}`,
    title,
    description: str(body, 'description', { max: 1000 }),
    reason: str(body, 'reason', { max: 500 }) || 'Permintaan perubahan dari klien',
    additionalScope,
    additionalValue,
    additionalRevisions,
    deadlineExtensionDays,
    status: submit ? 'PENDING' : 'DRAFT',
    baseVersion: active.label,
    createdAt: ctx.now,
    createdBy: ctx.actor.label,
    origin: body.origin === 'AI_DRAFT' ? 'AI_DRAFT' : 'MANUAL',
    calculation: Array.isArray(body.calculation) ? body.calculation.map(String).slice(0, 20) : [],
    relatedAlertIds: Array.isArray(body.relatedAlertIds) ? body.relatedAlertIds.map(String).slice(0, 20) : [],
    history: [{ at: ctx.now, by: ctx.actor.label, action: 'CREATED', note: body.origin === 'AI_DRAFT' ? 'Disiapkan CLARA dari temuan; menunggu tinjauan pengelola proyek.' : undefined }],
  };
  project.changeRequests.unshift(cr);
  if (submit) {
    cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'SUBMITTED' });
    pushEvent(project, ctx, 'CHANGE_REQUEST_SUBMITTED', `Permintaan perubahan ${cr.crNumber} diajukan`, describeChange(cr));
  }
  return cr;
}

const EDITABLE: ChangeRequest['status'][] = ['DRAFT', 'REJECTED', 'CLIENT_REJECTED'];

/** PIC edits a draft (or a rejected request before resubmitting). Numbers stay integers; nothing is applied. */
export function updateChangeRequest(project: Project, crId: string, body: Record<string, unknown>, ctx: Ctx) {
  const cr = findCr(project, crId);
  if (!EDITABLE.includes(cr.status)) throw conflict('Permintaan hanya dapat diubah saat draf atau setelah ditolak.', 'INVALID_TRANSITION');
  requireRole(ctx, ['BUDI', 'ADMIN'], 'Perubahan isi dilakukan oleh pengelola proyek (Budi).');
  if ('title' in body) cr.title = str(body, 'title', { required: true, max: 200, label: 'Judul perubahan' });
  if ('description' in body) cr.description = str(body, 'description', { max: 2000 });
  if ('reason' in body) cr.reason = str(body, 'reason', { max: 500 }) || cr.reason;
  if ('additionalScope' in body) {
    const raw = body.additionalScope;
    cr.additionalScope = (Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? raw.split(',') : []).map((x) => x.trim()).filter(Boolean).slice(0, 20);
  }
  if ('additionalValue' in body) cr.additionalValue = int(body, 'additionalValue', { min: 0, max: MAX_RUPIAH, label: 'Tambahan nilai' });
  if ('additionalRevisions' in body) cr.additionalRevisions = int(body, 'additionalRevisions', { min: 0, max: 100, label: 'Tambahan revisi' });
  if ('deadlineExtensionDays' in body) cr.deadlineExtensionDays = int(body, 'deadlineExtensionDays', { min: 0, max: 730, label: 'Perpanjangan waktu' });
  if (!cr.additionalScope.length && !cr.additionalValue && !cr.additionalRevisions && !cr.deadlineExtensionDays) {
    throw badRequest('Isi minimal satu perubahan: pekerjaan, nilai, revisi, atau perpanjangan waktu.');
  }
  cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'EDITED' });
  return cr;
}

function describeChange(cr: ChangeRequest) {
  return [
    cr.additionalValue ? `+${idr(cr.additionalValue)}` : '',
    cr.additionalRevisions ? `+${cr.additionalRevisions} revisi` : '',
    cr.deadlineExtensionDays ? `+${cr.deadlineExtensionDays} hari` : '',
    cr.additionalScope.length ? `pekerjaan: ${cr.additionalScope.join(', ')}` : '',
  ].filter(Boolean).join(' · ');
}

function findCr(project: Project, crId: string) {
  const cr = project.changeRequests.find((c) => c.id === crId);
  if (!cr) throw notFound('Permintaan perubahan tidak ditemukan.');
  return cr;
}

export function submitChangeRequest(project: Project, crId: string, ctx: Ctx) {
  const cr = findCr(project, crId);
  if (!EDITABLE.includes(cr.status)) throw conflict(`Permintaan berstatus ${cr.status} dan tidak dapat diajukan lagi.`, 'INVALID_TRANSITION');
  requireRole(ctx, ['BUDI', 'ADMIN'], 'Pengajuan perubahan dilakukan oleh pengelola proyek (Budi).');
  const resubmit = cr.status !== 'DRAFT';
  cr.status = 'PENDING';
  cr.financeReview = undefined;
  cr.internalDecision = undefined;
  cr.clientApproval = undefined;
  cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'SUBMITTED', note: resubmit ? 'Diajukan ulang setelah revisi.' : undefined });
  pushEvent(project, ctx, 'CHANGE_REQUEST_SUBMITTED', `Permintaan perubahan ${cr.crNumber} ${resubmit ? 'diajukan ulang' : 'diajukan'}`, describeChange(cr));
  return cr;
}

/** Finance confirms the deterministic impact and evidence. */
export function financeReviewChangeRequest(project: Project, crId: string, body: Record<string, unknown>, ctx: Ctx) {
  const cr = findCr(project, crId);
  if (cr.status !== 'PENDING') throw conflict(`Tinjauan keuangan hanya untuk permintaan yang menunggu (status saat ini ${cr.status}).`, 'INVALID_TRANSITION');
  requireRole(ctx, ['SITI', 'ADMIN'], 'Tinjauan dampak keuangan dilakukan oleh tim keuangan (Siti).');
  const note = str(body, 'note', { max: 500 }) || undefined;
  cr.status = 'FINANCE_REVIEWED';
  cr.financeReview = { by: ctx.actor.label, at: ctx.now, note };
  cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'FINANCE_REVIEWED', note });
  pushEvent(project, ctx, 'CHANGE_REQUEST_SUBMITTED', `${cr.crNumber}: dampak keuangan ditinjau`, note ?? `Dampak ${describeChange(cr)} dikonfirmasi keuangan.`);
  return cr;
}

/** Internal decision by the decision maker. Approval does NOT change the baseline: client approval is still required. */
export function decideChangeRequest(project: Project, crId: string, body: Record<string, unknown>, ctx: Ctx) {
  const cr = findCr(project, crId);
  if (cr.status === 'APPROVED' || cr.status === 'INTERNAL_APPROVED') throw conflict('Permintaan ini sudah disetujui internal. Persetujuan ulang dicegah.', 'ALREADY_APPROVED');
  if (cr.status !== 'FINANCE_REVIEWED') throw conflict(`Keputusan internal memerlukan tinjauan keuangan terlebih dahulu (status saat ini ${cr.status}).`, 'INVALID_TRANSITION');
  requireRole(ctx, ['HENDRA', 'ADMIN'], 'Keputusan internal dilakukan oleh pimpinan (Hendra).');
  const decision = oneOf(body, 'decision', ['APPROVE', 'REJECT'] as const);
  const note = str(body, 'note', { max: 500, required: decision === 'REJECT', label: 'Alasan penolakan' }) || undefined;
  cr.internalDecision = { by: ctx.actor.label, at: ctx.now, approved: decision === 'APPROVE', note };
  cr.decidedBy = ctx.actor.label;
  cr.decisionNote = note;
  if (decision === 'APPROVE') {
    cr.status = 'INTERNAL_APPROVED';
    cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'INTERNAL_APPROVED', note });
    pushEvent(project, ctx, 'CHANGE_REQUEST_SUBMITTED', `${cr.crNumber} disetujui internal — menunggu persetujuan klien`, 'Acuan belum berubah sampai bukti persetujuan klien dicatat.');
    console.log(`[CR] ${cr.crNumber} internally approved by ${ctx.actor.name}`);
  } else {
    cr.status = 'REJECTED';
    cr.rejectedAt = ctx.now;
    cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'REJECTED', note });
    pushEvent(project, ctx, 'CHANGE_REQUEST_REJECTED', `Permintaan perubahan ${cr.crNumber} ditolak internal`, `${note}. Acuan ${project.baselineVersion} tetap aktif; pengelola proyek dapat merevisi dan mengajukan ulang.`);
  }
  return cr;
}

/** External/client approval evidence. Only an approved client decision makes the change official (new baseline). */
export function recordClientApproval(project: Project, crId: string, body: Record<string, unknown>, ctx: Ctx): ChangeRequest {
  const cr = findCr(project, crId);
  if (cr.status === 'APPROVED') throw conflict('Perubahan ini sudah resmi. Persetujuan ulang dicegah.', 'ALREADY_APPROVED');
  if (cr.status !== 'INTERNAL_APPROVED') throw conflict(`Persetujuan klien dicatat setelah persetujuan internal (status saat ini ${cr.status}).`, 'INVALID_TRANSITION');
  const decision = oneOf(body, 'decision', ['APPROVED', 'REJECTED'] as const);
  const reference = str(body, 'reference', { max: 300, label: 'Rujukan bukti' });
  const documentId = str(body, 'documentId', { max: 80 }) || undefined;
  if (documentId) {
    const doc = project.documents.find((d) => d.id === documentId);
    if (!doc) throw notFound('Dokumen bukti persetujuan tidak ditemukan.');
  }
  if (!documentId && reference.length < 5) throw badRequest('Lampirkan dokumen persetujuan klien atau tulis rujukan bukti (mis. nomor surat / email tanggal).', 'EVIDENCE_REQUIRED');
  const note = str(body, 'note', { max: 500 }) || undefined;
  cr.clientApproval = { by: ctx.actor.label, at: ctx.now, approved: decision === 'APPROVED', reference: reference || 'Dokumen terlampir', documentId, note };
  if (decision === 'REJECTED') {
    cr.status = 'CLIENT_REJECTED';
    cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'CLIENT_REJECTED', note: note ?? reference });
    pushEvent(project, ctx, 'CHANGE_REQUEST_REJECTED', `Klien menolak ${cr.crNumber}`, `Acuan ${project.baselineVersion} tetap aktif. Bukti: ${cr.clientApproval.reference}.`);
    return cr;
  }
  if (documentId) {
    const doc = project.documents.find((d) => d.id === documentId)!;
    doc.status = 'APPROVED';
  }
  cr.history.push({ at: ctx.now, by: ctx.actor.label, action: 'CLIENT_APPROVED', note: cr.clientApproval.reference });
  applyApprovedChange(project, cr, ctx);
  return cr;
}

/** Only an official (client-approved) change creates a new baseline version. The previous version is archived, never edited. */
function applyApprovedChange(project: Project, cr: ChangeRequest, ctx: Ctx): BaselineVersion {
  const previous = requireBaseline(project);
  const nextNumber = Math.max(...project.baselines.map((b) => b.version)) + 1;
  const label = `V${nextNumber}`;
  const agreement = project.agreementBaseline;
  const contractValue = previous.contractValue + cr.additionalValue;
  const deadline = cr.deadlineExtensionDays ? addDays(previous.deadline, cr.deadlineExtensionDays) : previous.deadline;
  const revisionLimit = previous.revisionLimit + cr.additionalRevisions;

  // Scope: tasks flagged for review that this change covers become approved changes.
  const versionScope = structuredClone(previous.scopeItems);
  for (const title of cr.additionalScope) {
    const flagged = agreement.scopeItems.find((s) => s.title.toLowerCase() === title.toLowerCase());
    if (flagged) {
      flagged.status = 'APPROVED_CHANGE';
      flagged.deviationNotes = `Disahkan melalui ${cr.crNumber} (${label}).`;
      versionScope.push({ ...structuredClone(flagged) });
    } else {
      const item: ScopeItem = { id: ctx.nextId('SCP'), title, description: `Disahkan melalui ${cr.crNumber}.`, category: 'CORE_FEATURE', status: 'APPROVED_CHANGE', origin: 'CHANGE_REQUEST' };
      agreement.scopeItems.push(item);
      versionScope.push(structuredClone(item));
    }
  }

  // Additional value becomes its own billable milestone; existing entitlements stay as contracted.
  if (cr.additionalValue > 0) {
    agreement.milestones.push({
      id: ctx.nextId('MLS'),
      title: `Pekerjaan tambahan ${cr.crNumber}`,
      percentage: Math.round((cr.additionalValue / contractValue) * 10000) / 100,
      value: cr.additionalValue,
      basisContractValue: contractValue,
      trigger: `Pekerjaan adendum ${cr.crNumber} selesai dan diterima`,
      targetDate: deadline,
      status: 'PENDING',
      billingStatus: 'UNBILLED',
    });
  }

  const changes: NonNullable<BaselineVersion['changes']> = [];
  if (cr.additionalValue) changes.push({ field: 'contractValue', label: 'Nilai kontrak', from: idr(previous.contractValue), to: idr(contractValue) });
  if (cr.additionalRevisions) changes.push({ field: 'revisionLimit', label: 'Batas revisi', from: String(previous.revisionLimit), to: String(revisionLimit) });
  if (cr.deadlineExtensionDays) changes.push({ field: 'deadline', label: 'Tenggat', from: formatDay(previous.deadline), to: formatDay(deadline) });
  if (cr.additionalScope.length) changes.push({ field: 'scope', label: 'Ruang lingkup', from: `${previous.scopeItems.length} pekerjaan`, to: `${versionScope.length} pekerjaan` });

  previous.status = 'ARCHIVED';
  const version: BaselineVersion = {
    id: ctx.nextId('BLV'),
    version: nextNumber,
    label,
    status: 'ACTIVE',
    contractValue,
    plannedCost: previous.plannedCost,
    startDate: previous.startDate,
    deadline,
    revisionLimit,
    paymentTerms: previous.paymentTerms,
    milestones: structuredClone(agreement.milestones),
    scopeItems: versionScope,
    rabItems: structuredClone(previous.rabItems),
    terms: previous.terms ? { ...previous.terms } : undefined,
    source: 'CHANGE_REQUEST',
    sourceDetail: `${cr.crNumber} disetujui ${ctx.actor.name}`,
    changeRequestId: cr.id,
    changes,
    createdAt: ctx.now,
    createdBy: ctx.actor.label,
  };
  project.baselines.push(version);

  agreement.contractValue = contractValue;
  agreement.deadline = deadline;
  agreement.revisionLimit = revisionLimit;
  if (cr.additionalValue) agreement.paymentTerms = `${agreement.paymentTerms} ${cr.crNumber}: ${idr(cr.additionalValue)} setelah pekerjaan adendum diterima.`.trim();

  cr.status = 'APPROVED';
  cr.approvedAt = ctx.now;
  cr.decidedBy = ctx.actor.label;
  cr.resultingBaselineVersion = label;
  pushEvent(project, ctx, 'CHANGE_REQUEST_APPROVED', `${cr.crNumber} resmi (disetujui internal & klien) — acuan naik ke ${label}`, `${describeChange(cr)}. Acuan ${previous.label} diarsipkan. Bukti klien: ${cr.clientApproval?.reference ?? '-'}.`);
  console.log(`[CR] ${cr.crNumber} client approval recorded by ${ctx.actor.name}`);
  console.log(`[BASELINE] project=${project.id} ${label} activated from ${cr.crNumber}`);
  return version;
}

// ---------------------------------------------------------------- alerts

export function acknowledgeAlert(project: Project, alertId: string) {
  const alert = project.alerts.find((a) => a.id === alertId);
  if (!alert) throw notFound('Peringatan tidak ditemukan.');
  if (alert.status === 'RESOLVED') throw conflict('Peringatan ini sudah selesai.', 'ALREADY_RESOLVED');
  alert.status = 'ACKNOWLEDGED';
}

export function resolveAlert(project: Project, alertId: string, body: Record<string, unknown>, ctx: Ctx) {
  const alert = project.alerts.find((a) => a.id === alertId);
  if (!alert) throw notFound('Peringatan tidak ditemukan.');
  if (alert.status === 'RESOLVED') throw conflict('Peringatan ini sudah selesai.', 'ALREADY_RESOLVED');
  const note = str(body, 'note', { required: true, max: 500, label: 'Catatan penyelesaian' });
  alert.status = 'RESOLVED';
  alert.resolution = { at: ctx.now, by: ctx.actor.label, note, auto: false };
}

// ---------------------------------------------------------------- drafts (Remediation Copilot / Document Studio)

export function findDraft(project: Project, draftId: string) {
  const draft = project.drafts.find((d) => d.id === draftId);
  if (!draft) throw notFound('Draf tidak ditemukan.');
  return draft;
}

export function addDraft(project: Project, draft: GeneratedDocument) {
  project.drafts.unshift(draft);
  pushEvent(
    project,
    { now: draft.createdAt, actor: { id: 'ADMIN', name: draft.createdBy, label: draft.createdBy }, nextId: randomId },
    'DOCUMENT_UPLOADED',
    `Draf disiapkan CLARA: ${draft.title}`,
    `${draft.source === 'AI' ? 'Dibuat AI' : 'Dibuat dari templat (AI tidak tersedia)'} · ${draft.status === 'READY_FOR_REVIEW' ? 'siap ditinjau manusia' : 'perlu perbaikan'}.`,
  );
}

/** Human approval of a draft: it becomes ready to send. Nothing is sent automatically. */
export function approveDraft(project: Project, draftId: string, ctx: Ctx) {
  const draft = findDraft(project, draftId);
  if (draft.status === 'APPROVED' || draft.status === 'EXPORTED') throw conflict('Draf ini sudah disetujui.', 'ALREADY_APPROVED');
  if (draft.status === 'REJECTED') throw conflict('Draf ini sudah ditolak. Buat ulang atau revisi.', 'INVALID_TRANSITION');
  if (draft.status === 'NEEDS_FIX') throw conflict('Validasi draf belum lolos. Perbaiki isi draf terlebih dahulu.', 'VALIDATION_FAILED');
  draft.status = 'APPROVED';
  draft.approvedBy = ctx.actor.label;
  draft.approvedAt = ctx.now;
  draft.history.push({ at: ctx.now, by: ctx.actor.label, action: 'Disetujui — siap dikirim' });
}

export function rejectDraft(project: Project, draftId: string, body: Record<string, unknown>, ctx: Ctx) {
  const draft = findDraft(project, draftId);
  if (draft.status === 'EXPORTED') throw conflict('Draf sudah diekspor.', 'INVALID_TRANSITION');
  if (draft.status === 'REJECTED') throw conflict('Draf ini sudah ditolak.', 'INVALID_TRANSITION');
  draft.status = 'REJECTED';
  draft.history.push({ at: ctx.now, by: ctx.actor.label, action: 'Ditolak', note: str(body, 'note', { max: 300 }) || undefined });
}

export function markDraftExported(project: Project, draftId: string, ctx: Ctx) {
  const draft = findDraft(project, draftId);
  if (draft.status !== 'APPROVED' && draft.status !== 'EXPORTED') throw conflict('Hanya draf yang sudah disetujui manusia yang dapat diekspor untuk dikirim.', 'APPROVAL_REQUIRED');
  draft.status = 'EXPORTED';
  draft.exportedAt = ctx.now;
  draft.history.push({ at: ctx.now, by: ctx.actor.label, action: 'Diekspor (PDF) untuk dikirim oleh pengguna — CLARA tidak mengirim dokumen ke pihak luar' });
}
