import { FastifyRequest, FastifyReply } from 'fastify';
export interface JWTUser {
    id: string;
    email: string;
    role: string;
    permissions: string[];
}
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JWTUser;
        user: JWTUser;
    }
}
export interface AuthMiddlewareOptions {
    required?: boolean;
    roles?: string[];
    permissions?: string[];
}
export declare function authMiddleware(request: FastifyRequest, _reply: FastifyReply, options?: AuthMiddlewareOptions): Promise<void>;
export declare function requireRole(...roles: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function requirePermission(...permissions: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function optionalAuth(request: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=auth.d.ts.map