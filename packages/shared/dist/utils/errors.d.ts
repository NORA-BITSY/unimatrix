export declare class BaseError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, code: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends BaseError {
    constructor(message: string);
}
export declare class AuthenticationError extends BaseError {
    constructor(message?: string);
}
export declare class AuthorizationError extends BaseError {
    constructor(message?: string);
}
export declare class NotFoundError extends BaseError {
    constructor(resource?: string);
}
export declare class ConflictError extends BaseError {
    constructor(message: string);
}
export declare class RateLimitError extends BaseError {
    constructor(message?: string);
}
export declare class ExternalServiceError extends BaseError {
    constructor(service: string, message: string);
}
export declare class DatabaseError extends BaseError {
    constructor(message: string);
}
export declare function isOperationalError(error: Error): boolean;
//# sourceMappingURL=errors.d.ts.map