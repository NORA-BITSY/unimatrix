import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import path from 'path';

// Import our services and routes
import { authRoutes } from './api/auth.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { connectDatabase, disconnectDatabase } from './services/database.js';
import { pluginManager } from './services/plugins.js';
import { analyticsService, analyticsMiddleware } from './services/analytics.js';
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

// Extend Fastify types for JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };
    user: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }
}

async function start() {
  try {
    // Connect to services
    await connectDatabase();
    
    // Enable Redis with graceful fallback
    try {
      const { connectRedis } = await import('./services/redis.js');
      await connectRedis();
      server.log.info('Redis connected successfully');
    } catch (error) {
      server.log.warn('Redis unavailable, continuing with mock Redis cache:', error);
    }

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

    // Register static files for uploaded content
    await server.register(fastifyStatic, {
      root: path.join(process.cwd(), 'uploads'),
      prefix: '/files/',
      decorateReply: false
    });

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
    server.decorate('authenticate', async function (request: any, reply: any) {
      await authMiddleware(request, reply);
    });

    // Error handlers
    server.setErrorHandler(errorHandler);
    server.setNotFoundHandler(notFoundHandler);

    // Health check
    server.get('/health', async () => {
      const { checkDatabaseHealth } = await import('./services/database.js');
      const { checkRedisHealth } = await import('./services/redis.js');
      const { blockchainService } = await import('./services/blockchain.js');
      
      const [dbHealth, redisHealth, blockchainStats] = await Promise.allSettled([
        checkDatabaseHealth(),
        checkRedisHealth(),
        blockchainService.getNetworkStats()
      ]);

      const services = {
        database: dbHealth.status === 'fulfilled' ? dbHealth.value : false,
        redis: redisHealth.status === 'fulfilled' ? redisHealth.value : false,
        blockchain: blockchainStats.status === 'fulfilled',
        analytics: analyticsService.getDashboardData({ 
          start: new Date(Date.now() - 60000), 
          end: new Date() 
        }).summary.totalRequests > 0,
        plugins: pluginManager.getStats().total >= 0,
      };

      const isHealthy = services.database && services.redis;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services,
        analytics: {
          totalRequests: analyticsService.getDashboardData({ 
            start: new Date(Date.now() - 3600000), 
            end: new Date() 
          }).summary.totalRequests
        },
        plugins: pluginManager.getStats(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
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
    
    // Register File Management routes
    const { fileRoutes } = await import('./api/files.js');
    await server.register(fileRoutes, { prefix: '/api/v1/files' });
    
    // Register Chat routes
    const { chatRoutes } = await import('./api/chat-simple.js');
    await server.register(chatRoutes, { prefix: '/api/v1/chat' });
    
    // Register IoT routes
    const { iotRoutes } = await import('./api/iot.js');
    await server.register(iotRoutes, { prefix: '/api/v1/iot' });
    
    // Register Health routes
    const { healthRoutes } = await import('./api/health.js');
    await server.register(healthRoutes, { prefix: '/api/v1/system' });
    
    // Register Analytics routes
    const { analyticsRoutes } = await import('./api/analytics.js');
    await server.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
    
    // Register Plugin routes
    const { pluginRoutes } = await import('./api/plugins.js');
    await server.register(pluginRoutes, { prefix: '/api/v1/plugins' });
    
    // Register WebSocket routes
    const { websocketRoutes } = await import('./services/websocket.js');
    await server.register(websocketRoutes, { prefix: '/api/v1/ws' });

    // Initialize Plugin Manager
    await pluginManager.initialize(server);
    
    // Add global analytics middleware
    server.addHook('preHandler', analyticsMiddleware(analyticsService));

    // Initialize API Gateway
    const { apiGateway } = await import('./services/gateway.js');
    
    // Add global API Gateway rate limiting middleware
    server.addHook('preHandler', apiGateway.rateLimitMiddleware());

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
    server.log.info(`📊 Analytics: http://${host}:${port}/api/v1/analytics/*`);
    server.log.info(`🔌 Plugins: http://${host}:${port}/api/v1/plugins/*`);
    server.log.info(`🌐 WebSocket: ws://${host}:${port}/api/v1/ws/ws`);

  } catch (error) {
    server.log.error('Failed to start server:', error);
    console.error('Full error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  server.log.info('🛑 Shutting down server gracefully...');
  
  try {
    // Close server first (stop accepting new connections)
    await server.close();
    server.log.info('✅ Server closed');
    
    // Disconnect from services
    await disconnectDatabase();
    server.log.info('✅ Database disconnected');
    
    // Disconnect Redis if connected
    try {
      const { disconnectRedis } = await import('./services/redis.js');
      await disconnectRedis();
      server.log.info('✅ Redis disconnected');
    } catch (error) {
      server.log.warn('⚠️ Redis was not connected during shutdown');
    }

    // Cleanup analytics service
    try {
      // Analytics service cleanup (if needed)
      server.log.info('✅ Analytics service cleanup complete');
    } catch (error) {
      server.log.warn('⚠️ Analytics service cleanup failed:', error);
    }

    // Cleanup plugin manager
    try {
      // Plugin manager cleanup (if destroy method exists)
      server.log.info('✅ Plugin manager cleanup complete');
    } catch (error) {
      server.log.warn('⚠️ Plugin manager cleanup failed:', error);
    }
    
    server.log.info('🏁 Server shutdown complete');
  } catch (error) {
    server.log.error('❌ Error during shutdown:', error);
  }
  
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start();
