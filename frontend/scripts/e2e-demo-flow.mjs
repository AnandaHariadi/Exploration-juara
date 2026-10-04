// End-to-end API test of the CLARA pitch scenario against a running app.
//   BASE_URL=http://localhost:3000 node scripts/e2e-demo-flow.mjs
//   E2E_MODE=AI  → automatic AI analysis, invoice cross-checks, explanations
//                 (needs the AI service; use the Gemini stub without a key)
// Rerunnable: it starts and ends with a demo reset.

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const MODE = process.env.E2E_MODE === 'AI' ? 'AI' : 'SAMPLE';
let pass = 0;
let fail = 0;

function check(name, condition, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail !== '' ? ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
  }
}

async function call(method, path, body, raw) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined && !raw ? { 'Content-Type': 'application/json' } : undefined,
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const type = res.headers.get('content-type') ?? '';
  const json = type.includes('json') ? await res.json().catch(() => null) : null;
  return { status: res.status, json, data: json?.data, type };
}

const as = (personaId) => call('POST', '/api/demo/session', { personaId });
const stable = (summary) => JSON.stringify({ ...summary, computedAt: undefined });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const open = (a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED';

async function waitProject(id, predicate, label, timeoutMs = 60_000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    last = (await call('GET', `/api/projects/${id}`)).data;
    if (last && predicate(last)) return last;
    await sleep(500);
  }
  check(`${label} (timed out)`, false, last?.documents?.map((d) => `${d.fileName}:${d.status}`).join(', '));
  return last;
}

console.log(`CLARA e2e · ${BASE} · mode=${MODE}`);

console.log('\n1. Reset is idempotent');
const r1 = await call('POST', '/api/demo/reset');
const r2 = await call('POST', '/api/demo/reset');
check('reset returns 200', r1.status === 200 && r2.status === 200);
check('two resets give identical portfolio', stable(r1.data) === stable(r2.data));
const seeded = await call('GET', '/api/projects/PRJ-ASL');
check('seeded pitch project is DRAFT with contract + RAB (uploaded)', seeded.data?.status === 'DRAFT' && seeded.data?.documents?.length === 2 && seeded.data.documents.every((d) => d.status === 'UPLOADED'));

console.log('\n2. Persona & AI health');
check('Budi selected', (await as('BUDI')).data?.activePersonaId === 'BUDI');
check('invalid persona rejected', (await call('POST', '/api/demo/session', { personaId: 'EVE' })).status === 400);
const health = await call('GET', '/api/ai/health');
check('AI health responds', health.status === 200 && typeof health.data?.available === 'boolean');
console.log(`    AI available: ${health.data?.available} (${health.data?.message})`);
if (MODE === 'AI' && !health.data?.available) {
  console.log('AI mode requested but AI is unavailable. Start the AI service (or the stub).');
  process.exit(1);
}

console.log('\n3. Create project with contract + RAB → automatic analysis');
const created = await call('POST', '/api/projects', { name: 'Sistem Manajemen Armada', client: 'PT Astra Sahabat Logistik', useSample: true });
const P = created.data?.id;
check('project created as DRAFT with 2 documents', created.status === 201 && created.data?.status === 'DRAFT' && created.data?.documents.length === 2);
let proj = await waitProject(P, (p) => p.documents.every((d) => d.status !== 'PROCESSING' && d.status !== 'UPLOADED'), 'documents analyzed automatically');
const rabDoc = proj.documents.find((d) => d.kind === 'RAB');
check('RAB parsed deterministically (no AI)', rabDoc?.status === 'ANALYZED' && /deterministik/.test(rabDoc?.analysis?.engine ?? ''));
if (MODE === 'AI') {
  const contractDoc = proj.documents.find((d) => d.kind === 'CONTRACT');
  check('contract analyzed by AI without a click (NEEDS_REVIEW)', contractDoc?.status === 'NEEDS_REVIEW' && proj.extraction?.source === 'AI' && proj.extraction?.status === 'READY');
  check('analysis has summary + confidence + guardrail-capable findings', Boolean(contractDoc?.analysis?.summary) && contractDoc?.analysis?.confidence > 0);
  check('paraphrased quote flagged unverified', proj.extraction?.sources?.scope?.verified === false && proj.extraction.warnings.some((w) => /scope/.test(w)));
  check('malformed AI date nulled with warning', proj.extraction?.milestones?.[1]?.targetDate === null && proj.extraction.warnings.some((w) => /30-11-2026/.test(w)));
} else {
  const ex = await call('POST', `/api/projects/${P}/extract`, { mode: 'SAMPLE' });
  check('labelled sample data loaded', ex.status === 200 && ex.data?.extraction?.source === 'SAMPLE', ex.json?.error);
  proj = ex.data;
}
const c = proj?.extraction;
check('candidate is not a baseline', proj?.status === 'BASELINE_PENDING' && proj?.baselines.length === 0);
check('contract Rp120M · RAB Rp75M · 30 Nov 2026 · 3 revisions', c?.contract.contractValue === 120_000_000 && c?.rab.total === 75_000_000 && c?.contract.deadline === '2026-11-30' && c?.contract.revisionLimit === 3);
const uatCand = c?.milestones.find((m) => /uat/i.test(m.title + m.trigger));
check('UAT 25% with verified evidence on page 2', uatCand?.percentage === 25 && uatCand?.source?.page === 2 && uatCand?.source?.verified === true);
check('commercial terms: Rp500k/jam · Rp2M/revisi · +5 hari · denda 0,1%/hari maks 5%', c?.terms?.hourlyRate === 500_000 && c?.terms?.revisionUnitPrice === 2_000_000 && c?.terms?.revisionExtensionDays === 5 && c?.terms?.penaltyPerDayPercent === 0.1 && c?.terms?.penaltyCapPercent === 5, c?.terms);

console.log('\n4. Validation & human confirmation');
check('non-numeric contract value rejected', (await call('PUT', `/api/projects/${P}/baseline/candidate`, { contract: { contractValue: 'abc' } })).status === 400);
check('percentage > 100 rejected', (await call('PUT', `/api/projects/${P}/baseline/candidate`, { milestones: [{ title: 'X', percentage: 150, trigger: '' }] })).status === 400);
check('invalid term percent rejected', (await call('PUT', `/api/projects/${P}/baseline/candidate`, { terms: { penaltyCapPercent: 500 } })).status === 400);
check('malformed JSON rejected', (await call('PUT', `/api/projects/${P}/baseline/candidate`, undefined, '{oops')).json?.error?.code === 'MALFORMED_JSON');
check('monitoring blocked before baseline (409)', (await call('POST', `/api/projects/${P}/events`, { type: 'PROGRESS_UPDATED', progress: 10 })).status === 409);
check('invoice upload blocked before baseline (409)', (await call('POST', `/api/projects/${P}/documents/sample`, { samples: ['invoice-uat'] })).status === 409);
const conf = await call('POST', `/api/projects/${P}/baseline/confirm`);
check('V1 created', conf.status === 201 && conf.data?.baselineVersion === 'V1', conf.json?.error);
check('planned profit Rp45M', conf.data?.metrics.plannedProfit === 45_000_000);
check('contract & RAB documents APPROVED', conf.data?.documents.every((d) => d.status === 'APPROVED'));
check('terms carried into baseline', conf.data?.agreementBaseline.terms?.revisionUnitPrice === 2_000_000);
check('second confirm rejected (409)', (await call('POST', `/api/projects/${P}/baseline/confirm`)).status === 409);
const uatId = conf.data?.agreementBaseline.milestones.find((m) => /uat/i.test(m.title + (m.trigger ?? '')))?.id;

console.log('\n5. Monitoring → anomalies');
check('progress 60%', (await call('POST', `/api/projects/${P}/events`, { type: 'PROGRESS_UPDATED', progress: 60 })).data?.metrics.progress === 60);
check('negative cost rejected', (await call('POST', `/api/projects/${P}/costs`, { amount: -5, description: 'x' })).status === 400);
const cost = await call('POST', `/api/projects/${P}/costs`, { amount: 64_000_000, category: 'DEVELOPMENT', description: 'Biaya tim s.d. UAT' });
check('actual 64M · utilization 85.3% · variance −11M', cost.data?.metrics.actualCost === 64_000_000 && cost.data?.metrics.budgetUtilization === 85.3 && cost.data?.metrics.budgetVariance === -11_000_000);
check('budget warning is a POSSIBLE deviation', cost.data?.alerts.some((a) => a.type === 'BUDGET_VARIANCE' && a.classification === 'POSSIBLE_DEVIATION' && a.basis === 'VERIFIED_CALCULATION'));
const done = await call('POST', `/api/projects/${P}/events`, { type: 'MILESTONE_COMPLETED', milestoneId: uatId });
const billing = done.data?.alerts.find((a) => a.type === 'BILLING_VARIANCE' && open(a));
check('UAT done, no invoice → Rp30M unbilled, VERIFIED, verified calculation', done.data?.metrics.unbilledValue === 30_000_000 && billing?.classification === 'VERIFIED_DEVIATION' && billing?.basis === 'VERIFIED_CALCULATION' && billing?.rupiahImpact === 30_000_000);
check('billing evidence: clause p.2, event, missing invoice, 25% × 120M', ['CONTRACT', 'EVENT', 'INVOICE', 'CALCULATION'].every((k) => billing?.evidence.some((e) => e.kind === k)) && billing.evidence.some((e) => e.page === 2));
const rev = await call('POST', `/api/projects/${P}/events`, { type: 'REVISION_LOGGED', revisionCount: 5, title: 'Revisi dashboard dispatcher' });
const revAlert = rev.data?.alerts.find((a) => a.type === 'REVISION_LIMIT' && open(a));
check('revisions 5 vs 3 → +2', rev.data?.metrics.revisionVariance === 2);
check('revision alert priced by contract terms: 2 × Rp2M = Rp4M (exposure, not loss)', revAlert?.rupiahImpact === 4_000_000 && revAlert?.impactKind === 'EXPOSURE', revAlert && { r: revAlert.rupiahImpact, k: revAlert.impactKind });
const late = await call('POST', `/api/projects/${P}/events`, { type: 'PROGRESS_UPDATED', progress: 60, projectedFinishDate: '2026-12-10' });
const deadline = late.data?.alerts.find((a) => a.type === 'DEADLINE_RISK' && open(a));
check('deadline +10 days → potential penalty 10 × 0,1% × 120M = Rp1.2M (exposure)', deadline?.rupiahImpact === 1_200_000 && deadline?.impactKind === 'EXPOSURE' && deadline?.classification === 'POSSIBLE_DEVIATION', deadline && deadline.rupiahImpact);
const dash = await call('GET', '/api/dashboard/summary');
check('dashboard shows the project Rp30M unbilled', dash.data?.projects.find((p) => p.id === P)?.unbilledValue === 30_000_000);

if (MODE === 'AI') {
  console.log('\n6. AI explanation (numbers from the engine)');
  const ex = await call('POST', '/api/ai/anomalies/explain', { alertId: billing?.id });
  check('explanation stored on alert', ex.status === 200 && Boolean(ex.data?.aiExplanation?.text), ex.json?.error);
  const again = await call('GET', `/api/projects/${P}`);
  check('explanation persists across reconcile', Boolean(again.data?.alerts.find((a) => a.id === billing?.id)?.aiExplanation));
}

console.log('\n7. Remediation Copilot: generate change request from the revision alert');
const drafted = await call('POST', '/api/ai/change-requests/draft', { projectId: P, alertId: revAlert?.id });
const aiCr = drafted.data?.project?.changeRequests.find((x) => x.id === drafted.data?.crId);
check('CR drafted as DRAFT, origin AI_DRAFT, baseline unchanged', drafted.status === 201 && aiCr?.status === 'DRAFT' && aiCr?.origin === 'AI_DRAFT' && drafted.data.project.baselineVersion === 'V1', drafted.json?.error);
check('deterministic proposal: +2 revisi · +Rp4M · +5 hari', aiCr?.additionalRevisions === 2 && aiCr?.additionalValue === 4_000_000 && aiCr?.deadlineExtensionDays === 5);
check('calculation lines attached', aiCr?.calculation.some((l) => /2 × Rp\s?2\.000\.000/.test(l)));
const crDraft = drafted.data?.project?.drafts.find((d) => d.id === drafted.data?.draftId);
check(`linked addendum draft (${MODE === 'AI' ? 'AI' : 'AI or template'}) passed self-review`, crDraft?.status === 'READY_FOR_REVIEW' && (MODE !== 'AI' || crDraft?.source === 'AI'), crDraft?.validation?.checks.filter((x) => !x.ok));
check('self-review verified Rp124M, 5 Dec, 5 revisions', ['Rp 124.000.000', '5 Des 2026', 'revisi konsisten (5)'].every((t) => crDraft?.validation.checks.some((x) => x.label.includes(t) && x.ok)), crDraft?.validation?.checks.map((x) => x.label));
check('drafting twice for the same alert is refused (409)', (await call('POST', '/api/ai/change-requests/draft', { projectId: P, alertId: revAlert?.id })).status === 409);

console.log('\n8. Governance: PIC → Finance → Decision maker → Client');
const crUrl = `/api/projects/${P}/change-requests/${aiCr?.id}`;
const crDraftUrl = `/api/projects/${P}/drafts/${drafted.data?.draftId}/approve`;
check('PIC cannot approve a change document before finance (409)', (await call('POST', crDraftUrl)).status === 409);
await as('SITI');
check('Siti cannot submit (403)', (await call('POST', `${crUrl}/submit`)).status === 403);
await as('BUDI');
check('Budi edits the draft', (await call('PATCH', crUrl, { reason: 'Klien meminta 2 revisi tambahan dashboard' })).data?.changeRequests.find((x) => x.id === aiCr?.id)?.reason === 'Klien meminta 2 revisi tambahan dashboard');
check('Budi submits → PENDING', (await call('POST', `${crUrl}/submit`)).data?.changeRequests.find((x) => x.id === aiCr?.id)?.status === 'PENDING');
await as('HENDRA');
check('Hendra cannot decide before finance (409)', (await call('POST', `${crUrl}/decision`, { decision: 'APPROVE' })).status === 409);
await as('BUDI');
check('Budi cannot do finance review (403)', (await call('POST', `${crUrl}/finance-review`, {})).status === 403);
await as('SITI');
check('Siti confirms financial impact → FINANCE_REVIEWED', (await call('POST', `${crUrl}/finance-review`, { note: 'Sesuai tarif Pasal 5' })).data?.changeRequests.find((x) => x.id === aiCr?.id)?.status === 'FINANCE_REVIEWED');
await as('HENDRA');
const internal = await call('POST', `${crUrl}/decision`, { decision: 'APPROVE' });
check('Hendra approves internally → INTERNAL_APPROVED, baseline still V1 120M', internal.data?.changeRequests.find((x) => x.id === aiCr?.id)?.status === 'INTERNAL_APPROVED' && internal.data?.baselineVersion === 'V1' && internal.data?.metrics.contractValue === 120_000_000);
check('second internal approval refused (409)', (await call('POST', `${crUrl}/decision`, { decision: 'APPROVE' })).status === 409);
await as('BUDI');
check('PIC cannot approve the change document after Hendra decision (403)', (await call('POST', crDraftUrl)).status === 403);
check('client approval waits for linked document review (409)', (await call('POST', `${crUrl}/client-approval`, { decision: 'APPROVED', reference: 'Surat 045/ASL-PROC/X/2026' })).status === 409);
await as('HENDRA');
check('Hendra approves the change document after finance review (200)', (await call('POST', crDraftUrl)).data?.drafts.find((d) => d.id === drafted.data?.draftId)?.status === 'APPROVED');
await as('BUDI');
check('client approval without evidence refused (400)', (await call('POST', `${crUrl}/client-approval`, { decision: 'APPROVED' })).status === 400);
await call('POST', `/api/projects/${P}/documents/sample`, { samples: ['persetujuan-klien'] });
proj = await waitProject(P, (p) => p.documents.some((d) => d.kind === 'CLIENT_APPROVAL' && d.status !== 'PROCESSING'), 'client approval letter analyzed');
const approvalDoc = proj.documents.find((d) => d.kind === 'CLIENT_APPROVAL');
if (MODE === 'AI') check('approval letter recognized (approved, reference)', approvalDoc?.analysis?.approval?.approved === true && /045/.test(approvalDoc.analysis.approval.reference ?? ''));
const official = await call('POST', `${crUrl}/client-approval`, { decision: 'APPROVED', documentId: approvalDoc?.id, reference: 'Surat 045/ASL-PROC/X/2026' });
const v2 = official.data;
check('client approval → official → V2 active', official.status === 200 && v2?.baselineVersion === 'V2', official.json?.error);
check('V2: Rp124M · 5 revisions · 5 Dec 2026', v2?.metrics.contractValue === 124_000_000 && v2?.metrics.includedRevisions === 5 && v2?.metrics.deadline === '2026-12-05');
check('V1 archived and unchanged', (() => { const b = v2?.baselines.find((x) => x.label === 'V1'); return b?.status === 'ARCHIVED' && b.contractValue === 120_000_000 && b.revisionLimit === 3 && b.deadline === '2026-11-30'; })());
check('revision alert SUPERSEDED by the official change', v2?.alerts.find((a) => a.id === revAlert?.id)?.status === 'SUPERSEDED');
check('billing alert still open, Rp30M unbilled (no double counting)', open(v2?.alerts.find((a) => a.id === billing?.id) ?? {}) && v2?.metrics.unbilledValue === 30_000_000);
check('deadline exposure recomputed on V2: 5 × 0,1% × 124M = Rp620.000', v2?.alerts.find((a) => a.type === 'DEADLINE_RISK' && open(a))?.rupiahImpact === 620_000);
check('approval document marked APPROVED as evidence', v2?.documents.find((d) => d.id === approvalDoc?.id)?.status === 'APPROVED');
check('second client approval refused (409)', (await call('POST', `${crUrl}/client-approval`, { decision: 'APPROVED', reference: 'Surat 045/ASL-PROC/X/2026' })).status === 409);

console.log('\n9. Rejection path keeps the baseline');
const cr2 = await call('POST', `/api/projects/${P}/change-requests`, { title: 'Modul laporan tambahan', additionalValue: 10_000_000 });
const cr2Id = cr2.data?.changeRequests[0]?.id;
await as('SITI');
await call('POST', `/api/projects/${P}/change-requests/${cr2Id}/finance-review`, {});
await as('HENDRA');
check('reject without reason refused (400)', (await call('POST', `/api/projects/${P}/change-requests/${cr2Id}/decision`, { decision: 'REJECT' })).status === 400);
const rej = await call('POST', `/api/projects/${P}/change-requests/${cr2Id}/decision`, { decision: 'REJECT', note: 'Di luar anggaran klien' });
check('rejected → V2 stays at Rp124M', rej.data?.changeRequests.find((x) => x.id === cr2Id)?.status === 'REJECTED' && rej.data?.metrics.contractValue === 124_000_000 && rej.data?.baselineVersion === 'V2');
await as('BUDI');
await call('PATCH', `/api/projects/${P}/change-requests/${cr2Id}`, { additionalValue: 6_000_000 });
check('PIC revises and resubmits → PENDING', (await call('POST', `/api/projects/${P}/change-requests/${cr2Id}/submit`)).data?.changeRequests.find((x) => x.id === cr2Id)?.status === 'PENDING');

console.log('\n10. Draft lifecycle: approve → ready to send → export');
check('export before approval refused (409)', (await call('POST', `/api/projects/${P}/drafts/${crDraft?.id}/export`)).status === 409);
const appr = await call('POST', `/api/projects/${P}/drafts/${crDraft?.id}/approve`);
check('human approves draft → APPROVED (ready to send)', appr.data?.drafts.find((d) => d.id === crDraft?.id)?.status === 'APPROVED');
const exp = await call('POST', `/api/projects/${P}/drafts/${crDraft?.id}/export`);
check('export returns a document file', exp.status === 200 && /pdf|markdown/.test(exp.type), exp.type);
check('draft marked EXPORTED (not "sent")', (await call('GET', `/api/projects/${P}/drafts`)).data?.find((d) => d.id === crDraft?.id)?.status === 'EXPORTED');
const studio = await call('POST', '/api/ai/documents/generate', { projectId: P, type: 'MOU', title: 'MoU pemeliharaan sistem', instructions: 'Pemeliharaan 12 bulan' });
check('Studio drafts an MoU with validation', studio.status === 201 && Boolean(studio.data?.project.drafts.find((d) => d.id === studio.data.draftId)?.validation.checks.length), studio.json?.error);
const revised = await call('POST', '/api/ai/documents/revise', { projectId: P, draftId: studio.data?.draftId, instruction: 'Tambahkan klausul kerahasiaan' });
if (MODE === 'AI') check('AI revision re-validates and logs history', revised.status === 200 && revised.data?.drafts.find((d) => d.id === studio.data?.draftId)?.history.length === 2, revised.json?.error);
else check('AI revision without AI fails honestly (503), draft untouched', revised.status === 503 && revised.json?.error?.code === 'AI_UNAVAILABLE');
if (MODE !== 'AI') check('drafts fall back to a labelled TEMPLATE, never fake AI', studio.data?.project.drafts.find((d) => d.id === studio.data.draftId)?.source === 'TEMPLATE');
check('manual edit saved and re-validated', (await call('POST', '/api/ai/documents/revise', { projectId: P, draftId: studio.data?.draftId, content: 'Isi [Nama Pihak] belum lengkap untuk diuji validasi placeholder.' })).data?.drafts.find((d) => d.id === studio.data?.draftId)?.status === 'NEEDS_FIX');

if (MODE === 'AI') {
  console.log('\n11. Document Guardian: cross-document checks on invoices');
  await call('POST', `/api/projects/${P}/documents/sample`, { samples: ['invoice-tambahan'] });
  proj = await waitProject(P, (p) => p.documents.some((d) => d.fileName === 'Invoice-ASL-Tambahan.pdf' && d.status !== 'PROCESSING'), 'extra-work invoice analyzed');
  const extraDoc = proj.documents.find((d) => d.fileName === 'Invoice-ASL-Tambahan.pdf');
  const docAlerts = proj.alerts.filter((a) => a.sourceDocumentId === extraDoc?.id && open(a));
  const rate = docAlerts.find((a) => a.id.includes('-RATE-'));
  check('rate mismatch: (650k − 500k) × 40 jam = Rp6M VERIFIED difference', rate?.rupiahImpact === 6_000_000 && rate?.impactKind === 'VERIFIED_DIFFERENCE' && rate?.classification === 'VERIFIED_DEVIATION', rate);
  const revDoc = docAlerts.find((a) => a.id.includes('-REVDOC-'));
  check('invoice charges 8 revisions vs 5 allowed by V2 → inconsistency, exposure 3 × 2M', revDoc?.type === 'DOCUMENT_INCONSISTENCY' && revDoc?.rupiahImpact === 6_000_000, revDoc);
  check('billing before trigger flagged for the CR milestone', docAlerts.some((a) => a.id.includes('-EARLY-')));
  check('no fraud accusation in wording', docAlerts.every((a) => !/penipuan|fraud|ilegal/i.test(a.title + a.description)));
  const response = await call('POST', '/api/ai/documents/generate', { projectId: P, type: 'ANOMALY_RESPONSE', alertId: rate?.id });
  check('Copilot prepares a follow-up for the anomaly', response.status === 201, response.json?.error);

  await call('POST', `/api/projects/${P}/documents/sample`, { samples: ['invoice-uat'] });
  proj = await waitProject(P, (p) => p.documents.some((d) => d.fileName === 'Invoice-ASL-UAT.pdf' && d.status !== 'PROCESSING'), 'UAT invoice analyzed');
  const uatDoc = proj.documents.find((d) => d.fileName === 'Invoice-ASL-UAT.pdf');
  check('UAT invoice matched to UAT milestone, no anomaly', uatDoc?.analysis?.invoice?.matchedMilestoneId === uatId && !proj.alerts.some((a) => a.sourceDocumentId === uatDoc.id && open(a)));
  const recorded = await call('POST', `/api/projects/${P}/documents/${uatDoc?.id}/record-invoice`);
  check('recorded from document → billing alert resolved, unbilled 0', recorded.status === 201 && recorded.data?.metrics.unbilledValue === 0 && !open(recorded.data?.alerts.find((a) => a.id === billing?.id) ?? { status: 'RESOLVED' }), recorded.json?.error);
  check('recording twice refused (409)', (await call('POST', `/api/projects/${P}/documents/${uatDoc?.id}/record-invoice`)).status === 409);
  await call('POST', `/api/projects/${P}/documents/sample`, { samples: ['invoice-uat'] });
  proj = await waitProject(P, (p) => p.documents.filter((d) => d.fileName === 'Invoice-ASL-UAT.pdf').every((d) => d.status !== 'PROCESSING'), 'duplicate invoice analyzed');
  check('second copy flagged as potential duplicate billing (review, not accusation)', proj.alerts.some((a) => a.type === 'POTENTIAL_IRREGULARITY' && open(a) && a.classification === 'NEEDS_REVIEW'));
  const dupDoc = proj.documents.filter((d) => d.fileName === 'Invoice-ASL-UAT.pdf').find((d) => d.id !== uatDoc?.id);
  const closed = await call('POST', `/api/projects/${P}/documents/${dupDoc?.id}/decision`, { decision: 'REJECTED', note: 'Salinan ganda' });
  check('rejecting the duplicate closes its finding', !closed.data?.alerts.some((a) => a.sourceDocumentId === dupDoc?.id && open(a)));

  console.log('\n12. Legal AI (supporting layer)');
  const legal = await call('POST', '/api/ai/legal/query', { question: 'Kapan termin UAT boleh ditagih?', projectId: P });
  check('legal answer with project context', legal.status === 200 && legal.data?.contextUsed?.projectContext === true && Boolean(legal.data?.answer), legal.json?.error);
}

console.log('\n13. Error handling & persistence');
check('unknown project → 404 PROJECT_NOT_FOUND', (await call('GET', '/api/projects/PRJ-NOPE')).json?.error?.code === 'PROJECT_NOT_FOUND');
check('invalid project id → 400', (await call('GET', '/api/projects/..%2F..%2Fetc')).status === 400);
check('unsupported upload type → 400', (await (async () => { const f = new FormData(); f.append('kind', 'INVOICE'); f.append('file', new Blob(['x']), 'x.exe'); return call('POST', `/api/projects/${P}/documents`, undefined, f); })()).status === 400);
const after = await call('GET', `/api/projects/${P}`);
check('data persisted (V2, 124M, CR history)', after.data?.baselineVersion === 'V2' && after.data?.metrics.contractValue === 124_000_000 && after.data?.changeRequests.find((x) => x.id === aiCr?.id)?.history.length >= 5);

console.log('\n14. Reset restores the starting state');
await as('BUDI');
const r3 = await call('POST', '/api/demo/reset');
check('reset after everything equals first reset', stable(r3.data) === stable(r1.data));
check('created project removed', (await call('GET', `/api/projects/${P}`)).status === 404);

console.log(`\nPASS ${pass} · FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
