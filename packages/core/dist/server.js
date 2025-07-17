import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
// Import our services and routes
import { authRoutes } from './api/auth.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { connectDatabase, disconnectDatabase } from './services/database.js';
// import { connectRedis, disconnectRedis } from './services/redis.js';
const server = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
        },
    },
    requestIdLogLabel: 'requestId',
    requestIdHeader: 'x-request-id',
});
async function start() {
    try {
        // Connect to services
        await connectDatabase();
        // Redis is temporarily disabled until we can properly handle unavailable Redis
        // try {
        //   await connectRedis();
        //   server.log.info('Redis connected successfully');
        // } catch (error) {
        //   server.log.warn('Redis unavailable, continuing without Redis cache:', error);
        // }
        // Register plugins
        await server.register(cors, {
            origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true,
        });
        await server.register(helmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
        });
        await server.register(jwt, {
            secret: process.env.JWT_SECRET || 'your-very-long-32-character-secret-key-for-development-only-change-this-in-production',
        });
        await server.register(rateLimit, {
            max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
            timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
        });
        await server.register(multipart);
        // WebSocket support
        await server.register(websocket);
        // Swagger documentation
        await server.register(swagger, {
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
        await server.register(swaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'full',
                deepLinking: false,
            },
        });
        // Authentication decorator
        server.decorate('authenticate', async function (request, reply) {
            await authMiddleware(request, reply);
        });
        // Error handlers
        server.setErrorHandler(errorHandler);
        server.setNotFoundHandler(notFoundHandler);
        // Health check
        server.get('/health', async () => {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                services: {
                    database: true, // TODO: Add actual health checks
                    redis: true,
                },
            };
        });
        // Register API routes
        await server.register(authRoutes, { prefix: '/api/v1/auth' });
        // Register AI routes
        const { aiRoutes } = await import('./api/ai.js');
        await server.register(aiRoutes, { prefix: '/api/v1/ai' });
        // Register Blockchain routes
        const { blockchainRoutes } = await import('./api/blockchain.js');
        await server.register(blockchainRoutes, { prefix: '/api/v1/blockchain' });
        // Register WebSocket routes
        const { websocketRoutes } = await import('./api/websocket.js');
        await server.register(websocketRoutes);
        // API routes placeholder
        server.get('/api/v1/test', async () => {
            return { message: 'UniMatrix Core API is running with full authentication!' };
        });
        const port = parseInt(process.env.PORT || '3001');
        const host = '0.0.0.0';
        await server.listen({ port, host });
        server.log.info(`🚀 UniMatrix Core API server started on http://${host}:${port}`);
        server.log.info(`📚 API Documentation available at http://${host}:${port}/docs`);
        server.log.info(`🔍 Health Check: http://${host}:${port}/health`);
        server.log.info(`🧪 Test Endpoint: http://${host}:${port}/api/v1/test`);
        server.log.info(`🔐 Auth Endpoints: http://${host}:${port}/api/v1/auth/*`);
    }
    catch (error) {
        server.log.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
async function shutdown() {
    server.log.info('Shutting down server...');
    try {
        await server.close();
        await disconnectDatabase();
        // Disconnect Redis if connected
        // try {
        //   await disconnectRedis();
        // } catch (error) {
        //   server.log.warn('Redis was not connected during shutdown');
        // }
        server.log.info('Server shutdown complete');
    }
    catch (error) {
        server.log.error('Error during shutdown:', error);
    }
    process.exit(0);
}
// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// Start the server
start();
//# sourceMappingURL=server.js.map