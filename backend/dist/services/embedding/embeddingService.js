"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedText = embedText;
exports.embedBatch = embedBatch;
/**
 * embeddingService.ts
 * Generates vector embeddings using Google's gemini-embedding-001 model
 * (768 dimensions, optimised for semantic similarity / retrieval tasks).
 */
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../../config/env");
const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.env.GOOGLE_AI_API_KEY);
// Rate-limit helper: 200 ms between calls
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/**
 * Embed a single text string.
 * @param text Input text (truncated to ~8 192 tokens by the API)
 * @param taskType RETRIEVAL_DOCUMENT for indexing, RETRIEVAL_QUERY for queries
 */
async function embedText(text, taskType = generative_ai_1.TaskType.RETRIEVAL_DOCUMENT) {
    const model = genAI.getGenerativeModel({ model: env_1.env.EMBEDDING_MODEL }, (0, env_1.geminiRequestOptions)());
    const result = await model.embedContent({
        content: { parts: [{ text }], role: "user" },
        taskType,
    });
    return result.embedding.values;
}
/**
 * Embed multiple texts sequentially with 200 ms delay to respect rate limits.
 */
async function embedBatch(texts, taskType = generative_ai_1.TaskType.RETRIEVAL_DOCUMENT) {
    const embeddings = [];
    for (const text of texts) {
        embeddings.push(await embedText(text, taskType));
        await sleep(200);
    }
    return embeddings;
}
//# sourceMappingURL=embeddingService.js.map