import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
export * from './auth.js';
export * from './error.js';
export * from './rateLimit.js';
export async function setupMiddleware(fastify) {
    // CORS
    await fastify.register(cors, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
    });
    // Security headers
    await fastify.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
    });
    // JWT
    await fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
    // Rate limiting
    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });
    // File upload support
    await fastify.register(multipart);
    // WebSocket support
    await fastify.register(websocket);
    // Swagger documentation
    await fastify.register(swagger, {
        swagger: {
            info: {
                title: 'UniMatrix API',
                description: 'Universal AI, Blockchain, IoT Platform API',
                version: '1.0.0',
            },
            host: 'localhost:3001',
            schemes: ['http', 'https'],
            consumes: ['application/json'],
            produces: ['application/json'],
            securityDefinitions: {
                bearerAuth: {
                    type: 'apiKey',
                    name: 'Authorization',
                    in: 'header',
                },
            },
        },
    });
    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'full',
            deepLinking: false,
        },
    });
    // Authentication decorator
    fastify.decorate('authenticate', async function (request, reply) {
        const { authMiddleware } = await import('./auth.js');
        await authMiddleware(request, reply);
    });
    // Error handlers
    const { errorHandler, notFoundHandler } = await import('./error.js');
    fastify.setErrorHandler(errorHandler);
    fastify.setNotFoundHandler(notFoundHandler);
}
//# sourceMappingURL=index.js.map