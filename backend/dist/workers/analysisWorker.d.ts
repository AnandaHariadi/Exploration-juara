/**
 * analysisWorker.ts
 * BullMQ Worker – processes document-analysis jobs from analysisQueue.
 *
 * Per job:
 *  1. OCR the uploaded file buffer
 *  2. Run guardrail checks
 *  3. Store ContractClause nodes + embeddings in Neo4j (scoped to userId)
 */
import { Worker } from "bullmq";
import type { AnalysisJob } from "../queues/analysisQueue";
export declare const analysisWorker: Worker<AnalysisJob, any, string>;
//# sourceMappingURL=analysisWorker.d.ts.map