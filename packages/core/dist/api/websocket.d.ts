import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    email?: string;
    role?: string;
    isAlive?: boolean;
}
interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: number;
    requestId?: string;
}
export declare class WebSocketService {
    private fastify;
    private connections;
    private rooms;
    private userRooms;
    constructor(fastify: FastifyInstance);
    authenticateSocket(ws: AuthenticatedWebSocket, token: string): Promise<boolean>;
    joinRoom(userId: string, room: string): void;
    leaveRoom(userId: string, room: string): void;
    broadcastToRoom(room: string, message: WebSocketMessage, excludeUserId?: string): void;
    sendToUser(userId: string, message: WebSocketMessage): boolean;
    handleMessage(ws: AuthenticatedWebSocket, rawMessage: string): void;
    private handleChatMessage;
    private handleJoinRoom;
    private handleLeaveRoom;
    private sendError;
    handleDisconnection(ws: AuthenticatedWebSocket): void;
    startHeartbeat(): void;
    getStats(): any;
}
export declare function websocketRoutes(fastify: FastifyInstance): Promise<WebSocketService>;
export {};
//# sourceMappingURL=websocket.d.ts.map