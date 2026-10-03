"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuredPassport = void 0;
const passport_1 = __importDefault(require("passport"));
exports.configuredPassport = passport_1.default;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userService_1 = require("../services/user/userService");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ??
    process.env.OAUTH_GOOGLE_CLIENT_ID ??
    "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ??
    process.env.OAUTH_GOOGLE_CLIENT_SECRET ??
    "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ??
    "http://localhost:3001/api/v1/auth/google/callback";
const JWT_SECRET = process.env.JWT_SECRET ?? "change_me_in_production";
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL, // ✅ pakai absolute URL
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value ?? `${profile.id}@google.com`;
        const name = profile.displayName ?? email;
        const user = await (0, userService_1.upsertUser)(profile.id, email, name);
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
        const authUser = {
            userId: user.id,
            email: user.email,
            name: user.name,
            token,
        };
        done(null, authUser);
    }
    catch (err) {
        done(err);
    }
}));
passport_1.default.serializeUser((user, done) => done(null, user));
passport_1.default.deserializeUser((obj, done) => done(null, obj));
//# sourceMappingURL=passport.js.map