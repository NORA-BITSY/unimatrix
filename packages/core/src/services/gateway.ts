import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitError } from '@matrix/shared';

interface RateLimitRule {
  endpoint: string;
  method: string;
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: FastifyRequest) => string;
}

interface RouteConfig {
  path: string;
  method: string;
  target: string;
  rateLimit?: RateLimitRule;
  auth?: {
    required: boolean;
    roles?: string[];
    permissions?: string[];
  };
  middleware?: string[];
  timeout?: number;
}

class APIGateway {
  private routes: Map<string, RouteConfig> = new Map();
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Clean up expired rate limit entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.rateLimitStore.entries()) {
        if (now > data.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 60000);
  }

  // Register a route with the gateway
  registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
  }

  // Rate limiting middleware
  async checkRateLimit(request: FastifyRequest, reply: FastifyReply, rule: RateLimitRule): Promise<void> {
    const key = rule.keyGenerator 
      ? rule.keyGenerator(request)
      : `${request.ip}:${rule.endpoint}:${rule.method}`;
    
    const now = Date.now();
    const data = this.rateLimitStore.get(key);

    if (!data || now > data.resetTime) {
      // First request or window expired
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + rule.windowMs
      });
      
      reply.header('X-RateLimit-Limit', rule.maxRequests);
      reply.header('X-RateLimit-Remaining', rule.maxRequests - 1);
      reply.header('X-RateLimit-Reset', new Date(now + rule.windowMs).toISOString());
      return;
    }

    if (data.count >= rule.maxRequests) {
      reply.header('X-RateLimit-Limit', rule.maxRequests);
      reply.header('X-RateLimit-Remaining', 0);
      reply.header('X-RateLimit-Reset', new Date(data.resetTime).toISOString());
      throw new RateLimitError(`Rate limit exceeded. Try again after ${new Date(data.resetTime).toISOString()}`);
    }

    data.count++;
    this.rateLimitStore.set(key, data);
    
    reply.header('X-RateLimit-Limit', rule.maxRequests);
    reply.header('X-RateLimit-Remaining', rule.maxRequests - data.count);
    reply.header('X-RateLimit-Reset', new Date(data.resetTime).toISOString());
  }

  // Request routing and proxy
  async routeRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const key = `${request.method}:${request.url}`;
    const config = this.routes.get(key);

    if (!config) {
      reply.code(404).send({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Route ${request.method} ${request.url} not found`,
          requestId: request.id
        }
      });
      return;
    }

    // Apply rate limiting if configured
    if (config.rateLimit) {
      await this.checkRateLimit(request, reply, config.rateLimit);
    }

    // Handle timeout
    if (config.timeout) {
      // Set timeout header for client information
      reply.header('X-Gateway-Timeout', config.timeout);
    }

    // Route to target (in our case, internal handlers)
    // For now, we'll just mark that routing would happen here
    reply.header('X-Gateway-Route', config.target);
  }

  // Get rate limit stats
  getRateLimitStats(): any {
    const stats = {
      totalKeys: this.rateLimitStore.size,
      entries: Array.from(this.rateLimitStore.entries()).map(([key, data]) => ({
        key,
        count: data.count,
        resetTime: new Date(data.resetTime).toISOString(),
        remaining: Math.max(0, data.resetTime - Date.now())
      }))
    };
    return stats;
  }

  // Clear rate limit for a specific key
  clearRateLimit(key: string): boolean {
    return this.rateLimitStore.delete(key);
  }

  // Get all registered routes
  getRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  // Middleware function for Fastify integration
  rateLimitMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Apply rate limiting based on endpoint
      const path = request.url;
      
      // Check for matching rate limit rules
      for (const [, rule] of Object.entries(defaultRateLimits)) {
        if (this.matchesEndpoint(path, rule.endpoint)) {
          await this.checkRateLimit(request, reply, rule as RateLimitRule);
          break;
        }
      }
    };
  }

  private matchesEndpoint(path: string, pattern: string): boolean {
    // Simple wildcard matching for rate limiting
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }
    return path === pattern;
  }
}

// Default rate limit rules for different endpoint types
export const defaultRateLimits = {
  auth: {
    endpoint: '/api/v1/auth/*',
    method: '*',
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    endpoint: '/api/v1/*',
    method: '*',
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  uploads: {
    endpoint: '/api/v1/files/upload',
    method: 'POST',
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  ai: {
    endpoint: '/api/v1/ai/*',
    method: '*',
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
  }
};

export const apiGateway = new APIGateway();
export default APIGateway;
