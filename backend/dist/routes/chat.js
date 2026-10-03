"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * chat.ts
 *
 * Universal endpoint to retrieve chat history for any session.
 */
const express_1 = require("express");
const chatService_1 = require("../services/chat/chatService");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/v1/chat/session/{sessionId}/history:
 *   get:
 *     summary: Retrieve chat history for a specific session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The session_id of the chat
 *     responses:
 *       200:
 *         description: List of chat messages
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 */
router.get("/session/:sessionId/history", auth_1.verifyToken, async (req, res) => {
    const sessionId = req.params.sessionId;
    try {
        const { history, endpoint_type } = await (0, chatService_1.getSessionHistory)(sessionId);
        res.json((0, response_1.success)({
            session_id: sessionId,
            endpoint_type,
            history
        }));
    }
    catch (err) {
        console.error("[chat/history]", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        res.status(500).json((0, response_1.error)("INTERNAL", message));
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map