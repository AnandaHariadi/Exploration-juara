"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.denseSearch = denseSearch;
exports.storeEmbedding = storeEmbedding;
/**
 * denseRetrieval.ts
 * Vector similarity search over Article and LegalConcept nodes in Neo4j.
 */
const neo4j_1 = require("../../config/neo4j");
const embeddingService_1 = require("../embedding/embeddingService");
const generative_ai_1 = require("@google/generative-ai");
async function denseSearch(queryText, topK = 5) {
    const queryEmbedding = await (0, embeddingService_1.embedText)(queryText, generative_ai_1.TaskType.RETRIEVAL_QUERY);
    const session = await (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      CALL db.index.vector.queryNodes('article_embedding_idx', $topK, $embedding)
      YIELD node AS a, score
      RETURN
        a.id            AS id,
        labels(a)[0]    AS label,
        COALESCE(a.number, a.name, a.title, a.id) AS title,
        COALESCE(a.content, a.description, '')     AS content,
        score,
        COALESCE(a.law_id, 'Indonesia Law')        AS source,
        a.law_id                                   AS law_id
      ORDER BY score DESC
      `, { topK, embedding: queryEmbedding });
        return result.records.map((rec) => ({
            id: rec.get("id"),
            label: rec.get("label"),
            title: rec.get("title"),
            content: rec.get("content"),
            score: rec.get("score"),
            source: rec.get("source"),
            law_id: rec.get("law_id"),
        }));
    }
    finally {
        await session.close();
    }
}
/**
 * Embed and store an article / clause node's content embedding.
 * Utility used during data ingestion.
 */
async function storeEmbedding(nodeId, label, content) {
    const embedding = await (0, embeddingService_1.embedText)(content, generative_ai_1.TaskType.RETRIEVAL_DOCUMENT);
    const session = await (0, neo4j_1.getSession)();
    try {
        await session.run(`MATCH (n:${label} { id: $nodeId }) SET n.embedding = $embedding`, {
            nodeId,
            embedding,
        });
    }
    finally {
        await session.close();
    }
}
//# sourceMappingURL=denseRetrieval.js.map