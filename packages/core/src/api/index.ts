import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { aiRoutes } from './ai.js';
import { blockchainRoutes } from './blockchain.js';
import { iotRoutes } from './iot.js';
import { chatRoutes } from './chat-simple.js';
import { fileRoutes } from './files.js';
import { healthRoutes } from './health.js';
import { analyticsRoutes } from './analytics.js';
import { pluginRoutes } from './plugins.js';
import { websocketRoutes } from '../services/websocket.js';
// import { websocketRoutes } from './websocket.js'; // TODO: Fix WebSocket registration

export async function setupRoutes(server: FastifyInstance): Promise<void> {
  // API routes with versioning
  await server.register(async function (fastify) {
    // Basic health check
    fastify.get('/health', async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: true, // TODO: Add actual health checks
          redis: true,
          ai: true,
          blockchain: true,
          iot: true,
        },
      };
    });

    // Public routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    
    // Protected routes (will require authentication when auth middleware is working)
    await fastify.register(aiRoutes, { prefix: '/ai' });
    await fastify.register(blockchainRoutes, { prefix: '/blockchain' });
    await fastify.register(iotRoutes, { prefix: '/iot' });
    await fastify.register(chatRoutes, { prefix: '/chat' });
    await fastify.register(fileRoutes, { prefix: '/files' });
    await fastify.register(healthRoutes, { prefix: '/system' });
    await fastify.register(analyticsRoutes, { prefix: '/analytics' });
    await fastify.register(pluginRoutes, { prefix: '/plugins' });
    
    // WebSocket routes
    await fastify.register(websocketRoutes, { prefix: '/ws' });
    
  }, { prefix: '/api/v1' });

  // API documentation route
  await server.register(async function (fastify) {
    fastify.get('/', async (_request, reply) => {
      return reply.redirect('/docs');
    });
    
    fastify.get('/api', async () => {
      return {
        name: 'UniMatrix Core API',
        version: '1.0.0',
        description: 'Universal Enterprise Platform API',
        endpoints: {
          auth: '/api/v1/auth',
          ai: '/api/v1/ai',
          blockchain: '/api/v1/blockchain',
          iot: '/api/v1/iot',
          chat: '/api/v1/chat',
          files: '/api/v1/files',
          health: '/api/v1/system',
          analytics: '/api/v1/analytics',
          plugins: '/api/v1/plugins',
          websocket: '/api/v1/ws'
        },
      };
    });
  });
}

export async function registerRoutes(app: FastifyInstance) {
  console.log('Registering API routes...');
  
  // API documentation endpoint
  app.get('/api', async (_request, reply) => {
    return reply.send({
      name: 'UniMatrix Core API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/v1/auth',
        ai: '/api/v1/ai',
        blockchain: '/api/v1/blockchain',
        iot: '/api/v1/iot',
        chat: '/api/v1/chat',
        files: '/api/v1/files',
        health: '/api/v1/health'
      }
    });
  });

  // Register all route modules with versioning
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(aiRoutes, { prefix: '/api/v1/ai' });
  await app.register(blockchainRoutes, { prefix: '/api/v1/blockchain' });
  await app.register(iotRoutes, { prefix: '/api/v1/iot' });
  await app.register(chatRoutes, { prefix: '/api/v1/chat' });
  await app.register(fileRoutes, { prefix: '/api/v1/files' });
  await app.register(healthRoutes, { prefix: '/api/v1/health' });
  
  // TODO: Enable WebSocket routes when fixed
  // await app.register(websocketRoutes, { prefix: '/api/v1/ws' });

  console.log('API routes registered successfully');
}
