import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../services/database.js';
import { CacheService } from '../services/redis.js';
import { ValidationError, AuthenticationError } from '@matrix/shared';
import { authMiddleware } from '../middleware/auth.js';
// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    username: z.string().optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
const refreshTokenSchema = z.object({
    refreshToken: z.string(),
});
export async function authRoutes(fastify) {
    const cache = new CacheService();
    // Register endpoint
    fastify.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    username: { type: 'string' },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        firstName: { type: 'string' },
                                        lastName: { type: 'string' },
                                        username: { type: 'string' },
                                        role: { type: 'string' },
                                    },
                                },
                                tokens: {
                                    type: 'object',
                                    properties: {
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const validatedData = registerSchema.parse(request.body);
            // Check if user already exists
            const existingUser = await db.user.findUnique({
                where: { email: validatedData.email },
            });
            if (existingUser) {
                throw new ValidationError('User with this email already exists');
            }
            // Check username if provided
            if (validatedData.username) {
                const existingUsername = await db.user.findUnique({
                    where: { username: validatedData.username },
                });
                if (existingUsername) {
                    throw new ValidationError('Username already taken');
                }
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(validatedData.password, 12);
            // Create user
            const user = await db.user.create({
                data: {
                    email: validatedData.email,
                    password: hashedPassword,
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    username: validatedData.username,
                    role: 'USER',
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    role: true,
                },
            });
            // Generate tokens
            const accessToken = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                permissions: [], // TODO: Implement permissions
            }, { expiresIn: '15m' });
            const refreshToken = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                permissions: [],
                type: 'refresh',
            }, { expiresIn: '7d' });
            // Store refresh token in cache
            await cache.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days
            await reply.status(201).send({
                success: true,
                data: {
                    user,
                    tokens: {
                        accessToken,
                        refreshToken,
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Invalid request data');
            }
            throw error;
        }
    });
    // Login endpoint
    fastify.post('/login', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        firstName: { type: 'string' },
                                        lastName: { type: 'string' },
                                        username: { type: 'string' },
                                        role: { type: 'string' },
                                    },
                                },
                                tokens: {
                                    type: 'object',
                                    properties: {
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const validatedData = loginSchema.parse(request.body);
            // Find user
            const user = await db.user.findUnique({
                where: { email: validatedData.email },
            });
            if (!user || !user.isActive) {
                throw new AuthenticationError('Invalid credentials');
            }
            // Verify password
            const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
            if (!isPasswordValid) {
                throw new AuthenticationError('Invalid credentials');
            }
            // Update last login
            await db.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
            // Generate tokens
            const accessToken = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                permissions: [], // TODO: Implement permissions
            }, { expiresIn: '15m' });
            const refreshToken = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                permissions: [],
                type: 'refresh',
            }, { expiresIn: '7d' });
            // Store refresh token in cache
            await cache.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days
            await reply.send({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                        role: user.role,
                    },
                    tokens: {
                        accessToken,
                        refreshToken,
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Invalid request data');
            }
            throw error;
        }
    });
    // Refresh token endpoint
    fastify.post('/refresh', {
        schema: {
            body: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                    refreshToken: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const validatedData = refreshTokenSchema.parse(request.body);
            // Verify refresh token
            const decoded = fastify.jwt.verify(validatedData.refreshToken);
            if (decoded.type !== 'refresh') {
                throw new AuthenticationError('Invalid refresh token');
            }
            // Check if token exists in cache
            const cachedToken = await cache.get(`refresh_token:${decoded.id}`);
            if (cachedToken !== validatedData.refreshToken) {
                throw new AuthenticationError('Invalid or expired refresh token');
            }
            // Get user
            const user = await db.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    role: true,
                    isActive: true,
                },
            });
            if (!user || !user.isActive) {
                throw new AuthenticationError('User not found or inactive');
            }
            // Generate new access token
            const accessToken = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                permissions: [], // TODO: Implement permissions
            }, { expiresIn: '15m' });
            await reply.send({
                success: true,
                data: {
                    accessToken,
                },
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Invalid request data');
            }
            throw error;
        }
    });
    // Helper function for authentication
    const requireAuth = async (request, reply) => {
        await authMiddleware(request, reply);
    };
    // Logout endpoint
    fastify.post('/logout', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        try {
            const userId = request.user?.id;
            if (userId) {
                // Remove refresh token from cache
                await cache.del(`refresh_token:${userId}`);
            }
            await reply.send({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            throw error;
        }
    });
    // Get current user profile
    fastify.get('/profile', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                throw new AuthenticationError('User not authenticated');
            }
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    role: true,
                    createdAt: true,
                    lastLogin: true,
                    profile: true,
                },
            });
            if (!user) {
                throw new AuthenticationError('User not found');
            }
            await reply.send({
                success: true,
                data: { user },
            });
        }
        catch (error) {
            throw error;
        }
    });
}
//# sourceMappingURL=auth.js.map