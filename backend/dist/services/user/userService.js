"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertUser = upsertUser;
/**
 * userService.ts
 * Neo4j user management — upsert (create or update) a User node.
 */
const neo4j_1 = require("../../config/neo4j");
const uuid_1 = require("uuid");
/**
 * Upsert a user by their Google ID.
 * Creates the node if it doesn't exist, updates email/name on each login.
 */
async function upsertUser(googleId, email, name) {
    const session = await (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MERGE (u:User { google_id: $googleId })
      ON CREATE SET
        u.id         = $id,
        u.email      = $email,
        u.name       = $name,
        u.created_at = datetime()
      ON MATCH SET
        u.email      = $email,
        u.name       = $name,
        u.updated_at = datetime()
      RETURN u.id AS id, u.google_id AS google_id, u.email AS email, u.name AS name
      `, { googleId, id: (0, uuid_1.v4)(), email, name });
        const record = result.records[0];
        return {
            id: record.get("id"),
            google_id: record.get("google_id"),
            email: record.get("email"),
            name: record.get("name"),
        };
    }
    finally {
        await session.close();
    }
}
//# sourceMappingURL=userService.js.map