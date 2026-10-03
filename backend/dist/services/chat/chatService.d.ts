export type EndpointType = "drafter" | "query" | "contract";
export type ChatRole = "user" | "assistant" | "model";
export interface ChatMessage {
    role: ChatRole;
    content: string;
}
export interface StoredChatMessage extends ChatMessage {
    id: string;
    timestamp: string;
}
export interface SessionHistory {
    endpoint_type: EndpointType | null;
    history: StoredChatMessage[];
}
/**
 * Saves a new message to a ChatSession.
 * If the session doesn't exist, it creates it.
 */
export declare function saveChatMessage(sessionId: string, userId: string, endpointType: EndpointType, role: ChatRole, content: string, documentId?: string | null): Promise<void>;
/**
 * Retrieves the full chat history for a given session, ordered by timestamp.
 */
export declare function getSessionHistory(sessionId: string): Promise<SessionHistory>;
//# sourceMappingURL=chatService.d.ts.map