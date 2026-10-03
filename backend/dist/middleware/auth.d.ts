/**
 * auth.ts  (middleware)
 * JWT bearer token verification middleware.
 *
 * Usage: apply verifyToken to any router that requires authentication.
 * Sets req.user = { userId, email, name } on success.
 */
import { Request, Response, NextFunction } from "express";
export interface AuthUser {
    userId: string;
    email: string;
    name: string;
}
declare global {
    namespace Express {
        interface User extends AuthUser {
        }
    }
}
export declare function verifyToken(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map