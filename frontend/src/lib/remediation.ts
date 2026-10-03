// Remediation Copilot — prepares fixes for detected issues.
//
// Detect → Recommend → Generate → Self-review → Human review → Approve → Ready to send.
// Numbers in proposals come from the engine (contract terms × verified variance);
// the AI only writes the language. If the AI is unavailable, a clearly labelled
// template draft is produced instead — never a fake "AI" result.

import type { Alert, ChangeRequest, DraftCheck, DraftType, GeneratedDocument, Project } from '@/types';
import { badRequest, conflict, HttpError, notFound } from './api';
import { claraDb, makeCtx } from './db';
import { addDraft, createChangeRequest, findDraft, type Ctx } from './domain';
import { addDays, daysBetween, formatDay, idr } from './engine';
import { aiDraft, aiExplain, aiRevise, aiReviewDraft } from './ai';
import { baselineFacts, projectContext } from './context';

export const DRAFT_TYPE_LABEL: Record<DraftType, string> = {
  CHANGE_REQUEST: 'Permintaan Perubahan',
  ADDENDUM: 'Adendum Perjanjian',
  MOU: 'MoU',
  LOI: 'LoI',
  PKS: 'PKS',
  CLAUSE_REVISION: 'Usulan Revisi Klausul',
  ANOMALY_RESPONSE: 'Tindak Lanjut Temuan',
};

interface Proposal {
  title: string;
  reason: string;
  additionalScope: string[];
  additionalValue: number;
  additionalRevisions: number;
  deadlineExtensionDays: number;
  calculation: string[];
  notes: string[];
}

function findAlert(project: Project, alertId: string): Alert {
  const alert = project.alerts.find((a) => a.id === alertId);
  if (!alert) throw notFound('Temuan tidak ditemukan.');
  return alert;
}

/** Deterministic change proposal for an alert. Every number has a calculation line. */
export function proposeChange(project: Project, alert: Alert): Proposal {
  const m = project.metrics;
  const t = project.agreementBaseline.terms;
  const base: Proposal = { title: '', reason: alert.title, additionalScope: [], additionalValue: 0, additionalRevisions: 0, deadlineExtensionDays: 0, calculation: [], notes: [] };
  if (alert.type === 'REVISION_LIMIT') {
    const extra = m.revisionVariance;
    if (extra <= 0) throw conflict('Revisi sudah sesuai acuan aktif; tidak ada perubahan yang perlu diajukan.', 'NOTHING_TO_PROPOSE');
    base.title = `Tambahan ${extra} putaran revisi`;
    base.additionalRevisions = extra;
    base.calculation.push(`${m.actualRevisions} revisi tercatat − ${m.includedRevisions} revisi di acuan ${project.baselineVersion} = ${extra} revisi tambahan`);
    if (t?.revisionUnitPrice) {
      base.additionalValue = extra * t.revisionUnitPrice;
      base.calculation.push(`${extra} × ${idr(t.revisionUnitPrice)} per putaran (tarif kontrak) = ${idr(base.additionalValue)}`);
    } else base.notes.push('Kontrak tidak menyebut biaya revisi tambahan; isi nilai tambahan secara manual.');
    if (t?.revisionExtensionDays) {
      base.deadlineExtensionDays = t.revisionExtensionDays;
      base.calculation.push(`Tambahan waktu adendum revisi menurut kontrak: ${t.revisionExtensionDays} hari → tenggat ${formatDay(addDays(project.agreementBaseline.deadline, t.revisionExtensionDays))}`);
    }
  } else if (alert.type === 'SCOPE_VARIANCE') {
    const scope = project.agreementBaseline.scopeItems.find((s) => alert.id.endsWith(s.id));
    if (!scope || scope.status !== 'NEEDS_REVIEW') throw conflict('Pekerjaan ini sudah ditinjau.', 'NOTHING_TO_PROPOSE');
    base.title = `Pekerjaan tambahan: ${scope.title}`;
    base.additionalScope = [scope.title];
    base.calculation.push(`Pekerjaan "${scope.title}" tidak ada di ruang lingkup acuan ${project.baselineVersion}.`);
    base.notes.push(t?.hourlyRate ? `Isi nilai tambahan = estimasi jam × ${idr(t.hourlyRate)}/jam (tarif kontrak).` : 'Isi nilai tambahan secara manual.');
  } else if (alert.type === 'DEADLINE_RISK') {
    const days = m.deadlineVarianceDays ?? 0;
    if (days <= 0) throw conflict('Perkiraan selesai masih dalam tenggat.', 'NOTHING_TO_PROPOSE');
    base.title = `Perpanjangan waktu ${days} hari`;
    base.deadlineExtensionDays = days;
    base.calculation.push(`${formatDay(m.projectedFinish)} − ${formatDay(m.deadline)} = ${days} hari → tenggat baru ${formatDay(m.projectedFinish)}`);
  } else if (alert.type === 'DOCUMENT_INCONSISTENCY' && alert.sourceDocumentId) {
    const doc = project.documents.find((d) => d.id === alert.sourceDocumentId);
    const c = doc?.analysis?.contract;
    if (!doc || doc.kind !== 'ADDENDUM' || !c) throw badRequest('Usulan perubahan otomatis tersedia untuk adendum. Untuk invoice, gunakan "Buat tindak lanjut".', 'UNSUPPORTED_ALERT');
    base.title = `Pengesahan ${doc.fileName}`;
    if (c.contractValue !== null && c.contractValue > m.contractValue) {
      base.additionalValue = c.contractValue - m.contractValue;
      base.calculation.push(`${idr(c.contractValue)} (adendum) − ${idr(m.contractValue)} (acuan) = ${idr(base.additionalValue)}`);
    }
    if (c.deadline && m.deadline && c.deadline > m.deadline) {
      base.deadlineExtensionDays = daysBetween(m.deadline, c.deadline);
      base.calculation.push(`${formatDay(c.deadline)} − ${formatDay(m.deadline)} = ${base.deadlineExtensionDays} hari`);
    }
    if (c.revisionLimit !== null && c.revisionLimit > m.includedRevisions) {
      base.additionalRevisions = c.revisionLimit - m.includedRevisions;
      base.calculation.push(`${c.revisionLimit} − ${m.includedRevisions} = ${base.additionalRevisions} revisi`);
    }
  } else {
    throw badRequest('Untuk temuan ini gunakan "Buat tindak lanjut (AI)" — perubahan acuan tidak diperlukan.', 'UNSUPPORTED_ALERT');
  }
  if (!base.additionalScope.length && !base.additionalValue && !base.additionalRevisions && !base.deadlineExtensionDays) {
    throw conflict('Tidak ada perubahan yang dapat dihitung dari temuan ini.', 'NOTHING_TO_PROPOSE');
  }
  return base;
}

function proposalFacts(project: Project, p: Proposal): string[] {
  const m = project.metrics;
  const facts = [...baselineFacts(project), `Usulan perubahan: ${p.title}`, `Alasan: ${p.reason}`, ...p.calculation.map((c) => `Perhitungan: ${c}`)];
  if (p.additionalValue) facts.push(`Tambahan nilai: ${idr(p.additionalValue)}; nilai kontrak setelah perubahan: ${idr(m.contractValue + p.additionalValue)}`);
  if (p.additionalRevisions) facts.push(`Tambahan revisi: ${p.additionalRevisions} putaran; batas revisi setelah perubahan: ${m.includedRevisions + p.additionalRevisions} putaran`);
  if (p.deadlineExtensionDays) facts.push(`Perpanjangan waktu: ${p.deadlineExtensionDays} hari; tenggat setelah perubahan: ${formatDay(addDays(project.agreementBaseline.deadline, p.deadlineExtensionDays))}`);
  if (p.additionalScope.length) facts.push(`Pekerjaan tambahan: ${p.additionalScope.join(', ')}`);
  return facts;
}

/** Template used only when the AI service is unavailable. Clearly labelled TEMPLATE in the UI. */
function templateDraft(type: DraftType, title: string, project: Project, facts: string[], references: string[]): string {
  return [
    `# ${DRAFT_TYPE_LABEL[type]}: ${title}`,
    '',
    `**Proyek:** ${project.name}  `,
    `**Klien:** ${project.client}  `,
    `**Nomor kontrak:** ${project.agreementBaseline.contractNumber || '(akan dilengkapi para pihak)'}`,
    '',
    '## Ringkasan',
    `Dokumen ini disusun dari templat CLARA karena layanan AI tidak tersedia. Isi berdasarkan data terverifikasi berikut dan wajib ditinjau sebelum digunakan.`,
    '',
    '## Fakta terverifikasi',
    ...facts.map((f) => `- ${f}`),
    '',
    '## Dasar & Rujukan',
    ...(references.length ? references.map((r) => `- ${r}`) : ['- Acuan proyek aktif']),
    '',
    '## Persetujuan',
    'Dokumen ini berlaku setelah disetujui secara tertulis oleh para pihak.',
  ].join('\n');
}

const fmtVariants = (n: number) => [idr(n), n.toLocaleString('id-ID')].map((s) => s.replace(/\s/g, ''));

/** Self-review: deterministic checks first (authoritative), then AI + guardrail review. */
export async function validateDraft(project: Project, draft: Pick<GeneratedDocument, 'type' | 'content' | 'facts' | 'references' | 'relatedChangeRequestId'>, expected: { contractValue?: number; deadline?: string; revisionLimit?: number }): Promise<DraftCheck[]> {
  const content = draft.content;
  const compact = content.replace(/\s/g, '');
  const checks: DraftCheck[] = [];
  checks.push({ label: 'Isi draf lengkap', ok: content.trim().length >= 200, detail: content.trim().length >= 200 ? undefined : 'Draf terlalu pendek.', origin: 'DETERMINISTIC' });
  const placeholder = content.match(/\[[^\]\n]{1,40}\]|\{\{|\bTBD\b|\bXXX\b|lorem ipsum/i);
  checks.push({ label: 'Tidak ada placeholder tersisa', ok: !placeholder, detail: placeholder ? `Ditemukan "${placeholder[0]}".` : undefined, origin: 'DETERMINISTIC' });
  if (project.agreementBaseline.contractNumber) {
    const ok = content.includes(project.agreementBaseline.contractNumber);
    checks.push({ label: 'Nomor kontrak dirujuk', ok, detail: ok ? undefined : `Sebutkan ${project.agreementBaseline.contractNumber}.`, origin: 'DETERMINISTIC' });
  }
  if (expected.contractValue !== undefined) {
    const ok = fmtVariants(expected.contractValue).some((v) => compact.includes(v));
    checks.push({ label: `Nilai kontrak konsisten (${idr(expected.contractValue)})`, ok, detail: ok ? undefined : 'Nilai kontrak hasil perubahan tidak tercantum.', origin: 'DETERMINISTIC' });
  }
  if (expected.deadline) {
    const d = new Date(`${expected.deadline}T00:00:00Z`);
    const long = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
    const ok = [expected.deadline, formatDay(expected.deadline), long].some((v) => content.includes(v));
    checks.push({ label: `Tenggat konsisten (${formatDay(expected.deadline)})`, ok, detail: ok ? undefined : 'Tenggat hasil perubahan tidak tercantum.', origin: 'DETERMINISTIC' });
  }
  if (expected.revisionLimit !== undefined) {
    const ok = new RegExp(`\\b${expected.revisionLimit}\\b[^\\n]{0,40}revisi|revisi[^\\n]{0,40}\\b${expected.revisionLimit}\\b`, 'i').test(content);
    checks.push({ label: `Batas revisi konsisten (${expected.revisionLimit})`, ok, detail: ok ? undefined : 'Batas revisi hasil perubahan tidak tercantum.', origin: 'DETERMINISTIC' });
  }
  const claims = content.match(/telah ditandatangani|sudah ditandatangani|telah dikirim|sudah dikirim/i);
  checks.push({ label: 'Tidak mengklaim sudah ditandatangani/dikirim', ok: !claims, detail: claims ? `Ditemukan "${claims[0]}".` : undefined, origin: 'DETERMINISTIC' });
  const accusation = content.match(/penipuan|\bfraud\b|melanggar hukum|\bilegal\b/i);
  checks.push({ label: 'Tidak ada tuduhan tanpa dasar', ok: !accusation, detail: accusation ? `Ditemukan "${accusation[0]}".` : undefined, origin: 'DETERMINISTIC' });
  checks.push({ label: 'Rujukan bukti terlampir', ok: draft.references.length > 0, detail: draft.references.length ? `${draft.references.length} rujukan` : 'Tambahkan rujukan.', origin: 'DETERMINISTIC' });

  try {
    const issues = await aiReviewDraft(content, draft.facts);
    const blockers = issues.filter((i) => i.severity === 'BLOCKER');
    checks.push({ label: 'Tinjauan AI & guardrail', ok: blockers.length === 0, detail: issues.length ? issues.map((i) => `${i.origin === 'GUARDRAIL' ? 'Guardrail' : 'AI'}: ${i.message}`).join(' · ') : 'Tidak ada masalah ditemukan.', origin: 'AI' });
  } catch (error) {
    checks.push({ label: 'Tinjauan AI & guardrail', ok: true, detail: `Tidak tersedia (${error instanceof Error ? error.message : 'AI tidak tersedia'}) — tinjau manual.`, origin: 'AI' });
  }
  return checks;
}

const statusFrom = (checks: DraftCheck[]): GeneratedDocument['status'] => (checks.every((c) => c.ok) ? 'READY_FOR_REVIEW' : 'NEEDS_FIX');

function expectedFor(project: Project, cr?: ChangeRequest) {
  if (!cr) return {};
  return {
    contractValue: project.metrics.contractValue + cr.additionalValue,
    deadline: cr.deadlineExtensionDays ? addDays(project.agreementBaseline.deadline, cr.deadlineExtensionDays) : undefined,
    revisionLimit: cr.additionalRevisions ? project.metrics.includedRevisions + cr.additionalRevisions : undefined,
  };
}

async function writeDraft(type: DraftType, title: string, project: Project, facts: string[], references: string[], instructions?: string, originalClause?: string) {
  try {
    const r = await aiDraft({ type, title, projectContext: projectContext(project), facts, instructions, originalClause });
    return { content: r.content, source: 'AI' as const, engine: r.engine };
  } catch (error) {
    if (error instanceof HttpError && error.status === 400) throw error;
    console.warn(`[AI] draft fell back to template: ${error instanceof Error ? error.message : error}`);
    return { content: templateDraft(type, title, project, facts, references), source: 'TEMPLATE' as const, engine: `Templat CLARA (AI tidak tersedia: ${error instanceof Error ? error.message : 'galat'})` };
  }
}

async function buildDraft(project: Project, ctx: Ctx, input: { type: DraftType; title: string; facts: string[]; references: string[]; instructions?: string; originalClause?: string; relatedAlertId?: string; cr?: ChangeRequest }): Promise<GeneratedDocument> {
  const written = await writeDraft(input.type, input.title, project, input.facts, input.references, input.instructions, input.originalClause);
  const draft: GeneratedDocument = {
    id: ctx.nextId('DRF'),
    projectId: project.id,
    type: input.type,
    title: input.title,
    content: written.content,
    status: 'NEEDS_FIX',
    source: written.source,
    engine: written.engine,
    facts: input.facts,
    references: input.references,
    validation: { checks: [], checkedAt: ctx.now },
    relatedAlertId: input.relatedAlertId,
    relatedChangeRequestId: input.cr?.id,
    instructions: input.instructions,
    createdAt: ctx.now,
    createdBy: written.source === 'AI' ? `CLARA AI untuk ${ctx.actor.name}` : `Templat CLARA untuk ${ctx.actor.name}`,
    history: [{ at: ctx.now, by: ctx.actor.label, action: written.source === 'AI' ? 'Draf dibuat AI' : 'Draf dibuat dari templat (AI tidak tersedia)' }],
  };
  draft.validation.checks = await validateDraft(project, draft, expectedFor(project, input.cr));
  draft.status = statusFrom(draft.validation.checks);
  console.log(`[AI] draft generated type=${draft.type} source=${draft.source} status=${draft.status}`);
  return draft;
}

function alertReferences(alert: Alert): string[] {
  return alert.evidence.map((e) => `${e.title}${e.source ? ` — ${e.source}` : ''}`);
}

/** "Generate Change Request" from an alert: deterministic proposal → CR (DRAFT) + addendum draft for review. */
export async function draftChangeRequestFromAlert(projectId: string, alertId: string) {
  const ctx = makeCtx();
  const project = claraDb.requireProject(projectId);
  const alert = findAlert(project, alertId);
  const existing = project.changeRequests.find((cr) => cr.relatedAlertIds.includes(alertId) && cr.status !== 'APPROVED' && cr.status !== 'REJECTED' && cr.status !== 'CLIENT_REJECTED');
  if (existing) throw conflict(`Permintaan perubahan ${existing.crNumber} untuk temuan ini sudah ada (${existing.status}).`, 'ALREADY_DRAFTED');
  const proposal = proposeChange(project, alert);
  const facts = proposalFacts(project, proposal);
  const references = alertReferences(alert);
  const draftCr: ChangeRequest = { id: 'tmp', projectId, crNumber: '', title: proposal.title, description: '', reason: proposal.reason, additionalScope: proposal.additionalScope, additionalValue: proposal.additionalValue, additionalRevisions: proposal.additionalRevisions, deadlineExtensionDays: proposal.deadlineExtensionDays, status: 'DRAFT', baseVersion: project.baselineVersion, createdAt: ctx.now, createdBy: ctx.actor.label, origin: 'AI_DRAFT', calculation: proposal.calculation, relatedAlertIds: [alertId], history: [] };
  const draft = await buildDraft(project, ctx, { type: 'CHANGE_REQUEST', title: proposal.title, facts, references, relatedAlertId: alertId, cr: draftCr });
  const { project: saved, result } = claraDb.mutate(projectId, (p) => {
    const cr = createChangeRequest(
      p,
      {
        title: proposal.title,
        reason: proposal.reason,
        description: [...proposal.calculation, ...proposal.notes].join(' · '),
        additionalScope: proposal.additionalScope,
        additionalValue: proposal.additionalValue,
        additionalRevisions: proposal.additionalRevisions,
        deadlineExtensionDays: proposal.deadlineExtensionDays,
        submit: false,
        origin: 'AI_DRAFT',
        calculation: proposal.calculation,
        relatedAlertIds: [alertId],
      },
      ctx,
    );
    draft.relatedChangeRequestId = cr.id;
    draft.content = draft.content.replaceAll('Permintaan Perubahan:', `Permintaan Perubahan ${cr.crNumber}:`);
    cr.draftId = draft.id;
    addDraft(p, draft);
    return { crId: cr.id, draftId: draft.id };
  });
  console.log(`[CR] AI draft created for alert=${alertId} project=${projectId}`);
  return { project: saved, ...result };
}

/** Document Studio / remediation draft (addendum, MoU, LoI, PKS, clause revision, anomaly response). */
export async function generateDocument(projectId: string, body: { type: DraftType; title?: string; instructions?: string; alertId?: string; changeRequestId?: string; originalClause?: string }) {
  const ctx = makeCtx();
  const project = claraDb.requireProject(projectId);
  const alert = body.alertId ? findAlert(project, body.alertId) : undefined;
  const cr = body.changeRequestId ? project.changeRequests.find((c) => c.id === body.changeRequestId) : undefined;
  if (body.changeRequestId && !cr) throw notFound('Permintaan perubahan tidak ditemukan.');
  if (!project.metrics.hasBaseline && (body.type === 'ADDENDUM' || body.type === 'CHANGE_REQUEST')) throw conflict('Adendum dan permintaan perubahan memerlukan acuan proyek yang disetujui.', 'BASELINE_REQUIRED');
  const facts = project.metrics.hasBaseline ? baselineFacts(project) : [`Proyek: ${project.name}`, `Klien: ${project.client}`];
  if (cr) {
    facts.push(`Permintaan perubahan ${cr.crNumber}: ${cr.title}`, ...cr.calculation.map((c) => `Perhitungan: ${c}`));
    const exp = expectedFor(project, cr);
    if (cr.additionalValue) facts.push(`Tambahan nilai: ${idr(cr.additionalValue)}; nilai kontrak setelah perubahan: ${idr(exp.contractValue!)}`);
    if (cr.additionalRevisions) facts.push(`Batas revisi setelah perubahan: ${exp.revisionLimit} putaran`);
    if (exp.deadline) facts.push(`Tenggat setelah perubahan: ${formatDay(exp.deadline)}`);
    if (cr.additionalScope.length) facts.push(`Pekerjaan tambahan: ${cr.additionalScope.join(', ')}`);
  }
  if (alert) facts.push(`Temuan: ${alert.title}`, `Penjelasan temuan: ${alert.description}`, ...alert.evidence.filter((e) => e.kind === 'CALCULATION').map((e) => `Perhitungan: ${e.detail}`));
  const originalClause = body.originalClause || (alert?.type === 'CONTRACT_RISK' ? alert.evidence.find((e) => e.kind === 'CONTRACT')?.detail : undefined);
  const title = body.title?.trim() || (cr ? `${DRAFT_TYPE_LABEL[body.type]} ${cr.crNumber}` : alert ? `${DRAFT_TYPE_LABEL[body.type]}: ${alert.title}` : `${DRAFT_TYPE_LABEL[body.type]} ${project.name}`);
  const references = alert ? alertReferences(alert) : [`Acuan ${project.baselineVersion}${project.agreementBaseline.contractNumber ? ` · ${project.agreementBaseline.contractNumber}` : ''}`];
  const draft = await buildDraft(project, ctx, { type: body.type, title: title.slice(0, 200), facts, references, instructions: body.instructions, originalClause, relatedAlertId: alert?.id, cr });
  const { project: saved } = claraDb.mutate(projectId, (p) => {
    addDraft(p, draft);
    if (cr && !cr.draftId) {
      const target = p.changeRequests.find((c) => c.id === cr.id);
      if (target) target.draftId = draft.id;
    }
  });
  return { project: saved, draftId: draft.id };
}

/** Revise with an AI instruction, or save a manual edit. Always re-validated; approval resets. */
export async function reviseDocument(projectId: string, draftId: string, body: { instruction?: string; content?: string }) {
  const ctx = makeCtx();
  const project = claraDb.requireProject(projectId);
  const draft = findDraft(project, draftId);
  if (draft.status === 'EXPORTED') throw conflict('Draf yang sudah diekspor tidak dapat diubah. Buat draf baru.', 'INVALID_TRANSITION');
  let content: string;
  let action: string;
  let engine = draft.engine;
  if (body.content !== undefined) {
    content = String(body.content).slice(0, 60_000);
    if (content.trim().length < 20) throw badRequest('Isi draf terlalu pendek.');
    action = 'Diedit manual';
  } else if (body.instruction && body.instruction.trim().length >= 3) {
    const r = await aiRevise(draft.content, body.instruction.trim().slice(0, 2000), draft.facts);
    content = r.content;
    engine = r.engine;
    action = `Direvisi AI: ${body.instruction.trim().slice(0, 120)}`;
  } else throw badRequest('Kirim instruksi revisi (min. 3 karakter) atau isi draf.');
  const cr = draft.relatedChangeRequestId ? project.changeRequests.find((c) => c.id === draft.relatedChangeRequestId) : undefined;
  const checks = await validateDraft(project, { ...draft, content }, expectedFor(project, cr));
  return claraDb.mutate(projectId, (p) => {
    const target = findDraft(p, draftId);
    target.content = content;
    target.engine = engine;
    target.validation = { checks, checkedAt: new Date().toISOString() };
    target.status = statusFrom(checks);
    target.approvedAt = undefined;
    target.approvedBy = undefined;
    target.history.push({ at: ctx.now, by: ctx.actor.label, action });
  }).project;
}

/** Plain-language AI explanation of an alert, using only engine-verified numbers. Stored on the alert. */
export async function explainAlert(alertId: string) {
  const owner = claraDb.findAlertProject(alertId);
  const alert = findAlert(owner, alertId);
  const facts = [...baselineFacts(owner), ...alert.evidence.filter((e) => e.kind === 'CALCULATION').map((e) => e.detail), `Nilai terkait: ${idr(alert.rupiahImpact)} (${alert.impactLabel})`];
  const result = await aiExplain({ title: alert.title, description: alert.description, evidence: alert.evidence.map((e) => `${e.title}: ${e.detail}`), facts, projectContext: projectContext(owner) });
  const { project } = claraDb.mutate(owner.id, (p) => {
    const target = p.alerts.find((a) => a.id === alertId);
    if (target) target.aiExplanation = { text: result.text, engine: result.engine, at: new Date().toISOString() };
  });
  return project.alerts.find((a) => a.id === alertId)!;
}
