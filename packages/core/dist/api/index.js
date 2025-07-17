import { authRoutes } from './auth.js';
export async function setupRoutes(fastify) {
    // Register API routes with versioning
    await fastify.register(async function (fastify) {
        // Health check
        fastify.get('/health', async () => {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
            };
        });
        // API routes
        await fastify.register(authRoutes, { prefix: '/auth' });
    }, { prefix: '/api/v1' });
    // Swagger documentation route
    await fastify.register(async function (fastify) {
        fastify.get('/', async (_request, reply) => {
            return reply.redirect('/docs');
        });
    });
}
//# sourceMappingURL=index.js.map