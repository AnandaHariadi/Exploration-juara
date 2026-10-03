export declare const env: {
    PORT: number;
    NODE_ENV: string;
    NEO4J_URI: string;
    NEO4J_USER: string;
    NEO4J_PASSWORD: string;
    GOOGLE_AI_API_KEY: string;
    GEMINI_MODEL: string;
    EMBEDDING_MODEL: string;
    GEMINI_BASE_URL: string;
    EMBEDDING_DIMENSION: number;
    REASONING_PATHS: number;
    TEMPERATURE_LOW: number;
    TEMPERATURE_HIGH: number;
    MAX_CONTEXT_TOKENS: number;
    TOP_K_DENSE: number;
    TOP_K_BM25: number;
    TOP_K_SYMBOLIC: number;
    HYBRID_DENSE_WEIGHT: number;
    HYBRID_BM25_WEIGHT: number;
    HYBRID_SYMBOLIC_WEIGHT: number;
    MAX_FILE_SIZE_MB: number;
    UPLOAD_DIR: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    JWT_SECRET: string;
    FRONTEND_URL: string;
    REDIS_URL: string;
    ENABLE_QUEUE: boolean;
    AI_SERVICE_KEY: string;
    DRAFTER_MIN_CONFIDENCE: number;
};
export declare const aiConfigured: () => boolean;
/** Request options for every Gemini model; empty unless GEMINI_BASE_URL is set. */
export declare const geminiRequestOptions: () => {
    baseUrl: string;
} | undefined;
//# sourceMappingURL=env.d.ts.map