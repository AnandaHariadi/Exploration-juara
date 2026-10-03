"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
/**
 * swagger.ts
 * API documentation config using swagger-jsdoc.
 * Mounted at GET /api/docs in index.ts.
 */
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CLARA – Contract & Legal AI Reasoning Assistant",
            version: "1.0.0",
            description: "REST API for CLARA: OCR-powered contract analysis, Legal Q&A, Document drafter, and more.",
        },
        servers: [
            { url: "http://localhost:3001", description: "Local development" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./src/routes/*.ts"],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map