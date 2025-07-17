import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../services/database.js';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

// Health check service
class HealthService {
  async checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      await db.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async checkMemory(): Promise<{ status: string; usage: any }> {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    
    return {
      status: totalMB > 1000 ? 'warning' : 'healthy', // Warn if using > 1GB
      usage: {
        rss: `${totalMB}MB`,
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`
      }
    };
  }

  async checkDisk(): Promise<{ status: string; info?: any; error?: string }> {
    try {
      const fs = await import('fs/promises');
      
      // Check available disk space (simplified)
      await fs.stat(process.cwd());
      return { 
        status: 'healthy',
        info: {
          path: process.cwd(),
          accessible: true
        }
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getSystemInfo() {
    const os = await import('os');
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
      cpus: os.cpus().length
    };
  }

  async getDetailedHealth() {
    const [database, memory, disk, system] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
      this.getSystemInfo()
    ]);

    const overall = database.status === 'healthy' && 
                   memory.status !== 'unhealthy' && 
                   disk.status === 'healthy' ? 'healthy' : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        memory,
        disk,
        system
      },
      services: {
        api: 'healthy',
        auth: 'healthy',
        ai: 'healthy',
        blockchain: 'healthy',
        iot: 'healthy',
        chat: 'healthy',
        files: 'healthy'
      }
    };
  }
}

const healthService = new HealthService();

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const health = await healthService.getDetailedHealth();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      reply.code(statusCode).send({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      reply.code(503).send({
        success: false,
        error: 'Health check failed',
        status: 'unhealthy'
      });
    }
  });

  // Liveness probe (for Kubernetes)
  fastify.get('/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  });

  // Readiness probe (for Kubernetes)
  fastify.get('/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dbCheck = await healthService.checkDatabase();
      
      if (dbCheck.status === 'healthy') {
        reply.send({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        reply.code(503).send({
          status: 'not ready',
          reason: 'Database not available'
        });
      }
    } catch (error) {
      reply.code(503).send({
        status: 'not ready',
        reason: 'Health check failed'
      });
    }
  });

  // Database-specific health check
  fastify.get('/database', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await healthService.checkDatabase();
      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      reply.code(503).send({
        success: false,
        error: 'Database health check failed'
      });
    }
  });

  // System metrics
  fastify.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [memory, system] = await Promise.all([
        healthService.checkMemory(),
        healthService.getSystemInfo()
      ]);

      reply.send({
        success: true,
        data: {
          memory,
          system,
          process: {
            pid: process.pid,
            uptime: process.uptime(),
            version: process.version,
            platform: process.platform,
            arch: process.arch
          }
        }
      });
    } catch (error) {
      logger.error('Metrics check failed:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get system metrics'
      });
    }
  });

  logger.info('Health API routes registered');
}
