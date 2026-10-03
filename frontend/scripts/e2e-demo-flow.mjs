// End-to-end API test of the CLARA pitch scenario against a running app.
//   BASE_URL=http://localhost:3000 node scripts/e2e-demo-flow.mjs
//   E2E_MODE=AI  → use real AI extraction (needs the AI service + Gemini key)
// Rerunnable: it starts and ends with a demo reset.

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const MODE = process.env.E2E_MODE === 'AI' ? 'AI' : 'SAMPLE';
const P = 'PRJ-ASL';
let pass = 0;
let fail = 0;

function check(name, condition, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function call(method, path, body, raw) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined && !raw ? { 'Content-Type': 'application/json' } : undefined,
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, data: json?.data };
}

const stable = (summary) => JSON.stringify({ ...summary, computedAt: undefined });

console.log(`CLARA e2e demo flow · ${BASE} · extraction=${MODE}`);

console.log('\n1. Reset is idempotent');
const r1 = await call('POST', '/api/demo/reset');
const r2 = await call('POST', '/api/demo/reset');
check('reset returns 200', r1.status === 200 && r2.status === 200);
check('two resets give identical portfolio', stable(r1.data) === stable(r2.data));
const seeded = await call('GET', `/api/projects/${P}`);
check('pitch project is DRAFT with contract + RAB', seeded.data?.status === 'DRAFT' && seeded.data?.documents?.length === 2, seeded.data?.status);

console.log('\n2. Persona');
const persona = await call('POST', '/api/demo/session', { personaId: 'BUDI' });
check('Budi selected', persona.data?.activePersonaId === 'BUDI');
check('invalid persona rejected', (await call('POST', '/api/demo/session', { personaId: 'EVE' })).status === 400);

console.log('\n3. AI health');
const health = await call('GET', '/api/ai/health');
check('health endpoint responds', health.status === 200 && typeof health.data?.available === 'boolean', JSON.stringify(health.data));
console.log(`    AI available: ${health.data?.available} (${health.data?.message})`);

console.log('\n4. Extraction → candidate (not a baseline)');
const ex = await call('POST', `/api/projects/${P}/extract`, { mode: MODE });
check('extraction succeeds', ex.status === 200, JSON.stringify(ex.json?.error));
const cand = ex.data?.extraction;
check('candidate READY and project not active', cand?.status === 'READY' && ex.data?.status === 'BASELINE_PENDING' && ex.data?.baselines.length === 0);
check('contract value Rp120M', cand?.contract.contractValue === 120_000_000, cand?.contract.contractValue);
check('RAB Rp75M from CSV', cand?.rab.total === 75_000_000, cand?.rab.total);
check('deadline 2026-11-30', cand?.contract.deadline === '2026-11-30', cand?.contract.deadline);
check('revision limit 3', cand?.contract.revisionLimit === 3, cand?.contract.revisionLimit);
const uat = cand?.milestones.find((m) => /uat/i.test(m.title) || /uat/i.test(m.trigger));
check('UAT trigger 25% with page evidence', uat?.percentage === 25 && uat?.source?.page === 2, JSON.stringify(uat));
const dup = await call('POST', `/api/projects/${P}/extract`, { mode: MODE });
check('re-run allowed before confirmation (no duplicate state)', dup.status === 200 && dup.data?.extraction?.status === 'READY');

console.log('\n5. Candidate validation');
check('non-numeric contract value rejected', (await call('PUT', `/api/projects/${P}/baseline/candidate`, { contract: { contractValue: 'abc' } })).status === 400);
check('percentage > 100 rejected', (await call('PUT', `/api/projects/${P}/baseline/candidate`, { milestones: [{ title: 'X', percentage: 150, trigger: '' }] })).status === 400);
check('malformed JSON rejected', (await call('PUT', `/api/projects/${P}/baseline/candidate`, undefined, '{oops')).json?.error?.code === 'MALFORMED_JSON');
const monitorEarly = await call('POST', `/api/projects/${P}/events`, { type: 'PROGRESS_UPDATED', progress: 10 });
check('monitoring blocked before baseline (409)', monitorEarly.status === 409);

console.log('\n6. Confirm baseline V1');
const conf = await call('POST', `/api/projects/${P}/baseline/confirm`);
check('V1 created', conf.status === 201 && conf.data?.baselineVersion === 'V1' && conf.data?.baselines.length === 1, JSON.stringify(conf.json?.error));
check('contract 120M / RAB 75M / planned profit 45M', conf.data?.metrics.contractValue === 120_000_000 && conf.data?.metrics.plannedCost === 75_000_000 && conf.data?.metrics.plannedProfit === 45_000_000);
check('second confirm rejected (409)', (await call('POST', `/api/projects/${P}/baseline/confirm`)).status === 409);
const uatId = conf.data?.agreementBaseline.milestones.find((m) => /uat/i.test(m.title) || /uat/i.test(m.trigger ?? ''))?.id;
check('UAT milestone value Rp30M', conf.data?.agreementBaseline.milestones.find((m) => m.id === uatId)?.value === 30_000_000);

console.log('\n7. Progress 60% + actual cost Rp64M');
const prog = await call('POST', `/api/projects/${P}/events`, { type: 'PROGRESS_UPDATED', progress: 60 });
check('progress 60%', prog.data?.metrics.progress === 60);
check('negative cost rejected', (await call('POST', `/api/projects/${P}/costs`, { amount: -5, description: 'x' })).status === 400);
check('fractional cost rejected', (await call('POST', `/api/projects/${P}/costs`, { amount: 12.5, description: 'x' })).status === 400);
const cost = await call('POST', `/api/projects/${P}/costs`, { amount: 64_000_000, category: 'DEVELOPMENT', description: 'Biaya tim s.d. UAT' });
const m1 = cost.data?.metrics;
check('actual cost 64M', m1?.actualCost === 64_000_000);
check('budget utilization 85.3%', m1?.budgetUtilization === 85.3, m1?.budgetUtilization);
check('budget variance -11M (not a loss)', m1?.budgetVariance === -11_000_000);
const budgetAlert = cost.data?.alerts.find((a) => a.type === 'BUDGET_VARIANCE' && a.status !== 'RESOLVED');
check('budget warning is POSSIBLE_DEVIATION, not verified', budgetAlert?.classification === 'POSSIBLE_DEVIATION', budgetAlert?.classification);
check('actual profit unavailable while incomplete', m1?.actualProfit === null && /belum tersedia/.test(m1?.actualProfitNote ?? ''));

console.log('\n8. UAT completed, no invoice');
check('invoice on pending milestone rejected (409)', (await call('POST', `/api/projects/${P}/invoices`, { milestoneId: uatId })).status === 409);
const done = await call('POST', `/api/projects/${P}/events`, { type: 'MILESTONE_COMPLETED', milestoneId: uatId });
const m2 = done.data?.metrics;
check('billable 30M', m2?.billableValue === 30_000_000, m2?.billableValue);
check('unbilled 30M', m2?.unbilledValue === 30_000_000, m2?.unbilledValue);
check('completing twice rejected (409)', (await call('POST', `/api/projects/${P}/events`, { type: 'MILESTONE_COMPLETED', milestoneId: uatId })).status === 409);
const billing = done.data?.alerts.find((a) => a.type === 'BILLING_VARIANCE' && a.status !== 'RESOLVED');
check('billing alert VERIFIED_DEVIATION Rp30M unbilled', billing?.classification === 'VERIFIED_DEVIATION' && billing?.rupiahImpact === 30_000_000 && billing?.impactKind === 'UNBILLED');
check('evidence: contract clause page 2', billing?.evidence.some((e) => e.kind === 'CONTRACT' && e.page === 2 && /25%/.test(e.detail)));
check('evidence: UAT completion event', billing?.evidence.some((e) => e.kind === 'EVENT'));
check('evidence: no matching invoice', billing?.evidence.some((e) => e.kind === 'INVOICE' && /tidak ditemukan/i.test(e.title)));
check('evidence: calculation 25% × 120M', billing?.evidence.some((e) => e.kind === 'CALCULATION' && /25%/.test(e.detail)));

console.log('\n9. Revisions: 5 recorded vs 3 included');
const rev = await call('POST', `/api/projects/${P}/events`, { type: 'REVISION_LOGGED', revisionCount: 5, title: 'Revisi dashboard dispatcher' });
const m3 = rev.data?.metrics;
check('included 3 / actual 5 / variance +2', m3?.includedRevisions === 3 && m3?.actualRevisions === 5 && m3?.revisionVariance === 2);
const revAlert = rev.data?.alerts.find((a) => a.type === 'REVISION_LIMIT' && a.status !== 'RESOLVED');
check('revision alert with 5 − 3 = 2 evidence', revAlert && revAlert.evidence.some((e) => e.kind === 'CALCULATION' && /5 revisi aktual − 3/.test(e.detail)));
check('project status AT_RISK', rev.data?.status === 'AT_RISK');

console.log('\n10. Dashboard matches project');
const dash = await call('GET', '/api/dashboard/summary');
const row = dash.data?.projects.find((p) => p.id === P);
check('portfolio unbilled includes Rp30M', row?.unbilledValue === 30_000_000 && dash.data?.unbilledValue >= 30_000_000);
const alertsAll = await call('GET', '/api/alerts');
check('global alerts include billing + revision', alertsAll.data?.some((a) => a.id === billing?.id) && alertsAll.data?.some((a) => a.id === revAlert?.id));

console.log('\n11. Alert acknowledge keeps it open');
const ack = await call('POST', `/api/alerts/${billing?.id}/acknowledge`);
check('acknowledged, not resolved', ack.data?.status === 'ACKNOWLEDGED');
check('resolve requires a note', (await call('POST', `/api/alerts/${budgetAlert?.id}/resolve`, {})).status === 400);

console.log('\n12. Change request → V2');
const crBad = await call('POST', `/api/projects/${P}/change-requests`, { title: 'Kosong' });
check('empty change rejected', crBad.status === 400);
const cr = await call('POST', `/api/projects/${P}/change-requests`, { title: 'Tambahan 2 revisi dashboard', additionalRevisions: 2, additionalValue: 4_000_000, deadlineExtensionDays: 5, reason: 'Permintaan klien' });
const crId = cr.data?.changeRequests[0]?.id;
check('CR pending, baseline unchanged', cr.data?.changeRequests[0]?.status === 'PENDING' && cr.data?.baselineVersion === 'V1' && cr.data?.metrics.contractValue === 120_000_000);
const approve = await call('POST', `/api/projects/${P}/change-requests/${crId}/approve`);
const v2 = approve.data;
check('V2 active', v2?.baselineVersion === 'V2' && v2?.baselines.find((b) => b.label === 'V2')?.status === 'ACTIVE');
check('V1 archived and unchanged', (() => { const b = v2?.baselines.find((x) => x.label === 'V1'); return b?.status === 'ARCHIVED' && b.contractValue === 120_000_000 && b.revisionLimit === 3 && b.deadline === '2026-11-30'; })());
check('contract value 124M', v2?.metrics.contractValue === 124_000_000, v2?.metrics.contractValue);
check('revision limit 5', v2?.metrics.includedRevisions === 5);
check('deadline 2026-12-05', v2?.metrics.deadline === '2026-12-05', v2?.metrics.deadline);
const revAfter = v2?.alerts.find((a) => a.id === revAlert?.id);
check('revision alert auto-resolved (MATCH)', revAfter?.status === 'RESOLVED' && revAfter?.resolution?.auto === true);
check('revision check is MATCH', v2?.reconciliation.find((c) => c.key === 'revision')?.status === 'MATCH');
check('billing alert still open (no double counting)', v2?.alerts.find((a) => a.id === billing?.id)?.status === 'ACKNOWLEDGED' && v2?.metrics.unbilledValue === 30_000_000);
const again = await call('POST', `/api/projects/${P}/change-requests/${crId}/approve`);
check('second approval rejected (409)', again.status === 409);
const after = await call('GET', `/api/projects/${P}`);
check('no duplicate adjustment', after.data?.metrics.contractValue === 124_000_000 && after.data?.baselines.length === 2 && after.data?.metrics.includedRevisions === 5);

console.log('\n13. Reject path does not change baseline');
const cr2 = await call('POST', `/api/projects/${P}/change-requests`, { title: 'Modul laporan tambahan', additionalValue: 10_000_000 });
const rej = await call('POST', `/api/projects/${P}/change-requests/${cr2.data?.changeRequests[0]?.id}/reject`, { note: 'Di luar anggaran klien' });
check('rejected CR leaves V2 at 124M', rej.data?.changeRequests[0]?.status === 'REJECTED' && rej.data?.metrics.contractValue === 124_000_000 && rej.data?.baselineVersion === 'V2');

console.log('\n14. Invoice + payment close the billing gap');
const inv = await call('POST', `/api/projects/${P}/invoices`, { milestoneId: uatId });
check('invoice 30M created, unbilled 0', inv.data?.metrics.billedValue === 30_000_000 && inv.data?.metrics.unbilledValue === 0);
check('duplicate invoice rejected (409)', (await call('POST', `/api/projects/${P}/invoices`, { milestoneId: uatId })).status === 409);
check('billing alert auto-resolved', inv.data?.alerts.find((a) => a.id === billing?.id)?.status === 'RESOLVED');
const invId = inv.data?.invoices[0]?.id;
const pay = await call('POST', `/api/projects/${P}/payments`, { invoiceId: invId });
check('payment 30M recorded', pay.data?.metrics.paidValue === 30_000_000 && pay.data?.invoices[0]?.status === 'PAID');
check('double payment rejected (409)', (await call('POST', `/api/projects/${P}/payments`, { invoiceId: invId })).status === 409);

console.log('\n15. Error handling');
check('unknown project → 404', (await call('GET', '/api/projects/PRJ-NOPE')).status === 404);
check('invalid project id → 400', (await call('GET', '/api/projects/..%2F..%2Fetc')).status === 400);
check('error shape {success:false,error:{code,message}}', (await call('GET', '/api/projects/PRJ-NOPE')).json?.error?.code === 'PROJECT_NOT_FOUND');

console.log('\n16. Reset restores the starting state');
const r3 = await call('POST', '/api/demo/reset');
check('reset after mutations equals first reset', stable(r3.data) === stable(r1.data));
const back = await call('GET', `/api/projects/${P}`);
check('pitch project back to DRAFT', back.data?.status === 'DRAFT' && back.data?.baselines.length === 0);

console.log(`\nPASS ${pass} · FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
