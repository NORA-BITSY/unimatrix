import { performance } from 'perf_hooks';
/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceMonitor {
    static measurements = new Map();
    /**
     * Start timing an operation
     */
    static start(operation) {
        this.measurements.set(operation, performance.now());
    }
    /**
     * End timing an operation and return duration
     */
    static end(operation) {
        const startTime = this.measurements.get(operation);
        if (!startTime) {
            throw new Error(`No measurement started for operation: ${operation}`);
        }
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.measurements.delete(operation);
        return duration;
    }
    /**
     * Measure execution time of a function
     */
    static async measure(_operation, fn) {
        const startTime = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            return { result, duration };
        }
        catch (error) {
            // Duration measured but not returned in error case
            performance.now() - startTime;
            throw error;
        }
    }
    /**
     * Measure synchronous function execution
     */
    static measureSync(_operation, fn) {
        const startTime = performance.now();
        try {
            const result = fn();
            const duration = performance.now() - startTime;
            return { result, duration };
        }
        catch (error) {
            // Duration measured but not returned in error case
            performance.now() - startTime;
            throw error;
        }
    }
    /**
     * Get memory usage statistics
     */
    static getMemoryUsage() {
        return process.memoryUsage();
    }
    /**
     * Get formatted memory usage
     */
    static getFormattedMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: this.formatBytes(usage.rss),
            heapTotal: this.formatBytes(usage.heapTotal),
            heapUsed: this.formatBytes(usage.heapUsed),
            external: this.formatBytes(usage.external),
            arrayBuffers: this.formatBytes(usage.arrayBuffers),
        };
    }
    /**
     * Format bytes to human readable format
     */
    static formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    }
    /**
     * Create a performance profiler for a specific context
     */
    static createProfiler(context) {
        return new PerformanceProfiler(context);
    }
}
/**
 * Performance profiler for detailed timing analysis
 */
export class PerformanceProfiler {
    context;
    timings = new Map();
    active = new Map();
    constructor(context) {
        this.context = context;
    }
    /**
     * Start timing a specific operation
     */
    start(operation) {
        this.active.set(operation, performance.now());
    }
    /**
     * End timing and record the duration
     */
    end(operation) {
        const startTime = this.active.get(operation);
        if (!startTime) {
            throw new Error(`No active timing for operation: ${operation}`);
        }
        const duration = performance.now() - startTime;
        this.active.delete(operation);
        if (!this.timings.has(operation)) {
            this.timings.set(operation, []);
        }
        this.timings.get(operation).push(duration);
        return duration;
    }
    /**
     * Get statistics for all recorded operations
     */
    getStats() {
        const stats = {};
        for (const [operation, durations] of this.timings) {
            const sorted = [...durations].sort((a, b) => a - b);
            const total = durations.reduce((sum, d) => sum + d, 0);
            stats[operation] = {
                count: durations.length,
                total: Math.round(total * 100) / 100,
                average: Math.round((total / durations.length) * 100) / 100,
                min: Math.round(sorted[0] * 100) / 100,
                max: Math.round(sorted[sorted.length - 1] * 100) / 100,
                median: Math.round(sorted[Math.floor(sorted.length / 2)] * 100) / 100,
            };
        }
        return stats;
    }
    /**
     * Clear all recorded timings
     */
    clear() {
        this.timings.clear();
        this.active.clear();
    }
    /**
     * Export performance data
     */
    export() {
        return {
            context: this.context,
            timestamp: new Date().toISOString(),
            stats: this.getStats(),
            memoryUsage: PerformanceMonitor.getMemoryUsage(),
        };
    }
}
/**
 * Circuit breaker for handling failing operations
 */
export class CircuitBreaker {
    threshold;
    timeout;
    failures = 0;
    lastFailure = 0;
    state = 'CLOSED';
    constructor(threshold = 5, timeout = 60000) {
        this.threshold = threshold;
        this.timeout = timeout;
    }
    /**
     * Execute an operation with circuit breaker protection
     */
    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailure > this.timeout) {
                this.state = 'HALF_OPEN';
            }
            else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.failures++;
        this.lastFailure = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
        }
    }
    /**
     * Get current circuit breaker status
     */
    getStatus() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailure,
        };
    }
    /**
     * Reset circuit breaker
     */
    reset() {
        this.failures = 0;
        this.lastFailure = 0;
        this.state = 'CLOSED';
    }
}
/**
 * Rate limiter implementation
 */
export class RateLimiter {
    limit;
    windowMs;
    requests = new Map();
    constructor(limit = 100, windowMs = 60000) {
        this.limit = limit;
        this.windowMs = windowMs;
    }
    /**
     * Check if request is allowed
     */
    isAllowed(identifier) {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];
        // Remove expired requests
        const validRequests = requests.filter(time => now - time < this.windowMs);
        if (validRequests.length >= this.limit) {
            return false;
        }
        // Add current request
        validRequests.push(now);
        this.requests.set(identifier, validRequests);
        return true;
    }
    /**
     * Get remaining requests for identifier
     */
    getRemaining(identifier) {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];
        const validRequests = requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.limit - validRequests.length);
    }
    /**
     * Get reset time for rate limit
     */
    getResetTime(identifier) {
        const requests = this.requests.get(identifier) || [];
        if (requests.length === 0)
            return 0;
        const oldestRequest = Math.min(...requests);
        return oldestRequest + this.windowMs;
    }
    /**
     * Clear all rate limit data
     */
    clear() {
        this.requests.clear();
    }
}
/**
 * Caching utility with TTL support
 */
export class MemoryCache {
    cache = new Map();
    /**
     * Set a value in cache with TTL
     */
    set(key, value, ttlMs = 300000) {
        const expires = Date.now() + ttlMs;
        this.cache.set(key, { value, expires });
    }
    /**
     * Get a value from cache
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return undefined;
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return undefined;
        }
        return item.value;
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        const item = this.cache.get(key);
        if (!item)
            return false;
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete a key from cache
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        let expired = 0;
        const now = Date.now();
        for (const item of this.cache.values()) {
            if (now > item.expires)
                expired++;
        }
        return {
            size: this.cache.size,
            expired,
            hitRate: this.cache.size > 0 ? (this.cache.size - expired) / this.cache.size : 0,
        };
    }
}
//# sourceMappingURL=performance.js.map