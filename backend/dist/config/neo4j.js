"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriver = getDriver;
exports.getSession = getSession;
exports.verifyConnectivity = verifyConnectivity;
exports.closeDriver = closeDriver;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const env_1 = require("./env");
let driver = null;
function getDriver() {
    if (!driver) {
        driver = neo4j_driver_1.default.driver(env_1.env.NEO4J_URI, neo4j_driver_1.default.auth.basic(env_1.env.NEO4J_USER, env_1.env.NEO4J_PASSWORD), {
            maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
            logging: neo4j_driver_1.default.logging.console(env_1.env.NODE_ENV === "development" ? "warn" : "error"),
        });
    }
    return driver;
}
async function getSession() {
    return getDriver().session({ database: "neo4j" });
}
async function verifyConnectivity() {
    const d = getDriver();
    await d.verifyConnectivity();
    console.log("Neo4j connected:", env_1.env.NEO4J_URI);
}
async function closeDriver() {
    if (driver) {
        await driver.close();
        driver = null;
        console.log("Neo4j driver closed.");
    }
}
// Graceful shutdown: close the driver, then actually exit (a bare handler
// would replace Node's default exit and keep the process alive).
const shutdown = () => {
    void closeDriver().finally(() => process.exit(0));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
//# sourceMappingURL=neo4j.js.map