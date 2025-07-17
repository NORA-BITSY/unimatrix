import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError, AuthorizationError } from '@matrix/shared';

// User type for JWT payload
export interface JWTUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

// Extend FastifyRequest for user (no JWT extension here)
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

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
  options: AuthMiddlewareOptions = {}
): Promise<void> {
  const { required = true, roles = [], permissions = [] } = options;
  
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      if (required) {
        throw new AuthenticationError('Authorization header is required');
      }
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      if (required) {
        throw new AuthenticationError('Bearer token is required');
      }
      return;
    }

    // Verify JWT token using jwtVerify
    const decoded = await request.jwtVerify() as JWTUser;

    // Check role-based access
    if (roles.length > 0 && !roles.includes(decoded.role)) {
      throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
    }

    // Check permission-based access
    if (permissions.length > 0) {
      const hasPermission = permissions.some(permission => 
        decoded.permissions?.includes(permission)
      );
      
      if (!hasPermission) {
        throw new AuthorizationError(`Access denied. Required permissions: ${permissions.join(', ')}`);
      }
    }

  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      throw error;
    }
    
    if (required) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}

// Helper function to create role-based middleware
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authMiddleware(request, reply, { roles });
  };
}

// Helper function to create permission-based middleware
export function requirePermission(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authMiddleware(request, reply, { permissions });
  };
}

// Optional auth middleware (doesn't throw if no token)
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply, { required: false });
}
