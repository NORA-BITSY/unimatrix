import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.js';
import { apiGateway } from '../services/gateway.js';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

// Validation schemas
const timeRangeSchema = z.object({
  start: z.string().optional().default(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  end: z.string().optional().default(() => new Date().toISOString()),
});

const eventSchema = z.object({
  type: z.enum(['request', 'error', 'performance', 'user_action']),
  data: z.record(z.any()),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

// Auth middleware placeholder (simplified for now)
async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ success: false, error: 'Unauthorized' });
  }
}

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Get dashboard analytics data
  fastify.get('/dashboard', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Analytics'],
      description: 'Get analytics dashboard data',
      querystring: {
        type: 'object',
        properties: {
          start: { type: 'string' },
          end: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = timeRangeSchema.parse(request.query);
      const timeRange = {
        start: new Date(query.start),
        end: new Date(query.end)
      };

      const dashboardData = analyticsService.getDashboardData(timeRange);
      
      reply.send({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to get dashboard data',
          requestId: request.id
        }
      });
    }
  });

  // Get real-time metrics
  fastify.get('/realtime', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Analytics'],
      description: 'Get real-time metrics',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requests: { type: 'object' },
                system: { type: 'object' },
                alerts: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const realTimeMetrics = analyticsService.getRealTimeMetrics();
      
      reply.send({
        success: true,
        data: realTimeMetrics
      });
    } catch (error) {
      logger.error('Error getting real-time metrics:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to get real-time metrics',
          requestId: request.id
        }
      });
    }
  });

  // Track custom event
  fastify.post('/events', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Analytics'],
      description: 'Track a custom analytics event',
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['request', 'error', 'performance', 'user_action'] },
          data: { type: 'object' },
          userId: { type: 'string' },
          sessionId: { type: 'string' }
        },
        required: ['type', 'data']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const eventData = eventSchema.parse(request.body);
      const user = (request as any).user;
      
      analyticsService.trackEvent(
        eventData.type,
        eventData.data,
        eventData.userId || user?.id,
        eventData.sessionId
      );
      
      reply.send({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking event:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to track event',
          requestId: request.id
        }
      });
    }
  });

  // Get API Gateway statistics
  fastify.get('/gateway', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Analytics'],
      description: 'Get API Gateway statistics and configuration',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                routes: { type: 'array' },
                rateLimitStats: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const routes = apiGateway.getRoutes();
      const rateLimitStats = apiGateway.getRateLimitStats();
      
      reply.send({
        success: true,
        data: {
          routes,
          rateLimitStats
        }
      });
    } catch (error) {
      logger.error('Error getting gateway stats:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to get gateway statistics',
          requestId: request.id
        }
      });
    }
  });

  // Clear rate limit for a specific key (admin only)
  fastify.delete('/gateway/rate-limit/:key', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Analytics'],
      description: 'Clear rate limit for a specific key',
      params: {
        type: 'object',
        properties: {
          key: { type: 'string' }
        },
        required: ['key']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { key } = request.params as { key: string };
      const cleared = apiGateway.clearRateLimit(decodeURIComponent(key));
      
      reply.send({
        success: true,
        message: cleared ? 'Rate limit cleared successfully' : 'Rate limit key not found'
      });
    } catch (error) {
      logger.error('Error clearing rate limit:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to clear rate limit',
          requestId: request.id
        }
      });
    }
  });

  // Get analytics export (CSV format)
  fastify.get('/export', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Analytics'],
      description: 'Export analytics data as CSV',
      querystring: {
        type: 'object',
        properties: {
          start: { type: 'string' },
          end: { type: 'string' },
          format: { type: 'string', enum: ['csv', 'json'], default: 'csv' },
          type: { type: 'string', enum: ['requests', 'events', 'system'], default: 'requests' }
        }
      },
      response: {
        200: {
          type: 'string',
          description: 'CSV or JSON data'
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        start: z.string().optional().default(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        end: z.string().optional().default(() => new Date().toISOString()),
        format: z.enum(['csv', 'json']).optional().default('csv'),
        type: z.enum(['requests', 'events', 'system']).optional().default('requests')
      }).parse(request.query);

      const timeRange = {
        start: new Date(query.start),
        end: new Date(query.end)
      };

      const dashboardData = analyticsService.getDashboardData(timeRange);
      
      if (query.format === 'csv') {
        // Simple CSV conversion (in production, use a proper CSV library)
        let csv = '';
        if (query.type === 'requests') {
          csv = 'Endpoint,Method,Total Requests,Errors,Avg Response Time\n';
          dashboardData.endpoints.forEach((endpoint: any) => {
            csv += `"${endpoint.endpoint}","${endpoint.method}",${endpoint.totalRequests},${endpoint.errors},${endpoint.avgResponseTime}\n`;
          });
        }
        
        reply.type('text/csv');
        reply.header('Content-Disposition', `attachment; filename="analytics-${query.type}-${new Date().toISOString().split('T')[0]}.csv"`);
        reply.send(csv);
      } else {
        reply.type('application/json');
        reply.header('Content-Disposition', `attachment; filename="analytics-${query.type}-${new Date().toISOString().split('T')[0]}.json"`);
        reply.send(JSON.stringify(dashboardData, null, 2));
      }
    } catch (error) {
      logger.error('Error exporting analytics data:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to export analytics data',
          requestId: request.id
        }
      });
    }
  });

  logger.info('Analytics API routes registered');
}
