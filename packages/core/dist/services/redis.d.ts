import Redis from 'ioredis';
import { MockRedis } from './mockRedis.js';
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
}
export declare function createRedisClient(config?: Partial<RedisConfig>): Redis;
export declare function getRedisClient(): Redis | MockRedis;
export declare function connectRedis(): Promise<void>;
export declare function disconnectRedis(): Promise<void>;
export declare function checkRedisHealth(): Promise<boolean>;
export declare class CacheService {
    private client;
    constructor(client?: Redis | MockRedis);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    flushAll(): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    deletePattern(pattern: string): Promise<number>;
    lpush(key: string, ...values: any[]): Promise<number>;
    rpop<T>(key: string): Promise<T | null>;
    sadd(key: string, ...members: any[]): Promise<number>;
    smembers<T>(key: string): Promise<T[]>;
}
export declare const cache: CacheService;
//# sourceMappingURL=redis.d.ts.map