import type { RetrievalResult } from "./denseRetrieval";
/**
 * Hybrid retrieval combining dense + BM25 + symbolic graph traversal.
 *
 * Weights are pulled from `.env` so they can be tuned without a code change:
 *   HYBRID_DENSE_WEIGHT    (default 0.5)
 *   HYBRID_BM25_WEIGHT     (default 0.3)
 *   HYBRID_SYMBOLIC_WEIGHT (default 0.2)
 *
 * If documentId is provided, also searches uploaded contract clauses —
 * those results are boosted (weight 1.5) to surface near the top.
 */
export declare function hybridRetrieval(query: string, documentId?: string, topK?: number): Promise<RetrievalResult[]>;
//# sourceMappingURL=hybridRetrieval.d.ts.map