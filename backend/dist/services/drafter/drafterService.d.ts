export type DocumentType = "LoI" | "MoU" | "PKS";
export type DrafterStatus = "needs_clarification" | "draft_ready" | "error";
export interface ConversationTurn {
    role: "user" | "assistant" | "model";
    content: string;
}
export interface DrafterRequest {
    session_id: string;
    message: string;
    history?: ConversationTurn[];
    userId?: string;
}
export interface DrafterResponse {
    status: DrafterStatus;
    document_type?: DocumentType;
    binding_warning?: boolean;
    clarifying_questions?: string[];
    draft?: string;
    document_number?: string;
    pdf_base64?: string;
    action_buttons?: string[];
    guardrail?: {
        is_safe: boolean;
        warning_count: number;
        critical_violations: unknown[];
    };
}
export declare function runDrafterTurn(req: DrafterRequest): Promise<DrafterResponse>;
//# sourceMappingURL=drafterService.d.ts.map