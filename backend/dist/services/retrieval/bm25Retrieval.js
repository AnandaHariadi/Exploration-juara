"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bm25Search = bm25Search;
/**
 * bm25Retrieval.ts
 * Full-text (BM25) keyword retrieval over Article and LegalConcept nodes.
 */
const neo4j_1 = require("../../config/neo4j");
async function bm25Search(queryText, topK = 5) {
    // Escape Lucene special characters to prevent query parse errors
    const escapedQuery = queryText
        .replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, "\\$&")
        .slice(0, 256); // safety limit
    const session = await (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      CALL db.index.fulltext.queryNodes('article_text_idx', $query)
      YIELD node AS a, score
      WITH a, score
      ORDER BY score DESC
      LIMIT $topK
      RETURN
        a.id            AS id,
        labels(a)[0]    AS label,
        COALESCE(a.number, a.name, a.title, a.id) AS title,
        COALESCE(a.content, a.description, '')     AS content,
        score,
        COALESCE(a.law_id, 'Indonesia Law')        AS source,
        a.law_id                                   AS law_id
      `, { query: escapedQuery, topK });
        return result.records.map((rec) => ({
            id: rec.get("id"),
            label: rec.get("label"),
            title: rec.get("title"),
            content: rec.get("content"),
            score: rec.get("score") / 10, // normalise BM25 to ~0–1
            source: rec.get("source"),
            law_id: rec.get("law_id"),
        }));
    }
    finally {
        await session.close();
    }
}
//# sourceMappingURL=bm25Retrieval.js.map