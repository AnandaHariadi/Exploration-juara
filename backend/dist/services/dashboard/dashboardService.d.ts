export interface UserProject {
    id: string;
    title: string;
    created_at: string;
    type: "review" | "draft";
}
/**
 * Retrieves a combined list of uploaded documents (reviews) and drafting sessions.
 */
export declare function getUserDashboard(userId: string): Promise<UserProject[]>;
//# sourceMappingURL=dashboardService.d.ts.map