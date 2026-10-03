"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDashboard = getUserDashboard;
/**
 * dashboardService.ts
 *
 * Logic to aggregate user documents and drafter projects.
 */
const neo4j_1 = require("../../config/neo4j");
/**
 * Retrieves a combined list of uploaded documents (reviews) and drafting sessions.
 */
async function getUserDashboard(userId) {
    const session = await (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      // Get Documents
      OPTIONAL MATCH (d:Document { user_id: $userId })
      WITH collect({
        id: d.id,
        title: d.filename,
        created_at: d.created_at,
        type: "review"
      }) AS docs
      
      // Get Drafter Sessions
      OPTIONAL MATCH (ds:DrafterSession { user_id: $userId })
      WITH docs, collect({
        id: ds.id,
        fields: ds.fields,
        document_type: ds.document_type,
        created_at: ds.updated_at,
        type: "draft"
      }) AS drafts
      
      RETURN docs, drafts
      `, { userId });
        if (result.records.length === 0)
            return [];
        const record = result.records[0];
        const docs = record.get("docs").filter(d => d.id !== null);
        const draftsRaw = record.get("drafts").filter(d => d.id !== null);
        const drafts = draftsRaw.map(d => {
            let title = "Untitled Draft";
            try {
                const fields = JSON.parse(d.fields);
                title = fields.party_a_name
                    ? `${fields.party_a_name} - ${d.document_type}`
                    : `Draft ${d.document_type}`;
            }
            catch {
                title = `Draft ${d.document_type}`;
            }
            return {
                id: d.id,
                title,
                created_at: d.created_at?.toString() || new Date().toISOString(),
                type: "draft"
            };
        });
        const documents = docs.map(d => ({
            id: d.id,
            title: d.title,
            created_at: d.created_at?.toString() || new Date().toISOString(),
            type: "review"
        }));
        return [...documents, ...drafts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    finally {
        await session.close();
    }
}
//# sourceMappingURL=dashboardService.js.map