export declare class AiNotConfiguredError extends Error {
    constructor();
}
export type AnalysisKind = "CONTRACT" | "ADDENDUM" | "INVOICE" | "OTHER";
export interface EvidenceRef {
    page: number | null;
    snippet: string;
    verified: boolean;
}
export interface ExtractedMilestone {
    name: string;
    billingPercentage: number | null;
    trigger: string;
    targetDate: string | null;
    evidence: EvidenceRef | null;
}
export interface ContractTerms {
    hourlyRate: number | null;
    revisionUnitPrice: number | null;
    revisionExtensionDays: number | null;
    penaltyPerDayPercent: number | null;
    penaltyCapPercent: number | null;
    paymentDueDays: number | null;
}
export interface InvoiceExtraction {
    invoiceNumber: string | null;
    issueDate: string | null;
    issuer: string | null;
    recipient: string | null;
    total: number | null;
    milestoneReference: string | null;
    revisionsCharged: number | null;
    lineItems: {
        description: string;
        quantity: number | null;
        unit: string | null;
        unitPrice: number | null;
        amount: number | null;
        evidence: EvidenceRef | null;
    }[];
}
export interface DocumentExtraction {
    kind: AnalysisKind;
    documentType: string;
    confidence: number | null;
    summary: string;
    contract: {
        contractNumber: string | null;
        title: string | null;
        clientName: string | null;
        vendorName: string | null;
        contractValue: number | null;
        startDate: string | null;
        deadline: string | null;
        revisionLimit: number | null;
        paymentTermsSummary: string | null;
        scope: string[];
        obligations: string[];
        penalties: string[];
    } | null;
    terms: ContractTerms | null;
    milestones: ExtractedMilestone[];
    invoice: InvoiceExtraction | null;
    approval: {
        approved: boolean | null;
        approver: string | null;
        date: string | null;
        reference: string | null;
    } | null;
    fieldEvidence: Record<string, EvidenceRef>;
    risks: {
        title: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        detail: string;
        evidence: EvidenceRef | null;
        origin: "AI" | "GUARDRAIL";
    }[];
    warnings: string[];
    extractionMeta: {
        sourceFile: string;
        pages: number | null;
        processedAt: string;
        engine: string;
        textLength: number;
    };
}
export declare function model(json?: boolean, systemInstruction?: string): import("@google/generative-ai").GenerativeModel;
/** Locate a quote in the OCR text; page is derived from the nearest preceding page marker. */
export declare function locateQuote(text: string, quote: string | null | undefined): EvidenceRef | null;
export declare function analyzeDocument(buffer: Buffer, mimeType: string, fileName: string, kind: AnalysisKind): Promise<DocumentExtraction>;
/** Backwards-compatible entry used by the original contract flow. */
export declare const extractContract: (buffer: Buffer, mimeType: string, fileName: string) => Promise<DocumentExtraction>;
//# sourceMappingURL=contractExtractionService.d.ts.map