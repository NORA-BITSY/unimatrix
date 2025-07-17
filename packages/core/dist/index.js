import Fastify from 'fastify';
import { setupRoutes } from './api/index.js';
import { setupMiddleware } from './middleware/index.js';
import { DatabaseService } from './services/database.service.js';
import { RedisService } from './services/redis.service.js';
import { config } from './config/index.js';
// Simple logger for now
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => console.debug('[DEBUG]', ...args),
};
const server = Fastify({
    logger: {
        level: config.isDevelopment() ? 'debug' : 'info',
        transport: config.isDevelopment()
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    },
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
});
async function buildServer() {
    try {
        // Initialize services
        await DatabaseService.initialize();
        await RedisService.initialize();
        // Setup middleware
        await setupMiddleware(server);
        // Setup routes
        await setupRoutes(server);
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);
            try {
                await server.close();
                await DatabaseService.disconnect();
                await RedisService.disconnect();
                logger.info('Server shut down successfully');
                process.exit(0);
            }
            catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return server;
    }
    catch (error) {
        logger.error('Failed to build server:', error);
        process.exit(1);
    }
}
async function start() {
    try {
        const app = await buildServer();
        const port = config.port;
        const host = config.isDevelopment() ? '0.0.0.0' : '127.0.0.1';
        await app.listen({ port, host });
        logger.info(`🚀 UniMatrix Core Server running at http://${host}:${port}`);
        logger.info(`📚 API Documentation: http://${host}:${port}/docs`);
        logger.info(`🔍 Health Check: http://${host}:${port}/health`);
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    start();
}
export { buildServer, start };
//# sourceMappingURL=index.js.map