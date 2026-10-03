import type { RetrievalResult } from "../retrieval/denseRetrieval";
export interface Citation {
    id: string;
    title: string;
    source: string;
}
export type ConfidenceLevel = "green" | "yellow" | "red";
export interface ReasoningResult {
    answer: string;
    citations: Citation[];
    confidence: number;
    confidence_level: ConfidenceLevel;
    confidence_label: string;
    variance: number;
    language: "id" | "en";
}
export declare function reason(question: string, context: RetrievalResult[], history?: {
    role: string;
    content: string;
}[]): Promise<ReasoningResult>;
//# sourceMappingURL=reasoningService.d.ts.map