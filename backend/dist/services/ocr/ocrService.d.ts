export interface Clause {
    index: number;
    header: string;
    content: string;
    content_preview: string;
    pasal_references: string[];
}
export interface OcrResult {
    raw_text: string;
    language: string;
    clauses: Clause[];
    page_count?: number;
}
/**
 * Numeric variables extracted from contract text.
 * Used by both the OCR pipeline (returning values to callers)
 * and the guardrail service (deterministic limit checks).
 */
export interface NumericVariables {
    interest_percent_per_month?: number;
    penalty_percent_per_month?: number;
    late_interest_percent_per_day?: number;
    retention_percent?: number;
    dp_percent?: number;
    penalty_lump_sum_idr?: number;
    pkwt_duration_years?: number;
}
/**
 * Apply common Indonesian-language OCR corrections.
 *
 * Priority order matters: more specific patterns first.
 *
 * Corrections address:
 *  1. Pasal-prefix corruption (Pa5al, Pa$al, Pas@l …)
 *  2. Common OCR character confusions in Indonesian legal vocab
 *  3. Whitespace / punctuation normalisation
 */
export declare function applyOcrCorrections(text: string): string;
/**
 * Extract all numeric contract variables from raw text.
 * This is the single source of truth — used by both the OCR pipeline
 * and the guardrail service (which imports this directly).
 */
export declare function extractNumericVariables(text: string): NumericVariables;
export declare function extractTextFromImage(buffer: Buffer, mimeType?: string): Promise<string>;
export declare function extractTextFromPdf(buffer: Buffer): Promise<string>;
/**
 * Split raw OCR text into structured contract clauses.
 * Segments on common Indonesian legal document markers:
 *   BAB I, BAB II …
 *   Pasal 1, Pasal 2 …
 *   BAGIAN KESATU, …
 *   KLAUSULA 1, …
 *   Ayat (1) …
 *   Numbered items "1. [Capital letter]"
 */
export declare function segmentClauses(rawText: string): Clause[];
export declare function processUploadedFile(buffer: Buffer, mimeType: string): Promise<OcrResult>;
//# sourceMappingURL=ocrService.d.ts.map