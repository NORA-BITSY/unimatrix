import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '@matrix/shared';

export interface RateLimitConfig {
  max: number;
  timeWindow: number; // in milliseconds
  keyGenerator?: (request: FastifyRequest) => string;
  skipOnError?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  enableDraftSpec?: boolean;
}

export const defaultRateLimitConfig: RateLimitConfig = {
  max: 100,
  timeWindow: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (request) => request.ip,
  skipOnError: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  enableDraftSpec: true
};

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  // General API rate limit
  api: {
    max: 1000,
    timeWindow: 15 * 60 * 1000, // 15 minutes
  },

  // Authentication endpoints
  auth: {
    max: 5,
    timeWindow: 15 * 60 * 1000, // 15 minutes
  },

  // AI endpoints (more restrictive)
  ai: {
    max: 50,
    timeWindow: 60 * 1000, // 1 minute
  },

  // Blockchain endpoints
  blockchain: {
    max: 100,
    timeWindow: 60 * 1000, // 1 minute
  },

  // IoT endpoints
  iot: {
    max: 200,
    timeWindow: 60 * 1000, // 1 minute
  },

  // File upload endpoints
  upload: {
    max: 10,
    timeWindow: 15 * 60 * 1000, // 15 minutes
  },

  // Admin endpoints
  admin: {
    max: 20,
    timeWindow: 60 * 1000, // 1 minute
  }
};

// Custom key generators
export const keyGenerators = {
  // Rate limit by IP
  byIP: (request: FastifyRequest): string => {
    return request.ip;
  },

  // Rate limit by user ID (requires authentication)
  byUser: (request: FastifyRequest): string => {
    return (request.user as any)?.id || request.ip;
  },

  // Rate limit by API key
  byApiKey: (request: FastifyRequest): string => {
    const apiKey = request.headers['x-api-key'] as string;
    return apiKey || request.ip;
  },

  // Rate limit by combination of user and IP
  byUserAndIP: (request: FastifyRequest): string => {
    const userId = (request.user as any)?.id;
    return userId ? `${userId}:${request.ip}` : request.ip;
  }
};

// Rate limit middleware factory
export function createRateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultRateLimitConfig, ...config };
  
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      // This would typically integrate with Redis or in-memory store
      // For now, we'll log the rate limit check
      const key = finalConfig.keyGenerator!(request);
      
      logger.debug('Rate limit check', {
        key,
        endpoint: request.url,
        method: request.method,
        config: finalConfig
      });

      // In a real implementation, you would:
      // 1. Check current count for the key
      // 2. Increment count
      // 3. Set expiry if first request
      // 4. Return 429 if limit exceeded
      
    } catch (error) {
      logger.error('Rate limit middleware error', { error });
      
      if (!finalConfig.skipOnError) {
        throw error;
      }
    }
  };
}

// Pre-configured middleware functions
export const rateLimitMiddleware = {
  api: createRateLimitMiddleware(rateLimitConfigs.api),
  auth: createRateLimitMiddleware({
    ...rateLimitConfigs.auth,
    keyGenerator: keyGenerators.byIP
  }),
  ai: createRateLimitMiddleware({
    ...rateLimitConfigs.ai,
    keyGenerator: keyGenerators.byUser
  }),
  blockchain: createRateLimitMiddleware({
    ...rateLimitConfigs.blockchain,
    keyGenerator: keyGenerators.byUser
  }),
  iot: createRateLimitMiddleware({
    ...rateLimitConfigs.iot,
    keyGenerator: keyGenerators.byUser
  }),
  upload: createRateLimitMiddleware({
    ...rateLimitConfigs.upload,
    keyGenerator: keyGenerators.byUserAndIP
  }),
  admin: createRateLimitMiddleware({
    ...rateLimitConfigs.admin,
    keyGenerator: keyGenerators.byUser
  })
};
