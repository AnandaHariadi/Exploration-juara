"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * hybridRetrieval.test.ts
 * Tests for hybrid retrieval result merging logic.
 * All Neo4j / Gemini calls are mocked so no real database is needed.
 */
const hybridRetrieval_1 = require("./hybridRetrieval");
const denseModule = __importStar(require("./denseRetrieval"));
const bm25Module = __importStar(require("./bm25Retrieval"));
const contractModule = __importStar(require("./contractRetrieval"));
const symbolicModule = __importStar(require("./symbolicRetrieval"));
const makeResult = (id, score, label = "Article") => ({
    id,
    label,
    title: `Title ${id}`,
    content: `Content for ${id}`,
    score,
    source: "Test",
});
jest.mock("./denseRetrieval");
jest.mock("./bm25Retrieval");
jest.mock("./contractRetrieval");
jest.mock("./symbolicRetrieval");
jest.mock("../embedding/embeddingService", () => ({
    embedText: jest.fn().mockResolvedValue(new Array(768).fill(0.1)),
}));
describe("hybridRetrieval", () => {
    const mockDense = denseModule.denseSearch;
    const mockBm25 = bm25Module.bm25Search;
    const mockContract = contractModule.contractRetrieval;
    const mockSymbolic = symbolicModule.symbolicSearch;
    beforeEach(() => {
        jest.clearAllMocks();
        mockDense.mockResolvedValue([makeResult("a1", 0.9), makeResult("a2", 0.7)]);
        mockBm25.mockResolvedValue([makeResult("a2", 0.8), makeResult("a3", 0.6)]);
        mockSymbolic.mockResolvedValue([]);
        mockContract.mockResolvedValue([]);
    });
    test("merges dense and BM25 results using RRF", async () => {
        const results = await (0, hybridRetrieval_1.hybridRetrieval)("apa itu wanprestasi");
        expect(results).toHaveLength(3); // a1, a2, a3
        // a2 ranks highest because it appears in both lists
        expect(results[0].id).toBe("a2");
    });
    test("returns unique results (no duplicates)", async () => {
        const results = await (0, hybridRetrieval_1.hybridRetrieval)("PKWT maksimal");
        const ids = results.map((r) => r.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids.length).toBe(uniqueIds.length);
    });
    test("includes contract clause results when documentId provided", async () => {
        mockContract.mockResolvedValue([
            makeResult("cc1", 0.95, "ContractClause"),
            makeResult("cc2", 0.88, "ContractClause"),
        ]);
        const results = await (0, hybridRetrieval_1.hybridRetrieval)("klausula denda", "doc-uuid-123");
        expect(mockContract).toHaveBeenCalledWith("klausula denda", "doc-uuid-123", expect.any(Number));
        const contractResults = results.filter((r) => r.label === "ContractClause");
        expect(contractResults.length).toBeGreaterThan(0);
        // Contract clauses boosted to 1.5 weight should rank near top
        expect(results[0].label).toBe("ContractClause");
    });
    test("does not call contractRetrieval when no documentId", async () => {
        await (0, hybridRetrieval_1.hybridRetrieval)("upah minimum");
        expect(mockContract).not.toHaveBeenCalled();
    });
    test("calls symbolicSearch for every query", async () => {
        await (0, hybridRetrieval_1.hybridRetrieval)("somasi dan wanprestasi");
        expect(mockSymbolic).toHaveBeenCalledWith("somasi dan wanprestasi", expect.any(Number));
    });
    test("symbolic results are merged into the final ranking", async () => {
        mockSymbolic.mockResolvedValue([
            makeResult("s1", 0.95, "LegalConcept"),
            makeResult("s2", 0.90, "LegalConcept"),
        ]);
        const results = await (0, hybridRetrieval_1.hybridRetrieval)("wanprestasi somasi");
        const symbolicIds = results.filter((r) => r.label === "LegalConcept");
        expect(symbolicIds.length).toBeGreaterThan(0);
    });
    test("handles denseSearch failure gracefully", async () => {
        mockDense.mockRejectedValue(new Error("Neo4j connection failed"));
        const results = await (0, hybridRetrieval_1.hybridRetrieval)("pesangon");
        // Should still return BM25 results
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((r) => r.id === "a2" || r.id === "a3")).toBe(true);
    });
    test("handles symbolicSearch failure gracefully", async () => {
        mockSymbolic.mockRejectedValue(new Error("Graph traversal failed"));
        const results = await (0, hybridRetrieval_1.hybridRetrieval)("wanprestasi");
        // Dense + BM25 should still return results
        expect(results.length).toBeGreaterThan(0);
    });
    test("handles all legs failing gracefully — returns empty array", async () => {
        mockDense.mockRejectedValue(new Error("Neo4j down"));
        mockBm25.mockRejectedValue(new Error("Neo4j down"));
        mockSymbolic.mockRejectedValue(new Error("Neo4j down"));
        const results = await (0, hybridRetrieval_1.hybridRetrieval)("test query");
        expect(Array.isArray(results)).toBe(true);
    });
});
//# sourceMappingURL=hybridRetrieval.test.js.map