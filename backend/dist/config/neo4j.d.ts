import { Driver, Session } from "neo4j-driver";
export declare function getDriver(): Driver;
export declare function getSession(): Promise<Session>;
export declare function verifyConnectivity(): Promise<void>;
export declare function closeDriver(): Promise<void>;
//# sourceMappingURL=neo4j.d.ts.map