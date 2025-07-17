import { performance } from 'perf_hooks';

/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  /**
   * Start timing an operation
   */
  static start(operation: string): void {
    this.measurements.set(operation, performance.now());
  }

  /**
   * End timing an operation and return duration
   */
  static end(operation: string): number {
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
  static async measure<T>(
    _operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      return { result, duration };
    } catch (error) {
      // Duration measured but not returned in error case
      performance.now() - startTime;
      throw error;
    }
  }

  /**
   * Measure synchronous function execution
   */
  static measureSync<T>(
    _operation: string,
    fn: () => T
  ): { result: T; duration: number } {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      return { result, duration };
    } catch (error) {
      // Duration measured but not returned in error case
      performance.now() - startTime;
      throw error;
    }
  }

  /**
   * Get memory usage statistics
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get formatted memory usage
   */
  static getFormattedMemoryUsage(): {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    arrayBuffers: string;
  } {
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
  private static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Create a performance profiler for a specific context
   */
  static createProfiler(context: string) {
    return new PerformanceProfiler(context);
  }
}

/**
 * Performance profiler for detailed timing analysis
 */
export class PerformanceProfiler {
  private context: string;
  private timings = new Map<string, number[]>();
  private active = new Map<string, number>();

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Start timing a specific operation
   */
  start(operation: string): void {
    this.active.set(operation, performance.now());
  }

  /**
   * End timing and record the duration
   */
  end(operation: string): number {
    const startTime = this.active.get(operation);
    if (!startTime) {
      throw new Error(`No active timing for operation: ${operation}`);
    }

    const duration = performance.now() - startTime;
    this.active.delete(operation);

    if (!this.timings.has(operation)) {
      this.timings.set(operation, []);
    }
    this.timings.get(operation)!.push(duration);

    return duration;
  }

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
  }> {
    const stats: Record<string, any> = {};

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
  clear(): void {
    this.timings.clear();
    this.active.clear();
  }

  /**
   * Export performance data
   */
  export(): {
    context: string;
    timestamp: string;
    stats: Record<string, any>;
    memoryUsage: NodeJS.MemoryUsage;
  } {
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
  private failures = 0;
  private lastFailure: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): {
    state: string;
    failures: number;
    lastFailure: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.failures = 0;
    this.lastFailure = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private limit: number = 100,
    private windowMs: number = 60000
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
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
  getRemaining(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.limit - validRequests.length);
  }

  /**
   * Get reset time for rate limit
   */
  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }
}

/**
 * Caching utility with TTL support
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expires: number }>();

  /**
   * Set a value in cache with TTL
   */
  set(key: string, value: T, ttlMs: number = 300000): void {
    const expires = Date.now() + ttlMs;
    this.cache.set(key, { value, expires });
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
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
  getStats(): {
    size: number;
    expired: number;
    hitRate: number;
  } {
    let expired = 0;
    const now = Date.now();
    
    for (const item of this.cache.values()) {
      if (now > item.expires) expired++;
    }

    return {
      size: this.cache.size,
      expired,
      hitRate: this.cache.size > 0 ? (this.cache.size - expired) / this.cache.size : 0,
    };
  }
}
