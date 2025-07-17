import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
export class WebSocketService {
    fastify;
    connections = new Map();
    rooms = new Map(); // room -> set of user IDs
    userRooms = new Map(); // user -> set of rooms
    constructor(fastify) {
        this.fastify = fastify;
    }
    async authenticateSocket(ws, token) {
        try {
            const secret = process.env.JWT_SECRET || 'your-very-long-32-character-secret-key-for-development-only-change-this-in-production';
            const decoded = jwt.verify(token, secret);
            ws.userId = decoded.id;
            ws.email = decoded.email;
            ws.role = decoded.role;
            ws.isAlive = true;
            this.connections.set(decoded.id, ws);
            this.fastify.log.info(`WebSocket authenticated for user: ${decoded.email}`);
            return true;
        }
        catch (error) {
            this.fastify.log.error('WebSocket authentication failed:', error);
            return false;
        }
    }
    joinRoom(userId, room) {
        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }
        if (!this.userRooms.has(userId)) {
            this.userRooms.set(userId, new Set());
        }
        this.rooms.get(room).add(userId);
        this.userRooms.get(userId).add(room);
        this.fastify.log.info(`User ${userId} joined room: ${room}`);
        // Notify room members
        this.broadcastToRoom(room, {
            type: 'user_joined',
            payload: { userId, room },
            timestamp: Date.now(),
        }, userId);
    }
    leaveRoom(userId, room) {
        this.rooms.get(room)?.delete(userId);
        this.userRooms.get(userId)?.delete(room);
        this.fastify.log.info(`User ${userId} left room: ${room}`);
        // Notify room members
        this.broadcastToRoom(room, {
            type: 'user_left',
            payload: { userId, room },
            timestamp: Date.now(),
        }, userId);
    }
    broadcastToRoom(room, message, excludeUserId) {
        const roomUsers = this.rooms.get(room);
        if (!roomUsers)
            return;
        for (const userId of roomUsers) {
            if (excludeUserId && userId === excludeUserId)
                continue;
            const ws = this.connections.get(userId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }
    sendToUser(userId, message) {
        const ws = this.connections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }
    handleMessage(ws, rawMessage) {
        try {
            const message = JSON.parse(rawMessage);
            switch (message.type) {
                case 'chat_message':
                    this.handleChatMessage(ws, message);
                    break;
                case 'join_room':
                    this.handleJoinRoom(ws, message);
                    break;
                case 'leave_room':
                    this.handleLeaveRoom(ws, message);
                    break;
                default:
                    this.sendError(ws, 'Unknown message type', message.type);
            }
        }
        catch (error) {
            this.fastify.log.error('Error handling WebSocket message:', error);
            this.sendError(ws, 'Invalid message format');
        }
    }
    async handleChatMessage(ws, message) {
        if (!ws.userId) {
            this.sendError(ws, 'Not authenticated');
            return;
        }
        try {
            // Import AI service
            const { aiService } = await import('../services/ai.js');
            const { conversationId, message: userMessage, provider = 'openai', model } = message.payload;
            // Load conversation
            let messages = [];
            if (conversationId) {
                const conversation = await aiService.loadConversation(conversationId);
                if (conversation) {
                    messages = conversation.messages;
                }
            }
            // Add user message
            messages.push({ role: 'user', content: userMessage });
            // Send typing indicator
            this.sendToUser(ws.userId, {
                type: 'ai_typing',
                payload: { conversationId },
                timestamp: Date.now(),
            });
            // Generate AI response
            const response = await aiService.generateChat(messages, provider, { model });
            // Add AI response
            messages.push({ role: 'assistant', content: response.content });
            // Save conversation
            const finalConversationId = conversationId || await aiService.saveConversation(ws.userId, messages, `Chat ${new Date().toLocaleDateString()}`, response.model);
            // Send response
            this.sendToUser(ws.userId, {
                type: 'ai_response',
                payload: {
                    conversationId: finalConversationId,
                    message: response.content,
                    tokens: response.tokens,
                    model: response.model,
                    provider: response.provider,
                },
                timestamp: Date.now(),
            });
            // Broadcast to conversation room if others are listening
            this.broadcastToRoom(`conversation:${finalConversationId}`, {
                type: 'conversation_updated',
                payload: {
                    conversationId: finalConversationId,
                    lastMessage: response.content,
                    userId: ws.userId,
                },
                timestamp: Date.now(),
            }, ws.userId);
        }
        catch (error) {
            this.fastify.log.error('Error handling chat message:', error);
            this.sendError(ws, 'Failed to process chat message');
        }
    }
    handleJoinRoom(ws, message) {
        if (!ws.userId) {
            this.sendError(ws, 'Not authenticated');
            return;
        }
        const { room } = message.payload;
        this.joinRoom(ws.userId, room);
        this.sendToUser(ws.userId, {
            type: 'room_joined',
            payload: { room },
            timestamp: Date.now(),
        });
    }
    handleLeaveRoom(ws, message) {
        if (!ws.userId) {
            this.sendError(ws, 'Not authenticated');
            return;
        }
        const { room } = message.payload;
        this.leaveRoom(ws.userId, room);
        this.sendToUser(ws.userId, {
            type: 'room_left',
            payload: { room },
            timestamp: Date.now(),
        });
    }
    sendError(ws, message, details) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'error',
                payload: { message, details },
                timestamp: Date.now(),
            }));
        }
    }
    handleDisconnection(ws) {
        if (ws.userId) {
            // Leave all rooms
            const userRoomsSet = this.userRooms.get(ws.userId);
            if (userRoomsSet) {
                for (const room of userRoomsSet) {
                    this.leaveRoom(ws.userId, room);
                }
            }
            // Remove from connections
            this.connections.delete(ws.userId);
            this.userRooms.delete(ws.userId);
            this.fastify.log.info(`WebSocket disconnected for user: ${ws.userId}`);
        }
    }
    // Heartbeat to keep connections alive
    startHeartbeat() {
        setInterval(() => {
            for (const [userId, ws] of this.connections) {
                if (!ws.isAlive) {
                    this.fastify.log.info(`Terminating dead connection for user: ${userId}`);
                    ws.terminate();
                    this.handleDisconnection(ws);
                    continue;
                }
                ws.isAlive = false;
                ws.ping();
            }
        }, 30000); // 30 seconds
    }
    getStats() {
        return {
            activeConnections: this.connections.size,
            totalRooms: this.rooms.size,
            roomStats: Array.from(this.rooms.entries()).map(([room, users]) => ({
                room,
                userCount: users.size,
            })),
        };
    }
}
export async function websocketRoutes(fastify) {
    const wsService = new WebSocketService(fastify);
    // Start heartbeat
    wsService.startHeartbeat();
    // WebSocket endpoint with authentication
    fastify.get('/ws', { websocket: true }, (connection, request) => {
        const ws = connection;
        // Get token from query params or headers
        const token = request.query?.token ||
            (request.headers.authorization?.replace('Bearer ', ''));
        if (!token) {
            ws.close(1008, 'Authentication required');
            return;
        }
        // Authenticate the connection
        wsService.authenticateSocket(ws, token).then(authenticated => {
            if (!authenticated) {
                ws.close(1008, 'Authentication failed');
                return;
            }
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                payload: { message: 'WebSocket connected successfully' },
                timestamp: Date.now(),
            }));
            // Handle messages
            ws.on('message', (message) => {
                wsService.handleMessage(ws, message.toString());
            });
            // Handle pong (heartbeat response)
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            // Handle disconnection
            ws.on('close', () => {
                wsService.handleDisconnection(ws);
            });
            ws.on('error', (error) => {
                fastify.log.error('WebSocket error:', error);
                wsService.handleDisconnection(ws);
            });
        });
    });
    // WebSocket stats endpoint
    fastify.get('/ws/stats', {
        preHandler: [async (request, reply) => {
                const { authMiddleware } = await import('../middleware/auth.js');
                await authMiddleware(request, reply, { roles: ['ADMIN'] });
            }],
        schema: {
            tags: ['WebSocket'],
            summary: 'Get WebSocket statistics',
            security: [{ bearerAuth: [] }],
        },
    }, async (_request, reply) => {
        const stats = wsService.getStats();
        await reply.send({
            success: true,
            data: stats,
        });
    });
    return wsService;
}
//# sourceMappingURL=websocket.js.map