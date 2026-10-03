// Deterministic business engine. AI never runs here: every number below is
// arithmetic over confirmed baseline data and recorded events/finance rows.
// The same input always produces the same metrics, checks and alerts.

import type {
  Alert,
  AlertType,
  BillingStatus,
  EvidenceItem,
  InsightStatus,
  Milestone,
  Project,
  ProjectEvent,
  ProjectMetrics,
  ProjectStatus,
  ReconciliationCheck,
  SourceRef,
} from '@/types';

const ALERT_TYPES: AlertType[] = ['BUDGET_VARIANCE', 'SCOPE_VARIANCE', 'BILLING_VARIANCE', 'REVISION_LIMIT', 'DEADLINE_RISK', 'CONTRACT_RISK', 'FINANCIAL_ANOMALY', 'DOCUMENT_INCONSISTENCY', 'POTENTIAL_IRREGULARITY'];

/** Budget warning fires when this share of RAB is used ... */
export const BUDGET_WARNING_UTILIZATION = 80;
/** ... and utilization runs ahead of progress by more than this many points. */
export const BUDGET_WARNING_GAP = 10;

const rupiahFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const idr = (amount: number) => rupiahFormat.format(amount).replace(/ /g, ' ');

const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const formatDay = (iso: string | null | undefined) => {
  if (!iso) return '-';
  const time = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(time) ? iso : dateFormat.format(new Date(time));
};

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function addDays(iso: string, days: number): string {
  const time = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return new Date(time + days * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

/** Split a contract value over milestone percentages; the last milestone absorbs rounding. */
export function allocateMilestoneValues(contractValue: number, percentages: number[]): number[] {
  const values = percentages.map((pct) => Math.round((contractValue * pct) / 100));
  const total = percentages.reduce((sum, pct) => sum + pct, 0);
  if (values.length > 0 && Math.abs(total - 100) < 0.001) {
    values[values.length - 1] = contractValue - values.slice(0, -1).reduce((sum, v) => sum + v, 0);
  }
  return values;
}

function eventOrder(a: ProjectEvent, b: ProjectEvent) {
  return a.date.localeCompare(b.date) || (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id.localeCompare(b.id);
}

function sourceLabel(project: Project, source?: SourceRef): string | undefined {
  if (!source) return undefined;
  const doc = project.documents.find((d) => d.id === source.documentId);
  const name = doc?.fileName ?? 'Dokumen kontrak';
  return source.page ? `${name} · hal. ${source.page}` : name;
}

function contractEvidence(project: Project, title: string, fallback: string, source?: SourceRef): EvidenceItem {
  return {
    kind: 'CONTRACT',
    title,
    detail: source?.snippet || fallback,
    source: sourceLabel(project, source) ?? `Acuan ${project.baselineVersion} (tanpa kutipan dokumen)`,
    documentId: source?.documentId,
    page: source?.page ?? null,
    verified: Boolean(source?.verified),
  };
}

type AlertDraft = Omit<Alert, 'status' | 'createdAt' | 'updatedAt' | 'resolution' | 'projectId' | 'projectName' | 'baselineVersion'>;

function emptyAlertCounts(): Record<AlertType, number> {
  return { BUDGET_VARIANCE: 0, SCOPE_VARIANCE: 0, BILLING_VARIANCE: 0, REVISION_LIMIT: 0, DEADLINE_RISK: 0, CONTRACT_RISK: 0, FINANCIAL_ANOMALY: 0, DOCUMENT_INCONSISTENCY: 0, POTENTIAL_IRREGULARITY: 0 };
}

/** Open = still needs attention. RESOLVED and SUPERSEDED are history. */
export const isOpenAlert = (a: Pick<Alert, 'status'>) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED';

export function emptyMetrics(now: string): ProjectMetrics {
  return {
    hasBaseline: false,
    baselineVersion: null,
    contractValue: 0,
    plannedCost: 0,
    actualCost: 0,
    budgetVariance: 0,
    budgetUtilization: null,
    progress: 0,
    billableValue: 0,
    billedValue: 0,
    paidValue: 0,
    unbilledValue: 0,
    outstandingReceivable: 0,
    plannedProfit: null,
    actualProfit: null,
    actualProfitNote: 'Acuan proyek belum disetujui.',
    includedRevisions: 0,
    actualRevisions: 0,
    revisionVariance: 0,
    deadline: null,
    projectedFinish: null,
    deadlineVarianceDays: null,
    openAlerts: 0,
    newAlerts: 0,
    alertsByType: emptyAlertCounts(),
    computedAt: now,
  };
}

/**
 * Recompute every derived value of a project from its records. Pure apart from
 * the `now` timestamp used for new alert records.
 */
export function reconcile(input: Project, now: string): Project {
  const project: Project = structuredClone(input);
  project.baselines ??= [];
  project.documents ??= [];
  project.drafts ??= [];
  project.actualCosts ??= [];
  project.invoices ??= [];
  project.payments ??= [];
  project.events ??= [];
  project.changeRequests ??= [];
  project.alerts ??= [];

  const active = project.baselines.find((b) => b.status === 'ACTIVE') ?? null;
  const metrics = emptyMetrics(now);
  const events = [...project.events].sort(eventOrder);

  // Actual cost: only recorded cost rows, never RAB.
  metrics.actualCost = project.actualCosts.reduce((sum, c) => sum + (Number.isFinite(c.amount) && c.amount > 0 ? c.amount : 0), 0);

  // Progress and projected finish: latest progress update wins.
  const progressEvents = events.filter((e) => e.type === 'PROGRESS_UPDATED' && typeof e.metadata?.progress === 'number');
  const latestProgress = progressEvents[progressEvents.length - 1];
  metrics.progress = latestProgress ? Math.max(0, Math.min(100, Number(latestProgress.metadata!.progress))) : 0;
  const projectedEvents = events.filter((e) => e.type === 'PROGRESS_UPDATED' && isIsoDate(e.metadata?.projectedFinishDate));
  const latestProjection = projectedEvents[projectedEvents.length - 1];
  metrics.projectedFinish = latestProjection ? String(latestProjection.metadata!.projectedFinishDate) : null;

  const revisionEvents = events.filter((e) => e.type === 'REVISION_LOGGED');
  metrics.actualRevisions = revisionEvents.reduce((sum, e) => sum + (Number(e.metadata?.revisionCount) > 0 ? Number(e.metadata!.revisionCount) : 1), 0);

  // Payments: every recorded payment, linked to an invoice.
  const paidByInvoice = new Map<string, number>();
  for (const payment of project.payments) {
    paidByInvoice.set(payment.invoiceId, (paidByInvoice.get(payment.invoiceId) ?? 0) + payment.amount);
  }
  for (const invoice of project.invoices) {
    if (invoice.status !== 'DRAFT' && (paidByInvoice.get(invoice.id) ?? 0) >= invoice.amount) invoice.status = 'PAID';
  }
  const validInvoices = project.invoices.filter((inv) => inv.status !== 'DRAFT');
  metrics.billedValue = validInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  metrics.paidValue = project.payments.reduce((sum, p) => sum + p.amount, 0);
  metrics.outstandingReceivable = Math.max(0, metrics.billedValue - metrics.paidValue);

  const drafts: AlertDraft[] = [];
  const checks: ReconciliationCheck[] = [];

  if (active) {
    const agreement = project.agreementBaseline;
    metrics.hasBaseline = true;
    metrics.baselineVersion = active.label;
    metrics.contractValue = active.contractValue;
    metrics.plannedCost = active.plannedCost;
    metrics.includedRevisions = active.revisionLimit;
    metrics.deadline = active.deadline;
    project.baselineVersion = active.label;

    // Billing entitlement per milestone from the active baseline.
    let unbilled = 0;
    for (const milestone of agreement.milestones) {
      const invoices = validInvoices.filter((inv) => inv.milestoneId === milestone.id);
      const billed = invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paid = invoices.reduce((sum, inv) => sum + (paidByInvoice.get(inv.id) ?? 0), 0);
      milestone.billedAmount = billed;
      milestone.paidAmount = paid;
      milestone.invoiceId = invoices[invoices.length - 1]?.id;
      const billing: BillingStatus = milestone.value > 0 && paid >= milestone.value ? 'PAID' : billed > 0 ? 'INVOICED' : 'UNBILLED';
      milestone.billingStatus = billing;
      if (milestone.status === 'COMPLETED') {
        metrics.billableValue += milestone.value;
        const gap = Math.max(0, milestone.value - billed);
        unbilled += gap;
        if (gap > 0) drafts.push(billingAlert(project, milestone, billed, gap, invoices.length));
      }
    }
    metrics.unbilledValue = unbilled;

    // Budget.
    metrics.budgetVariance = metrics.actualCost - metrics.plannedCost;
    metrics.budgetUtilization = metrics.plannedCost > 0 ? Math.round((metrics.actualCost / metrics.plannedCost) * 1000) / 10 : null;
    metrics.plannedProfit = metrics.plannedCost > 0 ? metrics.contractValue - metrics.plannedCost : null;
    const allMilestonesDone = agreement.milestones.length > 0 && agreement.milestones.every((m) => m.status === 'COMPLETED');
    if (metrics.progress >= 100 && allMilestonesDone) {
      metrics.actualProfit = metrics.billableValue - metrics.actualCost;
      metrics.actualProfitNote = 'Pendapatan diakui (semua tahap selesai) dikurangi biaya aktual tercatat.';
    } else {
      metrics.actualProfitNote = `Profit aktual belum tersedia — data biaya belum lengkap (progres ${metrics.progress}%).`;
    }

    metrics.revisionVariance = Math.max(0, metrics.actualRevisions - metrics.includedRevisions);
    if (metrics.projectedFinish && metrics.deadline) metrics.deadlineVarianceDays = daysBetween(metrics.deadline, metrics.projectedFinish);

    const budget = budgetAlert(project, metrics, latestProgress);
    if (budget) drafts.push(budget);
    if (metrics.revisionVariance > 0) drafts.push(revisionAlert(project, metrics, revisionEvents));
    for (const scope of agreement.scopeItems.filter((s) => s.status === 'NEEDS_REVIEW')) {
      drafts.push(scopeAlert(project, scope.id, scope.title, scope.description, events.find((e) => e.id === scope.eventId)));
    }
    if (metrics.deadlineVarianceDays !== null && metrics.deadlineVarianceDays > 0) drafts.push(deadlineAlert(project, metrics, latestProjection!));
    drafts.push(...documentAlerts(project, metrics));

    checks.push(...buildChecks(project, metrics, drafts));
  }

  project.alerts = mergeAlerts(project, drafts, now);
  project.reconciliation = checks;

  const open = project.alerts.filter(isOpenAlert);
  metrics.openAlerts = open.length;
  metrics.newAlerts = open.filter((a) => a.status === 'NEW').length;
  metrics.alertsByType = emptyAlertCounts();
  for (const alert of open) metrics.alertsByType[alert.type] += 1;

  // Status follows data, never the other way around.
  let status: ProjectStatus;
  if (!active) status = project.extraction?.status === 'READY' ? 'BASELINE_PENDING' : 'DRAFT';
  else if (metrics.progress >= 100 && project.agreementBaseline.milestones.every((m) => m.billingStatus === 'PAID')) status = 'COMPLETED';
  else if (open.some((a) => a.severity === 'HIGH' || a.severity === 'CRITICAL')) status = 'AT_RISK';
  else status = 'ACTIVE';
  project.status = status;

  project.metrics = metrics;
  project.contractValue = metrics.contractValue;
  project.plannedCost = metrics.plannedCost;
  project.actualCost = metrics.actualCost;
  project.billableValue = metrics.billableValue;
  project.billedValue = metrics.billedValue;
  project.paidValue = metrics.paidValue;
  project.progress = metrics.progress;
  project.activeRevisionCount = metrics.actualRevisions;
  if (active) {
    project.endDate = active.deadline;
    project.startDate = active.startDate;
  }
  return project;
}

function billingAlert(project: Project, milestone: Milestone, billed: number, gap: number, invoiceCount: number): AlertDraft {
  const completion = project.events.find((e) => e.id === milestone.completedEventId);
  const basis = milestone.basisContractValue ?? project.agreementBaseline.contractValue;
  const evidence: EvidenceItem[] = [
    contractEvidence(
      project,
      `Ketentuan pembayaran · ${milestone.title}`,
      `${milestone.percentage}% dari nilai kontrak dibayar setelah ${milestone.trigger || milestone.title}.`,
      milestone.source,
    ),
    {
      kind: 'EVENT',
      title: `${milestone.title} tercatat selesai`,
      detail: completion ? `${completion.title}. ${completion.description}`.trim() : `Tahap ditandai selesai pada ${formatDay(milestone.completionDate)}.`,
      source: completion ? `Kegiatan ${formatDay(completion.date)} · ${completion.author}` : 'Catatan tahap pekerjaan',
      refId: completion?.id,
      verified: true,
    },
    billed === 0
      ? {
          kind: 'INVOICE',
          title: 'Tagihan untuk tahap ini tidak ditemukan',
          detail: `Diperiksa ${project.invoices.length} tagihan proyek; tidak ada yang terhubung ke ${milestone.title}.`,
          source: 'Data tagihan proyek',
          verified: true,
        }
      : {
          kind: 'INVOICE',
          title: `Tagihan tercatat ${idr(billed)} dari ${invoiceCount} invoice`,
          detail: `Nilai tagihan lebih kecil dari hak tagih tahap ini.`,
          source: 'Data tagihan proyek',
          refId: milestone.invoiceId,
          verified: true,
        },
    {
      kind: 'CALCULATION',
      title: 'Perhitungan',
      detail: `${milestone.percentage}% × ${idr(basis)} = ${idr(milestone.value)} siap ditagih · sudah ditagih ${idr(billed)} · belum ditagih ${idr(gap)}`,
      source: `Acuan ${project.baselineVersion}`,
      verified: true,
    },
  ];
  return {
    id: `ALT-${project.id}-BILLING-${milestone.id}`,
    type: 'BILLING_VARIANCE',
    severity: 'HIGH',
    classification: 'VERIFIED_DEVIATION',
    title: billed === 0 ? `${milestone.title} selesai, belum ditagih` : `${milestone.title} kurang ditagih`,
    description:
      billed === 0
        ? `Syarat tagih "${milestone.trigger || milestone.title}" sudah terpenuhi, tetapi belum ada tagihan. ${idr(gap)} siap ditagih belum ditagihkan.`
        : `Hak tagih ${idr(milestone.value)}, tagihan tercatat ${idr(billed)}. Selisih ${idr(gap)} belum ditagihkan.`,
    rupiahImpact: gap,
    impactKind: 'UNBILLED',
    impactLabel: 'Belum ditagih (bukan kerugian)',
    basis: 'VERIFIED_CALCULATION',
    evidence,
    recommendedAction: 'Periksa berita acara tahap ini, lalu buat tagihan dari halaman keuangan bila sudah sesuai.',
    actionTab: 'finance',
    fingerprint: `${milestone.value}:${billed}`,
  };
}

function budgetAlert(project: Project, m: ProjectMetrics, latestProgress?: ProjectEvent): AlertDraft | null {
  if (m.plannedCost <= 0 || m.budgetUtilization === null) return null;
  const over = m.actualCost > m.plannedCost;
  const ahead = m.budgetUtilization >= BUDGET_WARNING_UTILIZATION && m.budgetUtilization > m.progress + BUDGET_WARNING_GAP;
  if (!over && !ahead) return null;
  const evidence: EvidenceItem[] = [
    {
      kind: 'BASELINE',
      title: `Rencana biaya (RAB) acuan ${project.baselineVersion}`,
      detail: `${idr(m.plannedCost)} dari ${project.planBaseline.items.length} item RAB.`,
      source: project.planBaseline.sourceFile ? `${project.planBaseline.sourceFile}` : `Acuan ${project.baselineVersion}`,
      verified: true,
    },
    {
      kind: 'COST',
      title: `Biaya aktual tercatat ${idr(m.actualCost)}`,
      detail: `Jumlah ${project.actualCosts.length} catatan biaya aktual.`,
      source: 'Data biaya aktual',
      verified: true,
    },
    {
      kind: 'EVENT',
      title: `Progres pekerjaan ${m.progress}%`,
      detail: latestProgress ? `${latestProgress.title}` : 'Belum ada pembaruan progres.',
      source: latestProgress ? `Kegiatan ${formatDay(latestProgress.date)} · ${latestProgress.author}` : 'Data progres',
      refId: latestProgress?.id,
      verified: true,
    },
    {
      kind: 'CALCULATION',
      title: 'Perhitungan',
      detail: `${idr(m.actualCost)} ÷ ${idr(m.plannedCost)} = ${m.budgetUtilization.toLocaleString('id-ID')}% anggaran terpakai · selisih biaya ${m.budgetVariance >= 0 ? '+' : ''}${idr(m.budgetVariance)}`,
      source: 'Mesin rekonsiliasi',
      verified: true,
    },
  ];
  if (over) {
    return {
      id: `ALT-${project.id}-BUDGET`,
      type: 'BUDGET_VARIANCE',
      severity: 'HIGH',
      classification: 'VERIFIED_DEVIATION',
      title: `Biaya aktual melebihi rencana ${idr(m.budgetVariance)}`,
      description: `Biaya aktual ${idr(m.actualCost)} sudah melewati RAB ${idr(m.plannedCost)} (${m.budgetUtilization.toLocaleString('id-ID')}%).`,
      rupiahImpact: m.budgetVariance,
      impactKind: 'OVER_BUDGET',
      basis: 'VERIFIED_CALCULATION',
      impactLabel: 'Di atas rencana biaya',
      evidence,
      recommendedAction: 'Tinjau pos biaya yang melebihi RAB dan putuskan apakah perlu revisi anggaran atau perubahan kontrak.',
      actionTab: 'finance',
      fingerprint: `over:${m.actualCost}:${m.plannedCost}`,
    };
  }
  return {
    id: `ALT-${project.id}-BUDGET`,
    type: 'BUDGET_VARIANCE',
    severity: 'MEDIUM',
    classification: 'POSSIBLE_DEVIATION',
    title: `Anggaran terpakai ${m.budgetUtilization.toLocaleString('id-ID')}%, progres ${m.progress}%`,
    description: `Pemakaian anggaran lebih cepat dari progres pekerjaan. Sisa RAB ${idr(m.plannedCost - m.actualCost)} untuk ${100 - m.progress}% pekerjaan tersisa. Ini indikasi, belum selisih terverifikasi.`,
    rupiahImpact: m.plannedCost - m.actualCost,
    impactKind: 'BUDGET_REMAINING',
    basis: 'VERIFIED_CALCULATION',
    impactLabel: 'Sisa anggaran (bukan kerugian)',
    evidence,
    recommendedAction: 'Tinjau sisa pekerjaan dan estimasi biaya hingga selesai bersama tim proyek.',
    actionTab: 'finance',
    fingerprint: `ahead:${m.actualCost}:${m.plannedCost}:${m.progress}`,
  };
}

function revisionAlert(project: Project, m: ProjectMetrics, revisionEvents: ProjectEvent[]): AlertDraft {
  const source = project.agreementBaseline.sources?.revisionLimit;
  const listed = revisionEvents
    .slice(-5)
    .map((e) => `${formatDay(e.date)}: ${e.title}${Number(e.metadata?.revisionCount) > 1 ? ` (${e.metadata!.revisionCount} revisi)` : ''}`)
    .join(' · ');
  return {
    id: `ALT-${project.id}-REVISION`,
    type: 'REVISION_LIMIT',
    severity: 'MEDIUM',
    classification: 'VERIFIED_DEVIATION',
    title: `${m.revisionVariance} revisi di luar acuan ${project.baselineVersion}`,
    description: `Acuan ${project.baselineVersion} mencakup ${m.includedRevisions} revisi; tercatat ${m.actualRevisions} revisi. Nilai revisi tambahan belum ditentukan oleh kontrak dan perlu ditinjau.`,
    rupiahImpact: revisionExposure(project, m.revisionVariance),
    impactKind: revisionExposure(project, m.revisionVariance) > 0 ? 'EXPOSURE' : 'UNPRICED',
    impactLabel: revisionExposure(project, m.revisionVariance) > 0 ? `Nilai revisi tambahan menurut tarif kontrak (${m.revisionVariance} × ${idr(project.agreementBaseline.terms!.revisionUnitPrice!)}) — belum ditagih` : 'Nilai belum ditentukan',
    basis: 'VERIFIED_CALCULATION',
    evidence: [
      contractEvidence(project, `Batas revisi acuan ${project.baselineVersion}: ${m.includedRevisions}`, `Kesepakatan mencakup maksimal ${m.includedRevisions} putaran revisi.`, source),
      {
        kind: 'EVENT',
        title: `${m.actualRevisions} revisi tercatat`,
        detail: listed || 'Catatan revisi proyek.',
        source: `${revisionEvents.length} catatan kegiatan revisi`,
        verified: true,
      },
      {
        kind: 'CALCULATION',
        title: 'Perhitungan',
        detail: `${m.actualRevisions} revisi aktual − ${m.includedRevisions} revisi termasuk = ${m.revisionVariance} revisi di luar acuan`,
        source: 'Mesin rekonsiliasi',
        verified: true,
      },
    ],
    recommendedAction: 'Ajukan permintaan perubahan untuk revisi tambahan, atau catat sebagai pengecualian yang disengaja.',
    actionTab: 'change-requests',
    fingerprint: `${m.actualRevisions}:${m.includedRevisions}`,
  };
}

function scopeAlert(project: Project, scopeId: string, title: string, description: string, event?: ProjectEvent): AlertDraft {
  return {
    id: `ALT-${project.id}-SCOPE-${scopeId}`,
    type: 'SCOPE_VARIANCE',
    severity: 'MEDIUM',
    classification: 'NEEDS_REVIEW',
    title: `Kemungkinan pekerjaan di luar ruang lingkup: ${title}`,
    basis: 'USER_CONFIRMED',
    description: `Pekerjaan ini tidak ditemukan dalam ruang lingkup acuan ${project.baselineVersion}. Kemungkinan selisih ruang lingkup — perlu tinjauan manusia, bukan pelanggaran kontrak.`,
    rupiahImpact: 0,
    impactKind: 'UNPRICED',
    impactLabel: 'Nilai belum ditentukan',
    evidence: [
      {
        kind: 'EVENT',
        title: `Pekerjaan dicatat: ${title}`,
        detail: event ? `${event.description || description}` : description,
        source: event ? `Kegiatan ${formatDay(event.date)} · ${event.author}` : 'Catatan ruang lingkup',
        refId: event?.id,
        verified: true,
      },
      {
        kind: 'BASELINE',
        title: `Ruang lingkup acuan ${project.baselineVersion}`,
        detail: project.agreementBaseline.scopeItems.filter((s) => s.status !== 'NEEDS_REVIEW').map((s) => s.title).join(' · ') || 'Tidak ada ruang lingkup tercatat.',
        source: `Acuan ${project.baselineVersion}`,
        verified: true,
      },
    ],
    recommendedAction: 'Tandai sesuai kontrak bila memang termasuk, atau ajukan permintaan perubahan bila pekerjaan tambahan.',
    actionTab: 'monitoring',
    fingerprint: scopeId,
  };
}

function deadlineAlert(project: Project, m: ProjectMetrics, projection: ProjectEvent): AlertDraft {
  const terms = project.agreementBaseline.terms;
  const days = m.deadlineVarianceDays ?? 0;
  let exposure = 0;
  let exposureNote = '';
  if (terms?.penaltyPerDayPercent) {
    const raw = Math.round((m.contractValue * terms.penaltyPerDayPercent * days) / 100);
    const cap = terms.penaltyCapPercent ? Math.round((m.contractValue * terms.penaltyCapPercent) / 100) : null;
    exposure = cap !== null ? Math.min(raw, cap) : raw;
    exposureNote = `${days} hari × ${terms.penaltyPerDayPercent.toLocaleString('id-ID')}% × ${idr(m.contractValue)} = ${idr(raw)}${cap !== null ? ` (batas ${terms.penaltyCapPercent!.toLocaleString('id-ID')}% = ${idr(cap)})` : ''} → potensi denda ${idr(exposure)}`;
  }
  return {
    id: `ALT-${project.id}-DEADLINE`,
    type: 'DEADLINE_RISK',
    severity: 'MEDIUM',
    classification: 'POSSIBLE_DEVIATION',
    title: `Perkiraan selesai ${m.deadlineVarianceDays} hari melewati tenggat`,
    description: `Perkiraan selesai ${formatDay(m.projectedFinish)} melewati tenggat acuan ${project.baselineVersion} (${formatDay(m.deadline)}). Ini peringatan jadwal, bukan pelanggaran kontrak.`,
    rupiahImpact: exposure,
    impactKind: exposure > 0 ? 'EXPOSURE' : 'SCHEDULE',
    impactLabel: exposure > 0 ? `Potensi denda bila terlambat ${days} hari (paparan, bukan kerugian)` : `+${m.deadlineVarianceDays} hari`,
    basis: 'VERIFIED_CALCULATION',
    evidence: [
      contractEvidence(project, `Tenggat acuan ${project.baselineVersion}: ${formatDay(m.deadline)}`, `Pekerjaan selesai paling lambat ${formatDay(m.deadline)}.`, project.agreementBaseline.sources?.deadline),
      {
        kind: 'EVENT',
        title: `Perkiraan selesai ${formatDay(m.projectedFinish)}`,
        detail: projection.title,
        source: `Kegiatan ${formatDay(projection.date)} · ${projection.author}`,
        refId: projection.id,
        verified: true,
      },
      {
        kind: 'CALCULATION',
        title: 'Perhitungan',
        detail: `${formatDay(m.projectedFinish)} − ${formatDay(m.deadline)} = +${m.deadlineVarianceDays} hari${exposureNote ? ` · ${exposureNote}` : ''}`,
        source: 'Mesin rekonsiliasi',
        verified: true,
      },
      ...(exposureNote ? [contractEvidence(project, 'Ketentuan denda keterlambatan', `Denda ${terms!.penaltyPerDayPercent}% per hari, maksimal ${terms!.penaltyCapPercent ?? '-'}%.`, project.agreementBaseline.sources?.penalty)] : []),
    ],
    recommendedAction: 'Tinjau jadwal bersama klien; ajukan perpanjangan waktu melalui permintaan perubahan bila disepakati.',
    actionTab: 'change-requests',
    fingerprint: `${m.projectedFinish}:${m.deadline}`,
  };
}

function revisionExposure(project: Project, extraRevisions: number): number {
  const price = project.agreementBaseline.terms?.revisionUnitPrice;
  return price && extraRevisions > 0 ? price * extraRevisions : 0;
}

const tokens = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((t) => t.length >= 3);

/** Match an invoice's milestone reference to a milestone: most shared words, then exact remaining amount. */
export function matchMilestone(project: Project, reference: string | null, total: number | null): Milestone | undefined {
  const milestones = project.agreementBaseline.milestones;
  if (reference) {
    const ref = new Set(tokens(reference));
    let best: { m: Milestone; score: number } | undefined;
    for (const m of milestones) {
      const score = tokens(`${m.title} ${m.trigger ?? ''}`).filter((t) => ref.has(t)).length;
      if (score > 0 && (!best || score > best.score)) best = { m, score };
    }
    if (best) return best.m;
  }
  if (total) return milestones.find((m) => m.value - (m.billedAmount ?? 0) === total);
  return undefined;
}

function docLabel(doc: { fileName: string }, source?: SourceRef) {
  return source?.page ? `${doc.fileName} · hal. ${source.page}` : doc.fileName;
}

/**
 * Cross-document checks. AI only extracted the numbers; every difference here
 * is computed deterministically against the active baseline and records.
 */
function documentAlerts(project: Project, m: ProjectMetrics): AlertDraft[] {
  const out: AlertDraft[] = [];
  const terms = project.agreementBaseline.terms;
  const version = project.baselineVersion;
  const active = project.baselines.find((b) => b.status === 'ACTIVE')!;

  for (const doc of project.documents) {
    const a = doc.analysis;
    if (!a || doc.status === 'REJECTED' || doc.status === 'PROCESSING' || doc.status === 'FAILED') continue;
    const docEvidence = (title: string, detail: string, source?: SourceRef): EvidenceItem => ({
      kind: 'CONTRACT',
      title,
      detail: source?.snippet || detail,
      source: docLabel(doc, source),
      documentId: doc.id,
      page: source?.page ?? null,
      verified: Boolean(source?.verified),
    });

    if (doc.kind === 'INVOICE' && a.invoice) {
      const inv = a.invoice;
      const label = inv.invoiceNumber ?? doc.fileName;
      const milestone = matchMilestone(project, inv.milestoneReference, inv.total);
      inv.matchedMilestoneId = milestone?.id;

      // a) Hourly rate vs confirmed contract rate.
      if (terms?.hourlyRate) {
        const hourly = inv.lineItems.filter((l) => l.unit && /jam|hour/i.test(l.unit) && l.unitPrice !== null && l.quantity !== null && l.unitPrice !== terms.hourlyRate);
        if (hourly.length) {
          const diff = hourly.reduce((s, l) => s + (l.unitPrice! - terms.hourlyRate!) * l.quantity!, 0);
          const calc = hourly.map((l) => `(${idr(l.unitPrice!)} − ${idr(terms.hourlyRate!)}) × ${l.quantity!.toLocaleString('id-ID')} jam = ${idr((l.unitPrice! - terms.hourlyRate!) * l.quantity!)}`).join(' · ');
          out.push({
            id: `ALT-${project.id}-RATE-${doc.id}`,
            type: 'FINANCIAL_ANOMALY',
            severity: Math.abs(diff) >= 5_000_000 ? 'HIGH' : 'MEDIUM',
            classification: 'VERIFIED_DEVIATION',
            basis: 'VERIFIED_CALCULATION',
            sourceDocumentId: doc.id,
            title: `Tarif di invoice ${label} berbeda dari tarif kontrak`,
            description: `Invoice memakai tarif ${idr(hourly[0].unitPrice!)}/jam, sedangkan acuan ${version} menetapkan ${idr(terms.hourlyRate)}/jam. Selisih tagihan terverifikasi ${idr(Math.abs(diff))} (${diff > 0 ? 'lebih tinggi' : 'lebih rendah'} dari kontrak).`,
            rupiahImpact: Math.abs(diff),
            impactKind: 'VERIFIED_DIFFERENCE',
            impactLabel: 'Selisih tagihan terverifikasi',
            evidence: [
              contractEvidence(project, `Tarif kontrak acuan ${version}: ${idr(terms.hourlyRate)}/jam`, `Pekerjaan tambahan ditagih ${idr(terms.hourlyRate)} per jam.`, project.agreementBaseline.sources?.hourlyRate),
              docEvidence(`Baris invoice: ${hourly[0].description}`, `${hourly[0].quantity} ${hourly[0].unit} × ${idr(hourly[0].unitPrice!)}`, hourly[0].source),
              { kind: 'CALCULATION', title: 'Perhitungan', detail: calc, source: 'Mesin rekonsiliasi', verified: true },
            ],
            recommendedAction: `Tinjau invoice ${label}: sesuaikan tarif ke ${idr(terms.hourlyRate)}/jam atau lampirkan persetujuan tarif baru sebelum dikirim.`,
            actionTab: 'documents',
            fingerprint: `${diff}`,
          });
        }
      }

      // b) Arithmetic inside the invoice.
      const lineDiffs = inv.lineItems.filter((l) => l.quantity !== null && l.unitPrice !== null && l.amount !== null && Math.round(l.quantity * l.unitPrice) !== l.amount);
      const lineSum = inv.lineItems.reduce((s, l) => s + (l.amount ?? 0), 0);
      const totalDiff = inv.total !== null && inv.lineItems.length > 0 ? inv.total - lineSum : 0;
      if (lineDiffs.length || totalDiff !== 0) {
        const parts = [
          ...lineDiffs.map((l) => `${l.description}: ${l.quantity} × ${idr(l.unitPrice!)} = ${idr(Math.round(l.quantity! * l.unitPrice!))}, tertulis ${idr(l.amount!)}`),
          ...(totalDiff !== 0 ? [`Jumlah baris ${idr(lineSum)}, total tertulis ${idr(inv.total!)} (selisih ${idr(totalDiff)})`] : []),
        ];
        const diff = Math.abs(totalDiff) + lineDiffs.reduce((s, l) => s + Math.abs(Math.round(l.quantity! * l.unitPrice!) - l.amount!), 0);
        out.push({
          id: `ALT-${project.id}-ARITH-${doc.id}`,
          type: 'FINANCIAL_ANOMALY',
          severity: 'MEDIUM',
          classification: 'VERIFIED_DEVIATION',
          basis: 'VERIFIED_CALCULATION',
          sourceDocumentId: doc.id,
          title: `Perhitungan di invoice ${label} tidak konsisten`,
          description: `Angka di dalam invoice tidak saling cocok. Selisih terverifikasi ${idr(diff)}.`,
          rupiahImpact: diff,
          impactKind: 'VERIFIED_DIFFERENCE',
          impactLabel: 'Selisih tagihan terverifikasi',
          evidence: [docEvidence(`Invoice ${label}`, a.summary, a.sources?.total), { kind: 'CALCULATION', title: 'Perhitungan', detail: parts.join(' · '), source: 'Mesin rekonsiliasi', verified: true }],
          recommendedAction: `Perbaiki perhitungan invoice ${label} sebelum dicatat atau dikirim.`,
          actionTab: 'documents',
          fingerprint: `${diff}`,
        });
      }

      // c) Revisions charged vs revisions allowed by the active baseline.
      if (inv.revisionsCharged !== null && inv.revisionsCharged > m.includedRevisions) {
        const extra = inv.revisionsCharged - m.includedRevisions;
        out.push({
          id: `ALT-${project.id}-REVDOC-${doc.id}`,
          type: 'DOCUMENT_INCONSISTENCY',
          severity: 'MEDIUM',
          classification: 'POSSIBLE_DEVIATION',
          basis: 'VERIFIED_CALCULATION',
          sourceDocumentId: doc.id,
          title: `Invoice ${label} menyebut ${inv.revisionsCharged} revisi, acuan ${version} mengizinkan ${m.includedRevisions}`,
          description: `Invoice merujuk ${inv.revisionsCharged} putaran revisi. Acuan aktif ${version} (termasuk perubahan yang disetujui) mencakup ${m.includedRevisions}; tercatat ${m.actualRevisions} revisi. Kemungkinan tidak konsisten antar dokumen — perlu ditinjau.`,
          rupiahImpact: revisionExposure(project, extra),
          impactKind: revisionExposure(project, extra) > 0 ? 'EXPOSURE' : 'UNPRICED',
          impactLabel: revisionExposure(project, extra) > 0 ? `Potensi nilai sengketa (${extra} × ${idr(terms!.revisionUnitPrice!)})` : 'Nilai belum ditentukan',
          evidence: [
            contractEvidence(project, `Batas revisi acuan ${version}: ${m.includedRevisions}`, `Acuan aktif mencakup ${m.includedRevisions} revisi.`, project.agreementBaseline.sources?.revisionLimit),
            docEvidence(`Invoice ${label} menyebut ${inv.revisionsCharged} revisi`, a.summary),
            { kind: 'CALCULATION', title: 'Perhitungan', detail: `${inv.revisionsCharged} revisi di invoice − ${m.includedRevisions} revisi di acuan ${version} = ${extra} revisi tanpa dasar acuan · revisi tercatat ${m.actualRevisions}`, source: 'Mesin rekonsiliasi', verified: true },
          ],
          recommendedAction: `Tinjau invoice ${label}: sesuaikan jumlah revisi atau ajukan permintaan perubahan untuk revisi tambahan.`,
          actionTab: 'documents',
          fingerprint: `${inv.revisionsCharged}:${m.includedRevisions}`,
        });
      }

      // d) Potential duplicate billing.
      const sameNumber = inv.invoiceNumber
        ? project.invoices.filter((r) => r.id !== inv.recordedInvoiceId && r.invoiceNumber.toLowerCase() === inv.invoiceNumber!.toLowerCase())
        : [];
      const otherDocs = project.documents.filter((d) => d.id !== doc.id && d.kind === 'INVOICE' && d.status !== 'REJECTED' && d.analysis?.invoice && ((inv.invoiceNumber && d.analysis.invoice.invoiceNumber === inv.invoiceNumber) || (inv.total !== null && d.analysis.invoice.total === inv.total && d.analysis.invoice.milestoneReference === inv.milestoneReference)));
      if (sameNumber.length || otherDocs.length) {
        out.push({
          id: `ALT-${project.id}-DUP-${doc.id}`,
          type: 'POTENTIAL_IRREGULARITY',
          severity: 'MEDIUM',
          classification: 'NEEDS_REVIEW',
          basis: 'VERIFIED_CALCULATION',
          sourceDocumentId: doc.id,
          title: `Potensi tagihan ganda: ${label}`,
          description: `Pola yang perlu diperiksa: ${sameNumber.length ? `nomor invoice sama dengan tagihan tercatat ${sameNumber.map((r) => r.invoiceNumber).join(', ')}` : `nominal dan termin sama dengan dokumen ${otherDocs.map((d) => d.fileName).join(', ')}`}. Ini bukan tuduhan; perlu verifikasi.`,
          rupiahImpact: inv.total ?? 0,
          impactKind: 'EXPOSURE',
          impactLabel: 'Potensi nilai tertagih ganda (paparan)',
          evidence: [docEvidence(`Invoice ${label}`, a.summary, a.sources?.invoiceNumber), ...otherDocs.map((d) => ({ kind: 'INVOICE' as const, title: `Dokumen serupa: ${d.fileName}`, detail: d.analysis?.summary ?? '', source: d.fileName, documentId: d.id, verified: true }))],
          recommendedAction: `Investigasi invoice ${label}: pastikan bukan tagihan ganda sebelum dicatat atau dikirim.`,
          actionTab: 'documents',
          fingerprint: `${sameNumber.length}:${otherDocs.length}`,
        });
      }

      // e) Entitlement for the matched milestone.
      if (milestone && inv.total !== null && !inv.recordedInvoiceId) {
        const remaining = milestone.value - (milestone.billedAmount ?? 0);
        if (milestone.status !== 'COMPLETED') {
          out.push({
            id: `ALT-${project.id}-EARLY-${doc.id}`,
            type: 'FINANCIAL_ANOMALY',
            severity: 'MEDIUM',
            classification: 'POSSIBLE_DEVIATION',
            basis: 'VERIFIED_CALCULATION',
            sourceDocumentId: doc.id,
            title: `Invoice ${label} menagih ${milestone.title} sebelum syarat terpenuhi`,
            description: `Syarat tagih "${milestone.trigger ?? milestone.title}" belum tercatat selesai di acuan ${version}.`,
            rupiahImpact: inv.total,
            impactKind: 'EXPOSURE',
            impactLabel: 'Nilai ditagih sebelum hak tagih (paparan)',
            evidence: [contractEvidence(project, `Syarat tagih ${milestone.title}`, `${milestone.percentage}% setelah ${milestone.trigger}.`, milestone.source), docEvidence(`Invoice ${label}`, a.summary, a.sources?.milestoneReference)],
            recommendedAction: `Tunda invoice ${label} sampai ${milestone.title} tercatat selesai, atau catat penyelesaiannya bila sudah terjadi.`,
            actionTab: 'documents',
            fingerprint: `${milestone.status}`,
          });
        } else if (inv.total > remaining) {
          out.push({
            id: `ALT-${project.id}-OVER-${doc.id}`,
            type: 'FINANCIAL_ANOMALY',
            severity: 'HIGH',
            classification: 'VERIFIED_DEVIATION',
            basis: 'VERIFIED_CALCULATION',
            sourceDocumentId: doc.id,
            title: `Invoice ${label} melebihi hak tagih ${milestone.title}`,
            description: `Hak tagih tersisa ${idr(remaining)}, invoice ${idr(inv.total)}. Selisih terverifikasi ${idr(inv.total - remaining)}.`,
            rupiahImpact: inv.total - remaining,
            impactKind: 'VERIFIED_DIFFERENCE',
            impactLabel: 'Selisih tagihan terverifikasi',
            evidence: [contractEvidence(project, `Hak tagih ${milestone.title}`, `${milestone.percentage}% = ${idr(milestone.value)}`, milestone.source), docEvidence(`Invoice ${label}`, a.summary, a.sources?.total), { kind: 'CALCULATION', title: 'Perhitungan', detail: `${idr(inv.total)} − sisa hak tagih ${idr(remaining)} = ${idr(inv.total - remaining)}`, source: 'Mesin rekonsiliasi', verified: true }],
            recommendedAction: `Sesuaikan invoice ${label} menjadi ${idr(remaining)}.`,
            actionTab: 'documents',
            fingerprint: `${inv.total}:${remaining}`,
          });
        }
      }
    }

    // Addendum (or later contract version) vs the active baseline.
    if ((doc.kind === 'ADDENDUM' || (doc.kind === 'CONTRACT' && doc.status !== 'APPROVED')) && a.contract && new Date(doc.uploadedAt) >= new Date(project.baselines[0].createdAt)) {
      const diffs: string[] = [];
      if (a.contract.contractValue !== null && a.contract.contractValue !== active.contractValue) diffs.push(`nilai kontrak ${idr(a.contract.contractValue)} (acuan ${idr(active.contractValue)})`);
      if (a.contract.deadline && a.contract.deadline !== active.deadline) diffs.push(`tenggat ${formatDay(a.contract.deadline)} (acuan ${formatDay(active.deadline)})`);
      if (a.contract.revisionLimit !== null && a.contract.revisionLimit !== active.revisionLimit) diffs.push(`batas revisi ${a.contract.revisionLimit} (acuan ${active.revisionLimit})`);
      if (diffs.length) {
        out.push({
          id: `ALT-${project.id}-ADDM-${doc.id}`,
          type: 'DOCUMENT_INCONSISTENCY',
          severity: 'MEDIUM',
          classification: 'NEEDS_REVIEW',
          basis: 'AI_FINDING',
          sourceDocumentId: doc.id,
          title: `${doc.fileName} berbeda dengan acuan aktif ${version}`,
          description: `Dokumen menyatakan ${diffs.join('; ')}. Perubahan belum menjadi acuan resmi sampai permintaan perubahan disetujui internal dan klien.`,
          rupiahImpact: a.contract.contractValue !== null ? Math.abs(a.contract.contractValue - active.contractValue) : 0,
          impactKind: a.contract.contractValue !== null && a.contract.contractValue !== active.contractValue ? 'EXPOSURE' : 'NONE',
          impactLabel: 'Perubahan nilai belum disahkan',
          evidence: [docEvidence(`Isi ${doc.fileName}`, a.summary, a.sources?.contractValue ?? a.sources?.deadline), { kind: 'BASELINE', title: `Acuan aktif ${version}`, detail: `${idr(active.contractValue)} · tenggat ${formatDay(active.deadline)} · ${active.revisionLimit} revisi`, source: `Acuan ${version}`, verified: true }],
          recommendedAction: 'Ajukan permintaan perubahan sesuai dokumen ini, atau tandai dokumen ditolak bila tidak berlaku.',
          actionTab: 'change-requests',
          fingerprint: diffs.join('|'),
        });
      }
    }

    // AI contract-risk findings worth a decision (MEDIUM/HIGH only, to keep the dashboard calm).
    if (doc.kind === 'CONTRACT' || doc.kind === 'ADDENDUM') {
      for (const f of a.findings.filter((x) => x.severity !== 'LOW' && x.origin !== 'ENGINE')) {
        out.push({
          id: `ALT-${project.id}-RISK-${doc.id}-${f.id}`,
          type: 'CONTRACT_RISK',
          severity: f.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
          classification: 'NEEDS_REVIEW',
          basis: 'AI_FINDING',
          sourceDocumentId: doc.id,
          title: `Potensi risiko kontrak: ${f.title}`,
          description: `${f.detail} Temuan ${f.origin === 'GUARDRAIL' ? 'guardrail' : 'AI'} — perlu tinjauan, bukan kesimpulan hukum.`,
          rupiahImpact: 0,
          impactKind: 'NONE',
          impactLabel: 'Perlu ditinjau',
          evidence: [docEvidence(f.title, f.detail, f.source)],
          recommendedAction: 'Tinjau klausul ini; CLARA dapat menyiapkan usulan revisi klausul.',
          actionTab: 'documents',
          fingerprint: f.id,
        });
      }
    }
  }
  return out;
}

function buildChecks(project: Project, m: ProjectMetrics, drafts: AlertDraft[]): ReconciliationCheck[] {
  const byType = (type: AlertType) => drafts.filter((d) => d.type === type);
  const status = (type: AlertType): InsightStatus => byType(type)[0]?.classification ?? 'MATCH';
  const version = project.baselineVersion;
  const checks: ReconciliationCheck[] = [];

  checks.push({
    key: 'budget',
    type: 'BUDGET_VARIANCE',
    label: 'Rencana biaya vs biaya aktual',
    status: status('BUDGET_VARIANCE'),
    expected: `RAB ${idr(m.plannedCost)}`,
    actual: `Aktual ${idr(m.actualCost)}${m.budgetUtilization !== null ? ` (${m.budgetUtilization.toLocaleString('id-ID')}%)` : ''}`,
    difference: `${m.budgetVariance >= 0 ? '+' : ''}${idr(m.budgetVariance)}`,
    explanation:
      m.budgetUtilization === null
        ? 'Pemakaian anggaran tidak tersedia karena rencana biaya 0.'
        : m.budgetVariance > 0
          ? 'Biaya aktual di atas rencana.'
          : `Biaya aktual di bawah atau sama dengan rencana; progres ${m.progress}%.`,
    alertId: byType('BUDGET_VARIANCE')[0]?.id,
  });

  const billing = byType('BILLING_VARIANCE');
  checks.push({
    key: 'billing',
    type: 'BILLING_VARIANCE',
    label: 'Hak tagih vs tagihan',
    status: status('BILLING_VARIANCE'),
    expected: `Siap ditagih ${idr(m.billableValue)}`,
    actual: `Sudah ditagih ${idr(m.billedValue)}`,
    difference: `Belum ditagih ${idr(m.unbilledValue)}`,
    explanation: billing.length ? `${billing.length} tahap selesai belum ditagih penuh.` : 'Semua tahap yang memenuhi syarat sudah ditagih.',
    alertId: billing[0]?.id,
  });

  checks.push({
    key: 'revision',
    type: 'REVISION_LIMIT',
    label: 'Batas revisi',
    status: status('REVISION_LIMIT'),
    expected: `${m.includedRevisions} revisi (acuan ${version})`,
    actual: `${m.actualRevisions} revisi tercatat`,
    difference: `+${m.revisionVariance}`,
    explanation: m.revisionVariance > 0 ? 'Revisi melebihi batas acuan aktif.' : 'Revisi masih dalam batas acuan aktif.',
    alertId: byType('REVISION_LIMIT')[0]?.id,
  });

  const scope = byType('SCOPE_VARIANCE');
  checks.push({
    key: 'scope',
    type: 'SCOPE_VARIANCE',
    label: 'Ruang lingkup',
    status: status('SCOPE_VARIANCE'),
    expected: `${project.agreementBaseline.scopeItems.filter((s) => s.status !== 'NEEDS_REVIEW').length} pekerjaan dalam acuan`,
    actual: `${scope.length} pekerjaan perlu ditinjau`,
    difference: scope.length ? `${scope.length} kemungkinan selisih` : '0',
    explanation: scope.length ? 'Ada pekerjaan yang belum ditemukan di ruang lingkup acuan.' : 'Tidak ada pekerjaan di luar ruang lingkup yang tercatat.',
    alertId: scope[0]?.id,
  });

  checks.push({
    key: 'deadline',
    type: 'DEADLINE_RISK',
    label: 'Tenggat',
    status: status('DEADLINE_RISK'),
    expected: `Tenggat ${formatDay(m.deadline)}`,
    actual: m.projectedFinish ? `Perkiraan selesai ${formatDay(m.projectedFinish)}` : 'Perkiraan selesai belum dicatat',
    difference: m.deadlineVarianceDays === null ? '-' : `${m.deadlineVarianceDays > 0 ? '+' : ''}${m.deadlineVarianceDays} hari`,
    explanation:
      m.deadlineVarianceDays === null
        ? 'Catat perkiraan selesai pada pembaruan progres untuk memeriksa tenggat.'
        : m.deadlineVarianceDays > 0
          ? 'Perkiraan selesai melewati tenggat acuan.'
          : 'Perkiraan selesai masih dalam tenggat.',
    alertId: byType('DEADLINE_RISK')[0]?.id,
  });
  return checks;
}

/**
 * Keep alert identity and human decisions across recomputation:
 * - an open alert keeps its status and creation time;
 * - a manually resolved alert stays resolved unless its numbers change;
 * - an alert whose condition disappeared is auto-resolved, never deleted.
 */
function mergeAlerts(project: Project, drafts: AlertDraft[], now: string): Alert[] {
  const previous = new Map(project.alerts.map((a) => [a.id, a]));
  const next: Alert[] = [];
  const seen = new Set<string>();

  for (const draft of drafts) {
    seen.add(draft.id);
    const prev = previous.get(draft.id);
    const base = { ...draft, projectId: project.id, projectName: project.name, baselineVersion: project.baselineVersion };
    if (!prev) {
      next.push({ ...base, status: 'NEW', createdAt: now, updatedAt: now });
      continue;
    }
    const changed = prev.fingerprint !== draft.fingerprint;
    const explanation = changed ? undefined : prev.aiExplanation;
    if (prev.status === 'RESOLVED' && !prev.resolution?.auto && !changed) {
      next.push({ ...base, status: 'RESOLVED', resolution: prev.resolution, aiExplanation: explanation, createdAt: prev.createdAt, updatedAt: prev.updatedAt });
    } else if (!isOpenAlert(prev)) {
      next.push({ ...base, status: 'NEW', createdAt: prev.createdAt, updatedAt: now });
    } else {
      next.push({ ...base, status: prev.status, aiExplanation: explanation, createdAt: prev.createdAt, updatedAt: changed ? now : prev.updatedAt });
    }
  }

  for (const prev of project.alerts) {
    if (seen.has(prev.id)) continue;
    if (!isOpenAlert(prev)) {
      next.push(prev);
      continue;
    }
    // An approved official change after the alert explains it: superseded, not just resolved.
    const explainedBy = project.changeRequests
      .filter((cr) => cr.status === 'APPROVED' && cr.approvedAt && cr.approvedAt >= prev.createdAt && cr.resultingBaselineVersion !== prev.baselineVersion)
      .sort((a, b) => (b.approvedAt ?? '').localeCompare(a.approvedAt ?? ''))[0];
    next.push({
      ...prev,
      status: explainedBy ? 'SUPERSEDED' : 'RESOLVED',
      updatedAt: now,
      resolution: {
        at: now,
        by: 'Mesin rekonsiliasi',
        note: explainedBy
          ? `Dijelaskan oleh perubahan resmi ${explainedBy.crNumber} (acuan ${explainedBy.resultingBaselineVersion}). Dihitung ulang: kondisi sesuai (MATCH).`
          : `Dihitung ulang terhadap acuan ${project.baselineVersion}: kondisi sudah sesuai (MATCH).`,
        auto: true,
      },
    });
  }

  const severityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
  const statusRank = { NEW: 0, ACKNOWLEDGED: 1, RESOLVED: 2, SUPERSEDED: 3 } as const;
  return next.sort(
    (a, b) => statusRank[a.status] - statusRank[b.status] || severityRank[a.severity] - severityRank[b.severity] || a.id.localeCompare(b.id),
  );
}

export { ALERT_TYPES };
