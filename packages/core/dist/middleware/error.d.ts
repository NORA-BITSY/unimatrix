import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
export interface ErrorResponse {
    success: false;
    error: {
        type: string;
        message: string;
        code?: string;
        details?: any;
        requestId?: string;
    };
}
export declare function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function notFoundHandler(request: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=error.d.ts.map