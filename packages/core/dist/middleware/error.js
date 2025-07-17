import { ZodError } from 'zod';
import { logger } from '@matrix/shared';
export async function errorHandler(error, request, reply) {
    const requestId = request.id;
    logger.error('Request error', {
        error: error.message,
        stack: error.stack,
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip
    });
    // Zod validation errors
    if (error instanceof ZodError) {
        const response = {
            success: false,
            error: {
                type: 'ValidationError',
                message: 'Invalid request data',
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                })),
                requestId
            }
        };
        await reply.status(400).send(response);
        return;
    }
    // JWT errors
    if (error.message?.includes('jwt') || error.code === 'FST_JWT_BAD_REQUEST') {
        const response = {
            success: false,
            error: {
                type: 'AuthenticationError',
                message: 'Invalid or expired token',
                requestId
            }
        };
        await reply.status(401).send(response);
        return;
    }
    // Rate limit errors
    if (error.statusCode === 429) {
        const response = {
            success: false,
            error: {
                type: 'RateLimitError',
                message: 'Too many requests',
                requestId
            }
        };
        await reply.status(429).send(response);
        return;
    }
    // Database errors
    if (error.message?.includes('Prisma') || error.message?.includes('Database')) {
        const response = {
            success: false,
            error: {
                type: 'DatabaseError',
                message: 'Database operation failed',
                requestId
            }
        };
        await reply.status(500).send(response);
        return;
    }
    // Custom application errors
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        const response = {
            success: false,
            error: {
                type: error.name || 'ClientError',
                message: error.message,
                code: error.code,
                requestId
            }
        };
        await reply.status(error.statusCode).send(response);
        return;
    }
    // Default server error
    const response = {
        success: false,
        error: {
            type: 'InternalServerError',
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message,
            requestId
        }
    };
    await reply.status(500).send(response);
}
// Not found handler
export async function notFoundHandler(request, reply) {
    const response = {
        success: false,
        error: {
            type: 'NotFoundError',
            message: `Route ${request.method} ${request.url} not found`,
            requestId: request.id
        }
    };
    await reply.status(404).send(response);
}
//# sourceMappingURL=error.js.map