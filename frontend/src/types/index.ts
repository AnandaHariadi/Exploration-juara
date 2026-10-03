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
