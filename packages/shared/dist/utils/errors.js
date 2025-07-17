export class BaseError extends Error {
    code;
    statusCode;
    isOperational;
    constructor(message, code, statusCode = 500, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends BaseError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}
export class AuthenticationError extends BaseError {
    constructor(message = 'Authentication failed') {
        super(message, 'AUTHENTICATION_ERROR', 401);
    }
}
export class AuthorizationError extends BaseError {
    constructor(message = 'Insufficient permissions') {
        super(message, 'AUTHORIZATION_ERROR', 403);
    }
}
export class NotFoundError extends BaseError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
    }
}
export class ConflictError extends BaseError {
    constructor(message) {
        super(message, 'CONFLICT_ERROR', 409);
    }
}
export class RateLimitError extends BaseError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 'RATE_LIMIT_ERROR', 429);
    }
}
export class ExternalServiceError extends BaseError {
    constructor(service, message) {
        super(`${service} service error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
    }
}
export class DatabaseError extends BaseError {
    constructor(message) {
        super(`Database error: ${message}`, 'DATABASE_ERROR', 500);
    }
}
export function isOperationalError(error) {
    if (error instanceof BaseError) {
        return error.isOperational;
    }
    return false;
}
//# sourceMappingURL=errors.js.map