export type DraftType = "CHANGE_REQUEST" | "ADDENDUM" | "MOU" | "LOI" | "PKS" | "CLAUSE_REVISION" | "ANOMALY_RESPONSE";
export declare const DRAFT_TYPE_LABEL: Record<DraftType, string>;
export interface DraftInput {
    type: DraftType;
    title?: string;
    projectContext?: string;
    facts: string[];
    instructions?: string;
    originalClause?: string;
}
export declare function generateDraft(input: DraftInput): Promise<{
    content: string;
    engine: string;
}>;
export declare function reviseDraft(content: string, instruction: string, facts: string[]): Promise<{
    content: string;
    engine: string;
}>;
export interface ReviewIssue {
    severity: "INFO" | "WARNING" | "BLOCKER";
    message: string;
    origin: "AI" | "GUARDRAIL";
}
/** Second pass: AI consistency review + legacy guardrail checks on the draft text. */
export declare function reviewDraft(content: string, facts: string[]): Promise<{
    issues: ReviewIssue[];
    engine: string;
}>;
export declare function explainAnomaly(input: {
    title: string;
    description: string;
    evidence: string[];
    facts: string[];
    projectContext?: string;
}): Promise<{
    explanation: string;
    engine: string;
}>;
//# sourceMappingURL=studioService.d.ts.map