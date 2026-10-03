export declare class AiNotConfiguredError extends Error {
    constructor();
}
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
export interface ContractExtraction {
    documentType: "CONTRACT" | "NOT_CONTRACT";
    confidence: number | null;
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
    };
    milestones: ExtractedMilestone[];
    fieldEvidence: Record<string, EvidenceRef>;
    risks: {
        title: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        detail: string;
        evidence: EvidenceRef | null;
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
/** Locate a quote in the OCR text; page is derived from the nearest preceding page marker. */
export declare function locateQuote(text: string, quote: string | null | undefined): EvidenceRef | null;
export declare function extractContract(buffer: Buffer, mimeType: string, fileName: string): Promise<ContractExtraction>;
//# sourceMappingURL=contractExtractionService.d.ts.map