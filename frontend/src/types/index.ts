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

export type ScopeStatus = 'MATCH' | 'NEEDS_REVIEW' | 'APPROVED_CHANGE';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type BillingStatus = 'UNBILLED' | 'INVOICED' | 'PAID';

export type ChangeRequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Evidence {
  type: 'CONTRACT_CLAUSE' | 'FINANCIAL_MISMATCH' | 'EVENT_LOG' | 'DELIVERY';
  title: string;
  snippet: string;
  sourceDocument: string;
  pageOrSection: string;
  timestamp?: string;
  confidenceScore?: number;
}

export interface ScopeItem {
  id: string;
  title: string;
  description: string;
  category: 'CORE_FEATURE' | 'INTEGRATION' | 'INFRASTRUCTURE' | 'MAINTENANCE';
  status: ScopeStatus;
  contractClauseRef?: string;
  deviationNotes?: string;
  assignedTo?: string;
}

export interface Milestone {
  id: string;
  title: string;
  percentage: number;
  value: number;
  targetDate: string;
  completionDate?: string;
  status: MilestoneStatus;
  billingStatus: BillingStatus;
  invoiceId?: string;
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
  pdfUrl?: string;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  type: 'MILESTONE_COMPLETED' | 'SCOPE_ADDED' | 'REVISION_LOGGED' | 'INVOICE_SENT' | 'PAYMENT_RECEIVED' | 'CHANGE_REQUEST_APPROVED';
  title: string;
  description: string;
  date: string;
  author: string;
  metadata?: Record<string, any>;
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
  deadlineExtensionDays: number;
  status: ChangeRequestStatus;
  createdAt: string;
  approvedAt?: string;
  resultingBaselineVersion?: string;
}

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  rupiahImpact: number;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  evidence: Evidence;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
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
  actualCosts: ActualCostItem[];
  invoices: InvoiceItem[];
  events: ProjectEvent[];
  changeRequests: ChangeRequest[];
  alerts: Alert[];
}

export interface ExtractionResult {
  contract: {
    contractNumber: string;
    title: string;
    clientName: string;
    contractValue: number;
    startDate: string;
    deadline: string;
    paymentTerms: string;
    revisionLimit: number;
    milestones: {
      title: string;
      percentage: number;
      value: number;
      targetDate: string;
    }[];
    scopes: string[];
  };
  rab: {
    totalPlannedCost: number;
    items: {
      category: string;
      description: string;
      plannedAmount: number;
    }[];
  };
  confidenceScore: number;
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
