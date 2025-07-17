import { logger } from '@matrix/shared';
import { connectRedis, disconnectRedis, checkRedisHealth } from './redis.js';

export class RedisService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Redis service already initialized');
      return;
    }

    try {
      await connectRedis();
      this.isInitialized = true;
      logger.info('Redis service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis service', { error });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await disconnectRedis();
      this.isInitialized = false;
      logger.info('Redis service disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis service', { error });
      throw error;
    }
  }

  static async healthCheck(): Promise<boolean> {
    return checkRedisHealth();
  }

  static get initialized(): boolean {
    return this.isInitialized;
  }
}
