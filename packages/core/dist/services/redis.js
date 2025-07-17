import Redis from 'ioredis';
import { logger } from '@matrix/shared';
import { MockRedis } from './mockRedis.js';
let redis;
export function createRedisClient(config) {
    const defaultConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
    };
    const finalConfig = { ...defaultConfig, ...config };
    const client = new Redis({
        host: finalConfig.host,
        port: finalConfig.port,
        password: finalConfig.password,
        db: finalConfig.db,
        maxRetriesPerRequest: finalConfig.maxRetriesPerRequest,
        enableReadyCheck: finalConfig.enableReadyCheck,
        lazyConnect: finalConfig.lazyConnect,
        autoResubscribe: false,
        autoResendUnfulfilledCommands: false,
    });
    // Simplified event handlers that don't cause loops
    client.on('ready', () => {
        logger.info('Redis connected and ready');
    });
    client.on('error', (error) => {
        logger.error('Redis error', { error });
    });
    return client;
}
export function getRedisClient() {
    if (!redis) {
        redis = createRedisClient();
    }
    return redis;
}
export async function connectRedis() {
    try {
        // Try to create a real Redis client first
        const client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: true,
            autoResubscribe: false,
            autoResendUnfulfilledCommands: false,
        });
        // Set a timeout for the connection attempt
        const connectTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Redis connection timeout')), 3000);
        });
        // Race between connection and timeout
        await Promise.race([
            client.connect(),
            connectTimeout
        ]);
        // Test the connection
        await client.ping();
        redis = client;
        logger.info('Redis connected successfully');
    }
    catch (error) {
        logger.warn('Redis unavailable, using mock Redis client');
        redis = new MockRedis();
    }
}
export async function disconnectRedis() {
    try {
        if (redis) {
            await redis.quit();
            logger.info('Redis disconnected');
        }
    }
    catch (error) {
        logger.error('Error disconnecting from Redis', { error });
        throw error;
    }
}
// Health check function
export async function checkRedisHealth() {
    try {
        const client = getRedisClient();
        const result = await client.ping();
        return result === 'PONG';
    }
    catch (error) {
        logger.error('Redis health check failed', { error });
        return false;
    }
}
// Cache helper functions
export class CacheService {
    client;
    constructor(client) {
        this.client = client || getRedisClient();
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger.error('Cache get error', { key, error });
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
            return true;
        }
        catch (error) {
            logger.error('Cache set error', { key, error });
            return false;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger.error('Cache delete error', { key, error });
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger.error('Cache exists error', { key, error });
            return false;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            logger.error('Cache TTL error', { key, error });
            return -1;
        }
    }
    async flushAll() {
        try {
            await this.client.flushall();
            return true;
        }
        catch (error) {
            logger.error('Cache flush error', { error });
            return false;
        }
    }
    // Pattern-based operations
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            logger.error('Cache keys error', { pattern, error });
            return [];
        }
    }
    async deletePattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                let deletedCount = 0;
                for (const key of keys) {
                    deletedCount += await this.client.del(key);
                }
                return deletedCount;
            }
            return 0;
        }
        catch (error) {
            logger.error('Cache delete pattern error', { pattern, error });
            return 0;
        }
    }
    // List operations
    async lpush(key, ...values) {
        try {
            const serialized = values.map(v => JSON.stringify(v));
            return await this.client.lpush(key, ...serialized);
        }
        catch (error) {
            logger.error('Cache lpush error', { key, error });
            return 0;
        }
    }
    async rpop(key) {
        try {
            const value = await this.client.rpop(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger.error('Cache rpop error', { key, error });
            return null;
        }
    }
    // Set operations
    async sadd(key, ...members) {
        try {
            const serialized = members.map(m => JSON.stringify(m));
            return await this.client.sadd(key, ...serialized);
        }
        catch (error) {
            logger.error('Cache sadd error', { key, error });
            return 0;
        }
    }
    async smembers(key) {
        try {
            const members = await this.client.smembers(key);
            return members.map(m => JSON.parse(m));
        }
        catch (error) {
            logger.error('Cache smembers error', { key, error });
            return [];
        }
    }
}
// Export Redis instance and cache service
export const cache = new CacheService();
//# sourceMappingURL=redis.js.map