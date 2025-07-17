import { FastifyRequest, FastifyReply } from 'fastify';
import * as os from 'os';

interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  type: 'request' | 'error' | 'performance' | 'user_action';
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

interface RequestMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  timestamp: Date;
  size: {
    request: number;
    response: number;
  };
}

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    heap: {
      used: number;
      total: number;
    };
  };
  requests: {
    total: number;
    perSecond: number;
    errors: number;
    avgResponseTime: number;
  };
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private maxEvents = 10000; // Limit in-memory storage
  private maxMetrics = 5000;

  // Track an analytics event
  trackEvent(type: AnalyticsEvent['type'], data: Record<string, any>, userId?: string, sessionId?: string): void {
    const event: AnalyticsEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      type,
      data,
      userId,
      sessionId
    };

    this.events.push(event);
    this.cleanupEvents();
  }

  // Track request metrics
  trackRequest(metrics: Omit<RequestMetrics, 'timestamp'>): void {
    const requestMetric: RequestMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.requestMetrics.push(requestMetric);
    this.cleanupMetrics();
  }

  // Track system metrics
  trackSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Calculate request stats for the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentRequests = this.requestMetrics.filter(m => m.timestamp > oneMinuteAgo);
    
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: cpus.length > 0 ? cpus[0].times.user / (cpus[0].times.user + cpus[0].times.idle) : 0,
        loadAverage: loadAvg
      },
      memory: {
        used: memUsage.rss,
        total: os.totalmem(),
        heap: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal
        }
      },
      requests: {
        total: this.requestMetrics.length,
        perSecond: recentRequests.length / 60,
        errors: recentRequests.filter(r => r.statusCode >= 400).length,
        avgResponseTime: recentRequests.length > 0 
          ? recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length 
          : 0
      }
    };

    this.systemMetrics.push(metrics);
    this.cleanupSystemMetrics();
  }

  // Get analytics dashboard data
  getDashboardData(timeRange: { start: Date; end: Date }) {
    const filteredRequests = this.requestMetrics.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    const filteredEvents = this.events.filter(
      e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
    );

    // Group by endpoint
    const endpointStats = filteredRequests.reduce((acc, req) => {
      const key = `${req.method} ${req.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          endpoint: req.endpoint,
          method: req.method,
          totalRequests: 0,
          errors: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        };
      }
      
      acc[key].totalRequests++;
      acc[key].totalResponseTime += req.responseTime;
      acc[key].avgResponseTime = acc[key].totalResponseTime / acc[key].totalRequests;
      
      if (req.statusCode >= 400) {
        acc[key].errors++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Group by hour
    const hourlyStats = filteredRequests.reduce((acc, req) => {
      const hour = new Date(req.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      if (!acc[hour]) {
        acc[hour] = {
          timestamp: hour,
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        };
      }
      
      acc[hour].requests++;
      acc[hour].totalResponseTime += req.responseTime;
      acc[hour].avgResponseTime = acc[hour].totalResponseTime / acc[hour].requests;
      
      if (req.statusCode >= 400) {
        acc[hour].errors++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Status code distribution
    const statusCodeStats = filteredRequests.reduce((acc, req) => {
      const code = req.statusCode.toString();
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top users by request count
    const userStats = filteredRequests
      .filter(r => r.userId)
      .reduce((acc, req) => {
        const userId = req.userId!;
        acc[userId] = (acc[userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      summary: {
        totalRequests: filteredRequests.length,
        totalErrors: filteredRequests.filter(r => r.statusCode >= 400).length,
        avgResponseTime: filteredRequests.length > 0 
          ? filteredRequests.reduce((sum, r) => sum + r.responseTime, 0) / filteredRequests.length 
          : 0,
        totalEvents: filteredEvents.length,
        uniqueUsers: Object.keys(userStats).length
      },
      endpoints: Object.values(endpointStats),
      timeline: Object.values(hourlyStats).sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      statusCodes: statusCodeStats,
      topUsers: Object.entries(userStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, requests: count })),
      events: filteredEvents.slice(-100) // Last 100 events
    };
  }

  // Get real-time metrics
  getRealTimeMetrics() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentRequests = this.requestMetrics.filter(m => m.timestamp > fiveMinutesAgo);
    const latestSystemMetric = this.systemMetrics[this.systemMetrics.length - 1];

    return {
      timestamp: now,
      requests: {
        lastFiveMinutes: recentRequests.length,
        currentRps: recentRequests.length / 300, // requests per second
        errorRate: recentRequests.length > 0 
          ? recentRequests.filter(r => r.statusCode >= 400).length / recentRequests.length 
          : 0,
        avgResponseTime: recentRequests.length > 0 
          ? recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length 
          : 0
      },
      system: latestSystemMetric || null,
      alerts: this.generateAlerts(recentRequests, latestSystemMetric)
    };
  }

  // Generate alerts based on metrics
  private generateAlerts(recentRequests: RequestMetrics[], systemMetrics?: SystemMetrics) {
    const alerts = [];

    // High error rate alert
    if (recentRequests.length > 10) {
      const errorRate = recentRequests.filter(r => r.statusCode >= 400).length / recentRequests.length;
      if (errorRate > 0.1) { // 10% error rate
        alerts.push({
          type: 'error_rate',
          severity: 'warning',
          message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          value: errorRate
        });
      }
    }

    // High response time alert
    if (recentRequests.length > 0) {
      const avgResponseTime = recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length;
      if (avgResponseTime > 1000) { // 1 second
        alerts.push({
          type: 'response_time',
          severity: 'warning',
          message: `High average response time: ${avgResponseTime.toFixed(0)}ms`,
          value: avgResponseTime
        });
      }
    }

    // High memory usage alert
    if (systemMetrics) {
      const memoryUsage = systemMetrics.memory.used / systemMetrics.memory.total;
      if (memoryUsage > 0.8) { // 80% memory usage
        alerts.push({
          type: 'memory_usage',
          severity: 'critical',
          message: `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`,
          value: memoryUsage
        });
      }
    }

    return alerts;
  }

  // Cleanup old events
  private cleanupEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  // Cleanup old metrics
  private cleanupMetrics(): void {
    if (this.requestMetrics.length > this.maxMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetrics);
    }
  }

  // Cleanup old system metrics
  private cleanupSystemMetrics(): void {
    // Keep only last 24 hours of system metrics (assuming one every minute)
    const maxSystemMetrics = 24 * 60;
    if (this.systemMetrics.length > maxSystemMetrics) {
      this.systemMetrics = this.systemMetrics.slice(-maxSystemMetrics);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Middleware to track request metrics
export function analyticsMiddleware(_analyticsService: AnalyticsService) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const startTime = Date.now();
    const requestSize = JSON.stringify(request.body || {}).length + 
                       JSON.stringify(request.query || {}).length + 
                       JSON.stringify(request.params || {}).length;

    // Store start time for later use
    (request as any).startTime = startTime;
    (request as any).requestSize = requestSize;
  };
}

// Hook to capture response metrics (to be used in route registration)
export function captureResponseMetrics(analyticsService: AnalyticsService) {
  return async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
    const startTime = (request as any).startTime || Date.now();
    const requestSize = (request as any).requestSize || 0;
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const responseSize = typeof payload === 'string' ? payload.length : JSON.stringify(payload).length;

    const user = (request as any).user;
    
    analyticsService.trackRequest({
      endpoint: request.url,
      method: request.method,
      statusCode: reply.statusCode,
      responseTime,
      userId: user?.id,
      size: {
        request: requestSize,
        response: responseSize
      }
    });

    return payload;
  };
}

export const analyticsService = new AnalyticsService();

// Start collecting system metrics every minute
setInterval(() => {
  analyticsService.trackSystemMetrics();
}, 60000);

export default AnalyticsService;
