export interface RetrievalResult {
    id: string;
    label: "Article" | "LegalConcept" | "ContractClause";
    title: string;
    content: string;
    score: number;
    source: string;
    law_id?: string;
}
export declare function denseSearch(queryText: string, topK?: number): Promise<RetrievalResult[]>;
/**
 * Embed and store an article / clause node's content embedding.
 * Utility used during data ingestion.
 */
export declare function storeEmbedding(nodeId: string, label: string, content: string): Promise<void>;
//# sourceMappingURL=denseRetrieval.d.ts.map