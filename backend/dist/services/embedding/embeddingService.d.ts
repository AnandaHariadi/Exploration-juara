/**
 * embeddingService.ts
 * Generates vector embeddings using Google's gemini-embedding-001 model
 * (768 dimensions, optimised for semantic similarity / retrieval tasks).
 */
import { TaskType } from "@google/generative-ai";
/**
 * Embed a single text string.
 * @param text Input text (truncated to ~8 192 tokens by the API)
 * @param taskType RETRIEVAL_DOCUMENT for indexing, RETRIEVAL_QUERY for queries
 */
export declare function embedText(text: string, taskType?: TaskType): Promise<number[]>;
/**
 * Embed multiple texts sequentially with 200 ms delay to respect rate limits.
 */
export declare function embedBatch(texts: string[], taskType?: TaskType): Promise<number[][]>;
//# sourceMappingURL=embeddingService.d.ts.map