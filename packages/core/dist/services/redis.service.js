import { logger } from '@matrix/shared';
import { connectRedis, disconnectRedis, checkRedisHealth } from './redis.js';
export class RedisService {
    static isInitialized = false;
    static async initialize() {
        if (this.isInitialized) {
            logger.warn('Redis service already initialized');
            return;
        }
        try {
            await connectRedis();
            this.isInitialized = true;
            logger.info('Redis service initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize Redis service', { error });
            throw error;
        }
    }
    static async disconnect() {
        if (!this.isInitialized) {
            return;
        }
        try {
            await disconnectRedis();
            this.isInitialized = false;
            logger.info('Redis service disconnected');
        }
        catch (error) {
            logger.error('Error disconnecting Redis service', { error });
            throw error;
        }
    }
    static async healthCheck() {
        return checkRedisHealth();
    }
    static get initialized() {
        return this.isInitialized;
    }
}
//# sourceMappingURL=redis.service.js.map