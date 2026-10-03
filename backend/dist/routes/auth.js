"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * auth.ts  (route)
 * Google OAuth 2.0 callback routes + /me endpoint.
 *
 * @swagger
 * tags:
 *   name: Auth
 *   description: Google OAuth 2.0 authentication
 */
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_1 = require("../middleware/auth");
const passport_2 = require("../config/passport");
const router = (0, express_1.Router)();
// Without OAuth credentials the Google routes answer clearly instead of crashing.
router.use("/google", (_req, res, next) => {
    if (passport_2.googleOAuthEnabled)
        return next();
    res.status(503).json({ status: "error", code: "OAUTH_NOT_CONFIGURED", message: "Google OAuth belum dikonfigurasi pada layanan ini." });
});
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Redirect to Google OAuth
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to Google sign-in
 */
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"], session: false }));
/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback – issues JWT
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to frontend with token in query string
 *       401:
 *         description: Authentication failed
 */
router.get("/google/callback", passport_1.default.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` }), (req, res) => {
    const token = req.user?.token;
    if (!token) {
        res.redirect(`${FRONTEND_URL}/login?error=token_missing`);
        return;
    }
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
});
/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Return current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User object
 *       401:
 *         description: Unauthorized
 */
router.get("/me", auth_1.verifyToken, (req, res) => {
    res.json({ status: "success", data: req.user });
});
exports.default = router;
//# sourceMappingURL=auth.js.map