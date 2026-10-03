/**
 * response.ts
 * Unified API response envelope helpers.
 *
 * Every route should use success() / error() so the front-end always receives
 * a consistent shape: { status, data?, meta?, code?, message?, details? }
 */
export interface SuccessResponse<T = unknown> {
    status: "success";
    data: T;
    meta?: Record<string, unknown>;
}
export interface ErrorResponse {
    status: "error";
    code: string;
    message: string;
    details?: unknown;
}
export declare function success<T>(data: T, meta?: Record<string, unknown>): SuccessResponse<T>;
export declare function error(code: string, message: string, details?: unknown): ErrorResponse;
//# sourceMappingURL=response.d.ts.map