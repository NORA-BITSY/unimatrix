import { FastifyRequest, FastifyReply } from 'fastify';
export interface RateLimitConfig {
    max: number;
    timeWindow: number;
    keyGenerator?: (request: FastifyRequest) => string;
    skipOnError?: boolean;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    enableDraftSpec?: boolean;
}
export declare const defaultRateLimitConfig: RateLimitConfig;
export declare const rateLimitConfigs: {
    api: {
        max: number;
        timeWindow: number;
    };
    auth: {
        max: number;
        timeWindow: number;
    };
    ai: {
        max: number;
        timeWindow: number;
    };
    blockchain: {
        max: number;
        timeWindow: number;
    };
    iot: {
        max: number;
        timeWindow: number;
    };
    upload: {
        max: number;
        timeWindow: number;
    };
    admin: {
        max: number;
        timeWindow: number;
    };
};
export declare const keyGenerators: {
    byIP: (request: FastifyRequest) => string;
    byUser: (request: FastifyRequest) => string;
    byApiKey: (request: FastifyRequest) => string;
    byUserAndIP: (request: FastifyRequest) => string;
};
export declare function createRateLimitMiddleware(config?: Partial<RateLimitConfig>): (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
export declare const rateLimitMiddleware: {
    api: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
    auth: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
    ai: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
    blockchain: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
    iot: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
    upload: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
    admin: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
};
//# sourceMappingURL=rateLimit.d.ts.map