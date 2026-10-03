/**
 * analysisQueue.ts
 * BullMQ Queue for async document analysis jobs.
 *
 * Payload shape:
 *   { documentId, userId, bufferBase64, mimeType }
 */
import { Queue } from "bullmq";
export interface AnalysisJob {
    documentId: string;
    userId: string;
    bufferBase64: string;
    mimeType: string;
}
export declare const analysisQueue: Queue<AnalysisJob, any, string, AnalysisJob, any, string>;
//# sourceMappingURL=analysisQueue.d.ts.map