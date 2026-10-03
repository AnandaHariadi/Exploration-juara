// CLARA domain types. Server (Next.js API + SQLite) is the single source of
// truth; every derived number (metrics, alerts, statuses) is produced by the
// deterministic engine in src/lib/engine.ts.

export type ProjectStatus =
  | 'DRAFT'
  | 'BASELINE_PENDING'
  | 'ACTIVE'
  | 'AT_RISK'
  | 'COMPLETED';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertType =
  | 'BUDGET_VARIANCE'
  | 'SCOPE_VARIANCE'
  | 'BILLING_VARIANCE'
  | 'REVISION_LIMIT'
  | 'DEADLINE_RISK';

/** Insight status from PRD §14. MATCH is used for reconciliation checks only. */
export type InsightStatus = 'MATCH' | 'POSSIBLE_DEVIATION' | 'VERIFIED_DEVIATION' | 'NEEDS_REVIEW';

/** What a rupiah figure on an alert means. None of these is an actual loss. */
export type ImpactKind = 'UNBILLED' | 'OVER_BUDGET' | 'BUDGET_REMAINING' | 'UNPRICED' | 'SCHEDULE' | 'NONE';

export type ScopeStatus = 'MATCH' | 'NEEDS_REVIEW' | 'APPROVED_CHANGE';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type BillingStatus = 'UNBILLED' | 'INVOICED' | 'PAID';

export type ChangeRequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SourceRef {
  documentId?: string;
  page?: number | null;
  snippet: string;
  /** true only when the snippet was found verbatim in the document text. */
  verified?: boolean;
}

export interface EvidenceItem {
  kind: 'CONTRACT' | 'BASELINE' | 'EVENT' | 'INVOICE' | 'COST' | 'MILESTONE' | 'CHANGE_REQUEST' | 'CALCULATION';
  title: string;
  detail: string;
  /** Human-readable source label, e.g. "Kontrak.pdf · hal. 2" or "Kegiatan 12 Okt 2026". */
  source?: string;
  documentId?: string;
  page?: number | null;
  refId?: string;
  /** false when the item comes from AI output that has not been matched to the document text. */
  verified: boolean;
}

export interface ScopeItem {
  id: string;
  title: string;
  description: string;
  category: 'CORE_FEATURE' | 'INTEGRATION' | 'INFRASTRUCTURE' | 'MAINTENANCE';
  status: ScopeStatus;
  origin?: 'BASELINE' | 'EVENT' | 'CHANGE_REQUEST';
  eventId?: string;
  contractClauseRef?: string;
  deviationNotes?: string;
  assignedTo?: string;
}

export interface Milestone {
  id: string;
  title: string;
  /** Share of the contract value this milestone entitles, as stated by the baseline. */
  percentage: number;
  /** Billable entitlement in rupiah, fixed when the baseline version was confirmed. */
  value: number;
  /** Contract value the percentage was applied to. */
  basisContractValue?: number;
  /** Contractual billing trigger, e.g. "UAT diterima". */
  trigger?: string;
  targetDate: string;
  completionDate?: string;
  completedEventId?: string;
  status: MilestoneStatus;
  billingStatus: BillingStatus;
  invoiceId?: string;
  billedAmount?: number;
  paidAmount?: number;
  source?: SourceRef;
  evidenceSnippet?: string;
}

export interface AgreementBaseline {
  contractNumber: string;
  title: string;
  clientName: string;
  contractValue: number;
  startDate: string;
  deadline: string;
  paymentTerms: string;
  revisionLimit: number;
  scopeItems: ScopeItem[];
  milestones: Milestone[];
  clausesSummary: {
    title: string;
    description: string;
    clauseNumber: string;
  }[];
  /** Source references for headline fields (contractValue, deadline, revisionLimit...). */
  sources?: Record<string, SourceRef>;
}

export interface RABItem {
  id: string;
  category: string;
  description: string;
  plannedAmount: number;
  actualAmount: number;
}

export interface PlanBaseline {
  totalPlannedCost: number;
  items: RABItem[];
  contingencyBudget: number;
  sourceFile?: string;
}

export interface BaselineVersion {
  id: string;
  version: number;
  label: string; // "V1", "V2"
  status: 'ACTIVE' | 'ARCHIVED';
  contractValue: number;
  plannedCost: number;
  startDate: string;
  deadline: string;
  revisionLimit: number;
  paymentTerms: string;
  milestones: Milestone[];
  scopeItems: ScopeItem[];
  rabItems: RABItem[];
  source: 'EXTRACTION_CONFIRMED' | 'CHANGE_REQUEST';
  sourceDetail: string;
  changeRequestId?: string;
  changes?: { field: string; label: string; from: string; to: string }[];
  createdAt: string;
  createdBy: string;
}

export interface ActualCostItem {
  id: string;
  projectId: string;
  date: string;
  category: 'DEVELOPMENT' | 'INFRASTRUCTURE' | 'DESIGN' | 'THIRD_PARTY_API' | 'OTHER';
  description: string;
  amount: number;
  invoiceRef?: string;
  submittedBy: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  projectId: string;
  milestoneId?: string;
  milestoneTitle?: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  issueDate: string;
  dueDate: string;
  paymentDate?: string;
  createdBy?: string;
}

export interface PaymentItem {
  id: string;
  projectId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  recordedBy: string;
}

export type ProjectEventType =
  | 'PROGRESS_UPDATED'
  | 'MILESTONE_COMPLETED'
  | 'SCOPE_ADDED'
  | 'SCOPE_REVIEWED'
  | 'REVISION_LOGGED'
  | 'INVOICE_SENT'
  | 'PAYMENT_RECEIVED'
  | 'COST_RECORDED'
  | 'BASELINE_CONFIRMED'
  | 'CHANGE_REQUEST_SUBMITTED'
  | 'CHANGE_REQUEST_APPROVED'
  | 'CHANGE_REQUEST_REJECTED'
  | 'DOCUMENT_UPLOADED'
  | 'EXTRACTION_COMPLETED';

export interface ProjectEvent {
  id: string;
  projectId: string;
  type: ProjectEventType;
  title: string;
  description: string;
  date: string;
  author: string;
  createdAt?: string;
  metadata?: {
    progress?: number;
    projectedFinishDate?: string;
    revisionCount?: number;
    milestoneId?: string;
    scopeItemId?: string;
    [key: string]: unknown;
  };
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  crNumber: string;
  title: string;
  description: string;
  reason: string;
  additionalScope: string[];
  additionalValue: number;
  additionalRevisions: number;
  deadlineExtensionDays: number;
  status: ChangeRequestStatus;
  baseVersion: string;
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  rejectedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
  resultingBaselineVersion?: string;
}

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  type: AlertType;
  severity: AlertSeverity;
  classification: InsightStatus;
  title: string;
  description: string;
  rupiahImpact: number;
  impactKind: ImpactKind;
  impactLabel: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  evidence: EvidenceItem[];
  recommendedAction: string;
  actionTab?: 'finance' | 'monitoring' | 'change-requests' | 'baseline';
  baselineVersion: string;
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
  resolution?: { at: string; by: string; note: string; auto: boolean };
}

export interface ReconciliationCheck {
  key: string;
  type: AlertType;
  label: string;
  status: InsightStatus;
  expected: string;
  actual: string;
  difference: string;
  explanation: string;
  alertId?: string;
}

export interface ProjectMetrics {
  hasBaseline: boolean;
  baselineVersion: string | null;
  contractValue: number;
  plannedCost: number;
  actualCost: number;
  budgetVariance: number;
  /** actual / planned × 100, null when planned cost is 0 or unknown. */
  budgetUtilization: number | null;
  progress: number;
  billableValue: number;
  billedValue: number;
  paidValue: number;
  unbilledValue: number;
  outstandingReceivable: number;
  plannedProfit: number | null;
  actualProfit: number | null;
  actualProfitNote: string;
  includedRevisions: number;
  actualRevisions: number;
  revisionVariance: number;
  deadline: string | null;
  projectedFinish: string | null;
  deadlineVarianceDays: number | null;
  openAlerts: number;
  newAlerts: number;
  alertsByType: Record<AlertType, number>;
  computedAt: string;
}

export interface ProjectDocument {
  id: string;
  kind: 'CONTRACT' | 'RAB';
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  isSample: boolean;
}

export interface CandidateMilestone {
  id: string;
  title: string;
  percentage: number | null;
  trigger: string;
  targetDate: string | null;
  source?: SourceRef;
}

export interface CandidateRabItem {
  id: string;
  category: string;
  description: string;
  plannedAmount: number;
}

export interface CandidateRisk {
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detail: string;
  source?: SourceRef;
}

/** Proposed baseline produced from documents. Never active until confirmed by a human. */
export interface ExtractionCandidate {
  status: 'PROCESSING' | 'READY' | 'FAILED' | 'CONFIRMED';
  source: 'AI' | 'SAMPLE' | 'MANUAL';
  startedAt: string;
  completedAt?: string;
  error?: { code: string; message: string };
  confidence: number | null;
  contract: {
    contractNumber: string;
    title: string;
    clientName: string;
    contractValue: number | null;
    startDate: string | null;
    deadline: string | null;
    revisionLimit: number | null;
    paymentTerms: string;
    scope: string[];
    obligations: string[];
    penalties: string[];
  };
  milestones: CandidateMilestone[];
  rab: { items: CandidateRabItem[]; total: number | null; sourceFile?: string; warnings: string[] };
  /** Field-level sources, keyed by field name (contractValue, deadline, revisionLimit, startDate...). */
  sources: Record<string, SourceRef>;
  risks: CandidateRisk[];
  warnings: string[];
  editedFields: string[];
  extractionMeta?: { sourceFile: string; pages: number | null; processedAt: string; engine: string; documentId?: string };
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  isDemo?: boolean;
  createdAt?: string;
  // Summary fields mirrored from metrics for list views.
  contractValue: number;
  plannedCost: number;
  actualCost: number;
  billableValue: number;
  billedValue: number;
  paidValue: number;
  progress: number;
  baselineVersion: string;
  startDate: string;
  endDate: string;
  activeRevisionCount: number;
  agreementBaseline: AgreementBaseline;
  planBaseline: PlanBaseline;
  baselines: BaselineVersion[];
  documents: ProjectDocument[];
  extraction: ExtractionCandidate | null;
  actualCosts: ActualCostItem[];
  invoices: InvoiceItem[];
  payments: PaymentItem[];
  events: ProjectEvent[];
  changeRequests: ChangeRequest[];
  alerts: Alert[];
  reconciliation: ReconciliationCheck[];
  metrics: ProjectMetrics;
}

export interface PortfolioSummary {
  projectCount: number;
  activeProjectCount: number;
  contractValue: number;
  plannedCost: number;
  actualCost: number;
  budgetUtilization: number | null;
  billableValue: number;
  billedValue: number;
  paidValue: number;
  unbilledValue: number;
  averageProgress: number | null;
  openAlerts: number;
  newAlerts: number;
  projects: { id: string; name: string; client: string; status: ProjectStatus; progress: number; contractValue: number; unbilledValue: number; openAlerts: number; baselineVersion: string }[];
  computedAt: string;
}

export interface AiHealth {
  available: boolean;
  url: string;
  service?: string;
  version?: string;
  ai?: { gemini: boolean; neo4j: string; redis: string };
  message?: string;
  checkedAt: string;
}

export interface LegalAnswer {
  answer: string;
  citations: { id: string; title: string; source: string }[];
  confidence: number;
  confidenceLevel: 'green' | 'yellow' | 'red';
  confidenceLabel: string;
  contextUsed: { legalSources: number; projectContext: boolean };
}

export type UserPersonaId = 'BUDI' | 'SITI' | 'HENDRA' | 'ADMIN';

export interface UserProfile {
  id: UserPersonaId;
  name: string;
  roleTitle: string;
  department: string;
  initials: string;
  badgeBg: string;
  badgeText: string;
  avatarBg: string;
  description: string;
  primaryFocus: string;
  allowedActions: string[];
}

export const USER_PERSONAS: Record<UserPersonaId, UserProfile> = {
  BUDI: {
    id: 'BUDI',
    name: 'Budi Santoso',
    roleTitle: 'Project Owner & Delivery Lead',
    department: 'Operations & Engineering',
    initials: 'BS',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 border-blue-200',
    avatarBg: 'bg-blue-600',
    description: 'Bertanggung jawab atas delivery teknis, kepatuhan batas revisi, dan penguncian baseline kontrak.',
    primaryFocus: 'Delivery Progress, Scope Reconciliation, Revision Limits, Baseline Lock & Change Requests',
    allowedActions: ['NEW_PROJECT', 'LOCK_BASELINE', 'LOG_EVENT', 'CREATE_CHANGE_REQUEST'],
  },
  SITI: {
    id: 'SITI',
    name: 'Siti Rahma',
    roleTitle: 'Finance & Billing Controller',
    department: 'Finance & Accounting',
    initials: 'SR',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
    avatarBg: 'bg-emerald-600',
    description: 'Mengontrol pengeluaran biaya riil, arus kas termin, dan penyelesaian unbilled gap invoice.',
    primaryFocus: 'Unbilled Realization, Actual Cost vs RAB, Invoice Generation, Cash Inflow Tracking',
    allowedActions: ['RECORD_ACTUAL_COST', 'GENERATE_INVOICE', 'MARK_INVOICE_PAID'],
  },
  HENDRA: {
    id: 'HENDRA',
    name: 'Hendra Wijaya',
    roleTitle: 'Managing Director & Partner',
    department: 'Executive Board',
    initials: 'HW',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800 border-slate-300',
    avatarBg: 'bg-slate-900',
    description: 'Mengawasi profitabilitas portofolio makro, nilai risiko finansial, dan audit klausul hukum.',
    primaryFocus: 'Total Portfolio Contract Value, Financial Exposure at Risk, Legal Audit & Executive ROI',
    allowedActions: ['AUDIT_EVIDENCE', 'APPROVE_CHANGE_REQUEST', 'QUERY_LEGAL_AI', 'EXECUTIVE_EXPORT'],
  },
  ADMIN: {
    id: 'ADMIN',
    name: 'Administrator',
    roleTitle: 'System Super Admin',
    department: 'Governance & Tech Ops',
    initials: 'SA',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700 border-purple-200',
    avatarBg: 'bg-purple-700',
    description: 'Akses tanpa batas ke seluruh modul, konfigurasi sistem, dan manajemen simulasi.',
    primaryFocus: 'Complete System Oversight, Unrestricted Permissions, Full Audit Log & Data Reset',
    allowedActions: ['ALL_PERMISSIONS', 'RESET_SIMULATION_DATA'],
  },
};
