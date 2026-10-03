import type { RetrievalResult } from "./denseRetrieval";
/**
 * Perform symbolic / graph-traversal retrieval based on the query's legal intent.
 * Falls back gracefully to an empty list if Neo4j has no relationship data yet.
 */
export declare function symbolicSearch(query: string, topK?: number): Promise<RetrievalResult[]>;
//# sourceMappingURL=symbolicRetrieval.d.ts.map