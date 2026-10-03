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
  ExtractionCandidate,
  Milestone,
  Project,
  ProjectDocument,
  ProjectEvent,
  ProjectEventType,
  ScopeItem,
  UserPersonaId,
} from '@/types';
import { USER_PERSONAS } from '@/types';
import { addDays, allocateMilestoneValues, emptyMetrics, formatDay, idr, isIsoDate } from './engine';
import { badRequest, conflict, int, MAX_RUPIAH, notFound, oneOf, str } from './api';

export interface Ctx {
  now: string;
  actor: { id: UserPersonaId; name: string; label: string };
  nextId: (prefix: string) => string;
}

export function actorFor(id: UserPersonaId) {
  const persona = USER_PERSONAS[id] ?? USER_PERSONAS.BUDI;
  return { id: persona.id, name: persona.name, label: `${persona.name} (${persona.roleTitle.split(' ')[0]})` };
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

export function addDocument(project: Project, ctx: Ctx, doc: Omit<ProjectDocument, 'id' | 'uploadedAt' | 'uploadedBy'>, id = ctx.nextId('DOC')): ProjectDocument {
  if (project.baselines.length > 0) throw conflict('Acuan proyek sudah disetujui. Perubahan dokumen dilakukan melalui permintaan perubahan.', 'BASELINE_LOCKED');
  if (project.extraction?.status === 'PROCESSING') throw conflict('Analisis dokumen sedang berjalan. Tunggu hingga selesai.', 'EXTRACTION_IN_PROGRESS');
  const record: ProjectDocument = { ...doc, id, uploadedAt: ctx.now, uploadedBy: ctx.actor.label };
  project.documents.push(record);
  pushEvent(project, ctx, 'DOCUMENT_UPLOADED', `${doc.kind === 'CONTRACT' ? 'Kontrak' : 'RAB'} diunggah: ${doc.fileName}`, doc.isSample ? 'Berkas contoh untuk demo.' : `${Math.ceil(doc.size / 1024)} KB`);
  return record;
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
  if (raw === null || raw === '') return null;
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
  };
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
  const invoice = {
    id: ctx.nextId('INV'),
    invoiceNumber: `INV/${issueDate.slice(0, 4)}/${issueDate.slice(5, 7)}/${project.id}-${String(seq).padStart(3, '0')}`,
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
  };
  project.changeRequests.unshift(cr);
  if (submit) pushEvent(project, ctx, 'CHANGE_REQUEST_SUBMITTED', `Permintaan perubahan ${cr.crNumber} diajukan`, describeChange(cr));
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
  if (cr.status !== 'DRAFT') throw conflict(`Permintaan berstatus ${cr.status} dan tidak dapat diajukan lagi.`, 'INVALID_TRANSITION');
  cr.status = 'PENDING';
  pushEvent(project, ctx, 'CHANGE_REQUEST_SUBMITTED', `Permintaan perubahan ${cr.crNumber} diajukan`, describeChange(cr));
  return cr;
}

export function rejectChangeRequest(project: Project, crId: string, body: Record<string, unknown>, ctx: Ctx) {
  const cr = findCr(project, crId);
  if (cr.status !== 'PENDING') throw conflict(cr.status === 'REJECTED' ? 'Permintaan ini sudah ditolak.' : `Permintaan berstatus ${cr.status} tidak dapat ditolak.`, 'INVALID_TRANSITION');
  cr.status = 'REJECTED';
  cr.rejectedAt = ctx.now;
  cr.decidedBy = ctx.actor.label;
  cr.decisionNote = str(body, 'note', { max: 500 }) || undefined;
  pushEvent(project, ctx, 'CHANGE_REQUEST_REJECTED', `Permintaan perubahan ${cr.crNumber} ditolak`, cr.decisionNote ?? 'Acuan proyek tidak berubah.');
  return cr;
}

/** Only APPROVED changes create a new baseline version. The previous version is archived, never edited. */
export function approveChangeRequest(project: Project, crId: string, ctx: Ctx): BaselineVersion {
  const cr = findCr(project, crId);
  if (cr.status !== 'PENDING') {
    throw conflict(
      cr.status === 'APPROVED' ? 'Permintaan perubahan ini sudah disetujui. Persetujuan ulang dicegah.' : `Permintaan berstatus ${cr.status} tidak dapat disetujui.`,
      cr.status === 'APPROVED' ? 'ALREADY_APPROVED' : 'INVALID_TRANSITION',
    );
  }
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
  pushEvent(project, ctx, 'CHANGE_REQUEST_APPROVED', `${cr.crNumber} disetujui — acuan naik ke ${label}`, `${describeChange(cr)}. Acuan ${previous.label} diarsipkan.`);
  console.log(`[BASELINE] project=${project.id} ${label} approved from ${cr.crNumber} by ${ctx.actor.name}`);
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
