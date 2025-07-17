/**
 * Performance monitoring and optimization utilities
 */
export declare class PerformanceMonitor {
    private static measurements;
    /**
     * Start timing an operation
     */
    static start(operation: string): void;
    /**
     * End timing an operation and return duration
     */
    static end(operation: string): number;
    /**
     * Measure execution time of a function
     */
    static measure<T>(_operation: string, fn: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
    /**
     * Measure synchronous function execution
     */
    static measureSync<T>(_operation: string, fn: () => T): {
        result: T;
        duration: number;
    };
    /**
     * Get memory usage statistics
     */
    static getMemoryUsage(): NodeJS.MemoryUsage;
    /**
     * Get formatted memory usage
     */
    static getFormattedMemoryUsage(): {
        rss: string;
        heapTotal: string;
        heapUsed: string;
        external: string;
        arrayBuffers: string;
    };
    /**
     * Format bytes to human readable format
     */
    private static formatBytes;
    /**
     * Create a performance profiler for a specific context
     */
    static createProfiler(context: string): PerformanceProfiler;
}
/**
 * Performance profiler for detailed timing analysis
 */
export declare class PerformanceProfiler {
    private context;
    private timings;
    private active;
    constructor(context: string);
    /**
     * Start timing a specific operation
     */
    start(operation: string): void;
    /**
     * End timing and record the duration
     */
    end(operation: string): number;
    /**
     * Get statistics for all recorded operations
     */
    getStats(): Record<string, {
        count: number;
        total: number;
        average: number;
        min: number;
        max: number;
        median: number;
    }>;
    /**
     * Clear all recorded timings
     */
    clear(): void;
    /**
     * Export performance data
     */
    export(): {
        context: string;
        timestamp: string;
        stats: Record<string, any>;
        memoryUsage: NodeJS.MemoryUsage;
    };
}
/**
 * Circuit breaker for handling failing operations
 */
export declare class CircuitBreaker {
    private threshold;
    private timeout;
    private failures;
    private lastFailure;
    private state;
    constructor(threshold?: number, timeout?: number);
    /**
     * Execute an operation with circuit breaker protection
     */
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    /**
     * Get current circuit breaker status
     */
    getStatus(): {
        state: string;
        failures: number;
        lastFailure: number;
    };
    /**
     * Reset circuit breaker
     */
    reset(): void;
}
/**
 * Rate limiter implementation
 */
export declare class RateLimiter {
    private limit;
    private windowMs;
    private requests;
    constructor(limit?: number, windowMs?: number);
    /**
     * Check if request is allowed
     */
    isAllowed(identifier: string): boolean;
    /**
     * Get remaining requests for identifier
     */
    getRemaining(identifier: string): number;
    /**
     * Get reset time for rate limit
     */
    getResetTime(identifier: string): number;
    /**
     * Clear all rate limit data
     */
    clear(): void;
}
/**
 * Caching utility with TTL support
 */
export declare class MemoryCache<T = any> {
    private cache;
    /**
     * Set a value in cache with TTL
     */
    set(key: string, value: T, ttlMs?: number): void;
    /**
     * Get a value from cache
     */
    get(key: string): T | undefined;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete a key from cache
     */
    delete(key: string): boolean;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Clean up expired entries
     */
    cleanup(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        expired: number;
        hitRate: number;
    };
}
//# sourceMappingURL=performance.d.ts.map