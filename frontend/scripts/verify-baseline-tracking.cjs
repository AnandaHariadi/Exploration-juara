// Run with: node --test scripts/verify-baseline-tracking.cjs
// Load the project TypeScript without starting Next.js or touching the demo DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, ...rest) {
  const resolved = request.startsWith('@/') ? path.join(__dirname, '..', 'src', request.slice(2)) : request;
  return originalResolve.call(this, resolved, parent, ...rest);
};
require.extensions['.ts'] = function loadProjectTypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};

const { addCost, addMonitoringEvent, confirmBaseline, createInvoice, newProject, supplementCandidate, validateCandidate } = require('../src/lib/domain.ts');
const { baselineAvailability } = require('../src/lib/baseline.ts');
const { reconcile } = require('../src/lib/engine.ts');
const { parseRabCsv } = require('../src/lib/rab.ts');

let serial = 0;
const ctx = {
  now: '2026-10-04T00:00:00.000Z',
  actor: { id: 'BUDI', name: 'Budi', label: 'Budi' },
  nextId: (prefix) => `${prefix}-${++serial}`,
};

function candidate() {
  return {
    status: 'READY', source: 'MANUAL', startedAt: ctx.now, confidence: null,
    contract: {
      contractNumber: '', title: 'Proyek uji', clientName: 'Klien uji', contractValue: null,
      startDate: null, deadline: null, revisionLimit: null, paymentTerms: '',
      scope: [], obligations: [], penalties: [],
    },
    milestones: [], rab: { items: [], total: null, warnings: [] }, sources: {},
    terms: {}, risks: [], warnings: [], editedFields: [],
  };
}

function rabOnly() {
  const result = candidate();
  result.rab = {
    items: [{ id: 'RAB-1', category: 'Operasional', description: 'Biaya kerja', plannedAmount: 50_000_000 }],
    total: 50_000_000, warnings: [],
  };
  return result;
}

function agreementOnly() {
  const result = candidate();
  result.contract.contractValue = 100_000_000;
  result.contract.deadline = '2026-10-10';
  result.contract.revisionLimit = 2;
  result.contract.scope = ['Pekerjaan A'];
  result.milestones = [{ id: 'MLS-1', title: 'Tahap akhir', percentage: 100, trigger: 'Disetujui klien', targetDate: null }];
  return result;
}

function projectFrom(source) {
  assert.deepEqual(validateCandidate(source), []);
  const project = newProject(`PRJ-${++serial}`, 'Proyek uji', 'Klien uji', ctx);
  project.extraction = source;
  confirmBaseline(project, ctx);
  return project;
}

const checks = (project) => reconcile(project, ctx.now).reconciliation.map((item) => item.key).sort();

test('RAB saja menghitung biaya tanpa membuat hak tagih atau laba rencana', () => {
  const project = projectFrom(rabOnly());
  assert.deepEqual(checks(project), ['budget']);
  assert.equal(reconcile(project, ctx.now).reconciliation[0].status, 'NEEDS_REVIEW');
  assert.throws(() => createInvoice(project, { milestoneId: 'MLS-1' }, ctx), /Hak tagih memerlukan/);

  addCost(project, { amount: 60_000_000, description: 'Biaya kerja' }, ctx);
  const result = reconcile(project, ctx.now);
  assert.equal(result.metrics.budgetVariance, 10_000_000);
  assert.equal(result.metrics.plannedProfit, null);
  assert.equal(result.reconciliation[0].status, 'VERIFIED_DEVIATION');
  assert.equal(result.alerts.find((alert) => alert.type === 'BUDGET_VARIANCE').rupiahImpact, 10_000_000);
});

test('berkas RAB contoh dapat menjadi acuan RAB saja', () => {
  const csv = fs.readFileSync(path.join(__dirname, '..', 'data', 'samples', 'RAB-ASL-2026-089.csv'), 'utf8');
  const parsed = parseRabCsv(csv);
  const source = candidate();
  source.rab = { items: parsed.items, total: parsed.total, sourceFile: 'RAB-ASL-2026-089.csv', warnings: parsed.warnings };
  const project = projectFrom(source);
  assert.equal(project.baselines[0].plannedCost, 75_000_000);
  assert.equal(baselineAvailability(project.baselines[0]).agreement, false);
  assert.equal(reconcile(project, ctx.now).metrics.billableValue, 0);
});

test('MoU saja memantau ketentuan yang tersedia tanpa membandingkan anggaran', () => {
  const project = projectFrom(agreementOnly());
  addMonitoringEvent(project, { type: 'PROGRESS_UPDATED', progress: 80, projectedFinishDate: '2026-10-15' }, ctx);
  addMonitoringEvent(project, { type: 'REVISION_LOGGED', revisionCount: 3 }, ctx);
  addMonitoringEvent(project, { type: 'MILESTONE_COMPLETED', milestoneId: 'MLS-1' }, ctx);

  const result = reconcile(project, ctx.now);
  assert.deepEqual(checks(project), ['billing', 'deadline', 'revision', 'scope']);
  assert.equal(result.metrics.budgetUtilization, null);
  assert.equal(result.metrics.plannedProfit, null);
  assert.equal(result.metrics.actualProfit, null);
  assert.equal(result.metrics.billableValue, 100_000_000);
  for (const type of ['BILLING_VARIANCE', 'DEADLINE_RISK', 'REVISION_LIMIT']) {
    assert.ok(result.alerts.some((alert) => alert.type === type), type);
  }
});

test('MoU tanpa nilai uang tetap memantau tanggal dan revisi', () => {
  const source = candidate();
  source.contract.deadline = '2026-10-10';
  source.contract.revisionLimit = 1;
  const project = projectFrom(source);
  assert.deepEqual(checks(project), ['deadline', 'revision']);
  const result = reconcile(project, ctx.now);
  assert.equal(result.metrics.plannedProfit, null);
  assert.equal(result.metrics.billableValue, 0);
  assert.equal(baselineAvailability(project.baselines[0]).billing, false);
});

test('MoU dan RAB bersama mempertahankan pemeriksaan penuh', () => {
  const source = agreementOnly();
  source.rab = rabOnly().rab;
  const project = projectFrom(source);
  assert.deepEqual(checks(project), ['billing', 'budget', 'deadline', 'revision', 'scope']);
  assert.equal(reconcile(project, ctx.now).metrics.plannedProfit, 50_000_000);
  assert.equal(baselineAvailability({}).budget, true); // Bentuk acuan lama.
});

test('menambah kesepakatan setelah RAB membuat V2 tanpa menghapus biaya dan V1', () => {
  const project = projectFrom(rabOnly());
  addCost(project, { amount: 60_000_000, description: 'Biaya kerja' }, ctx);
  project.extraction = supplementCandidate(project, ctx);
  project.extraction.contract.contractValue = 100_000_000;
  project.extraction.contract.deadline = '2026-10-10';
  project.extraction.contract.revisionLimit = 2;
  project.extraction.contract.scope = ['Pekerjaan A'];
  project.extraction.milestones = [{ id: 'MLS-1', title: 'Tahap akhir', percentage: 100, trigger: 'Disetujui klien', targetDate: null }];
  confirmBaseline(project, ctx);

  const result = reconcile(project, ctx.now);
  assert.equal(project.baselines[0].status, 'ARCHIVED');
  assert.equal(project.baselines[1].label, 'V2');
  assert.equal(result.metrics.plannedCost, 50_000_000);
  assert.equal(result.metrics.actualCost, 60_000_000);
  assert.equal(result.metrics.plannedProfit, 50_000_000);
  assert.equal(result.alerts.find((alert) => alert.type === 'BUDGET_VARIANCE').rupiahImpact, 10_000_000);
});

test('menambah RAB setelah MoU membuat V2 tanpa menghapus status pekerjaan dan riwayat dokumen', () => {
  const project = projectFrom(agreementOnly());
  addMonitoringEvent(project, { type: 'MILESTONE_COMPLETED', milestoneId: 'MLS-1' }, ctx);
  project.documents.push(
    { id: 'DOC-OLD', kind: 'RAB', fileName: 'rab-lama.csv', status: 'UPLOADED' },
    { id: 'DOC-NEW', kind: 'RAB', fileName: 'rab-baru.csv', status: 'NEEDS_REVIEW' },
  );
  project.extraction = supplementCandidate(project, ctx);
  project.extraction.rab = { ...rabOnly().rab, sourceFile: 'rab-baru.csv' };
  confirmBaseline(project, ctx);

  assert.equal(project.baselines[0].status, 'ARCHIVED');
  assert.equal(project.baselines[1].label, 'V2');
  assert.equal(project.baselines[1].milestones[0].status, 'PENDING');
  assert.equal(project.agreementBaseline.milestones[0].status, 'COMPLETED');
  assert.equal(project.documents[0].status, 'UPLOADED');
  assert.equal(project.documents[1].status, 'APPROVED');
  assert.equal(reconcile(project, ctx.now).metrics.billableValue, 100_000_000);
  assert.equal(reconcile(project, ctx.now).metrics.plannedProfit, 50_000_000);
});
