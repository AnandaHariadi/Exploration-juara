export interface User {
    id: string;
    google_id: string;
    email: string;
    name: string;
}
/**
 * Upsert a user by their Google ID.
 * Creates the node if it doesn't exist, updates email/name on each login.
 */
export declare function upsertUser(googleId: string, email: string, name: string): Promise<User>;
//# sourceMappingURL=userService.d.ts.map