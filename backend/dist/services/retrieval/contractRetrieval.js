"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractRetrieval = contractRetrieval;
/**
 * contractRetrieval.ts
 * Dense vector search over ContractClause nodes, filtered by document_id.
 * Falls back to a plain Cypher scan if the vector index returns no results
 * (e.g., embeddings were skipped during upload).
 */
const neo4j_1 = require("../../config/neo4j");
const embeddingService_1 = require("../embedding/embeddingService");
const generative_ai_1 = require("@google/generative-ai");
async function contractRetrieval(queryText, documentId, topK = 5) {
    const session = await (0, neo4j_1.getSession)();
    try {
        // Strategy 1: Vector similarity search (preferred)
        let vectorResults = [];
        try {
            const queryEmbedding = await (0, embeddingService_1.embedText)(queryText, generative_ai_1.TaskType.RETRIEVAL_QUERY);
            const result = await session.run(`
        CALL db.index.vector.queryNodes('contract_clause_embedding_idx', $topK, $embedding)
        YIELD node AS cc, score
        WHERE cc.document_id = $documentId
        RETURN
          cc.id         AS id,
          'ContractClause' AS label,
          cc.header     AS title,
          cc.content    AS content,
          score,
          'Uploaded Contract' AS source
        ORDER BY score DESC
        `, { topK: topK * 3, embedding: queryEmbedding, documentId });
            vectorResults = result.records.slice(0, topK).map((rec) => ({
                id: rec.get("id"),
                label: "ContractClause",
                title: rec.get("title"),
                content: rec.get("content"),
                score: rec.get("score"),
                source: "Uploaded Contract",
            }));
        }
        catch {
            // Vector index may not exist yet or embeddings are missing use fallback
        }
        if (vectorResults.length > 0) {
            return vectorResults;
        }
        // Strategy 2: Plain scan fallback (when no embeddings are stored)
        console.warn(`[contractRetrieval] Vector search returned 0 results for document_id="${documentId}". Falling back to plain scan.`);
        const fallback = await session.run(`
      MATCH (cc:ContractClause { document_id: $documentId })
      RETURN
        cc.id      AS id,
        cc.header  AS title,
        cc.content AS content
      ORDER BY cc.index ASC
      LIMIT $topK
      `, { documentId, topK });
        if (fallback.records.length === 0) {
            console.warn(`[contractRetrieval] No ContractClause nodes found for document_id="${documentId}". ` +
                `Make sure the document was uploaded and stored successfully.`);
        }
        return fallback.records.map((rec) => ({
            id: rec.get("id"),
            label: "ContractClause",
            title: rec.get("title"),
            content: rec.get("content"),
            score: 1.0, // flat score not ranked by similarity
            source: "Uploaded Contract",
        }));
    }
    finally {
        await session.close();
    }
}
//# sourceMappingURL=contractRetrieval.js.map