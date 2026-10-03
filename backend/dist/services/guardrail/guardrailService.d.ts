import { NumericVariables } from "../ocr/ocrService";
export type Severity = "CRITICAL" | "WARNING" | "INFO";
export interface GuardrailCheck {
    name: string;
    triggered: boolean;
    severity: Severity;
    message: string;
    advice: string;
    legal_basis?: string;
}
export interface GuardrailReport {
    checks: GuardrailCheck[];
    critical_violations: GuardrailCheck[];
    warning_count: number;
    is_safe: boolean;
    extracted_variables: NumericVariables;
}
export declare function runGuardrailChecks(contractText: string): Promise<GuardrailReport>;
/**
 * Phase 2 guardrail entry point — used by POST /api/v1/contract/validate.
 *
 * Runs keyword checks on the raw contract text (same as runGuardrailChecks)
 * but uses the **caller-supplied** numeric variables instead of auto-extracting
 * them from the text.  This lets users correct OCR mis-reads (e.g. 50% → 5%)
 * before the deterministic limit checks are executed.
 *
 * @param contractText  Raw OCR text from Phase 1 (for keyword pattern checks)
 * @param variables     User-corrected NumericVariables from the frontend
 */
export declare function runGuardrailChecksWithVariables(contractText: string, variables: Partial<NumericVariables>): Promise<GuardrailReport>;
//# sourceMappingURL=guardrailService.d.ts.map