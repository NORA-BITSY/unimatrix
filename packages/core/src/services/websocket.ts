import { FastifyInstance } from 'fastify';
import { IncomingMessage } from 'http';

interface WebSocketClient {
  id: string;
  userId?: string;
  socket: any; // WebSocket type from @fastify/websocket
  subscriptions: Set<string>;
  lastSeen: Date;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  clientId?: string;
  userId?: string;
}

class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();
  private channels: Map<string, Set<string>> = new Map(); // channel -> client IDs
  private messageHistory: Map<string, WebSocketMessage[]> = new Map(); // channel -> messages
  private maxHistoryPerChannel = 100;

  constructor() {
    // Clean up disconnected clients every 30 seconds
    setInterval(() => {
      this.cleanupClients();
    }, 30000);
  }

  // Register a new WebSocket client
  registerClient(socket: any, _request: IncomingMessage): string {
    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      id: clientId,
      socket,
      subscriptions: new Set(),
      lastSeen: new Date()
    };

    this.clients.set(clientId, client);

    socket.on('message', (message: Buffer) => {
      this.handleMessage(clientId, message);
    });

    socket.on('close', () => {
      this.unregisterClient(clientId);
    });

    socket.on('error', (error: any) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.unregisterClient(clientId);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      payload: {
        clientId,
        timestamp: new Date().toISOString(),
        message: 'WebSocket connection established'
      },
      timestamp: new Date()
    });

    console.log(`[WebSocket] Client ${clientId} connected`);
    return clientId;
  }

  // Unregister a client
  private unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all channel subscriptions
      client.subscriptions.forEach(channel => {
        this.unsubscribeFromChannel(clientId, channel);
      });
      
      this.clients.delete(clientId);
      console.log(`[WebSocket] Client ${clientId} disconnected`);
    }
  }

  // Handle incoming message from client
  private handleMessage(clientId: string, messageBuffer: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastSeen = new Date();

    try {
      const message = JSON.parse(messageBuffer.toString());
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(clientId, message.payload);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.payload);
          break;
        case 'publish':
          this.handlePublish(clientId, message.payload);
          break;
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            payload: { timestamp: new Date().toISOString() },
            timestamp: new Date()
          });
          break;
        case 'auth':
          this.handleAuthentication(clientId, message.payload);
          break;
        default:
          this.sendToClient(clientId, {
            type: 'error',
            payload: { message: `Unknown message type: ${message.type}` },
            timestamp: new Date()
          });
      }
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Invalid JSON message' },
        timestamp: new Date()
      });
    }
  }

  // Handle subscription request
  private handleSubscription(clientId: string, payload: any): void {
    const { channel, filters } = payload;
    if (!channel) {
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Channel is required for subscription' },
        timestamp: new Date()
      });
      return;
    }

    this.subscribeToChannel(clientId, channel, filters);
    
    this.sendToClient(clientId, {
      type: 'subscribed',
      payload: { channel, filters },
      timestamp: new Date()
    });

    // Send recent message history for the channel
    const history = this.messageHistory.get(channel) || [];
    if (history.length > 0) {
      this.sendToClient(clientId, {
        type: 'history',
        payload: {
          channel,
          messages: history.slice(-10) // Last 10 messages
        },
        timestamp: new Date()
      });
    }
  }

  // Handle unsubscription request
  private handleUnsubscription(clientId: string, payload: any): void {
    const { channel } = payload;
    if (!channel) {
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Channel is required for unsubscription' },
        timestamp: new Date()
      });
      return;
    }

    this.unsubscribeFromChannel(clientId, channel);
    
    this.sendToClient(clientId, {
      type: 'unsubscribed',
      payload: { channel },
      timestamp: new Date()
    });
  }

  // Handle publish request
  private handlePublish(clientId: string, payload: any): void {
    const { channel, data } = payload;
    if (!channel || !data) {
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Channel and data are required for publishing' },
        timestamp: new Date()
      });
      return;
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    this.broadcast(channel, {
      type: 'message',
      payload: {
        channel,
        data,
        publishedBy: client.userId || clientId
      },
      timestamp: new Date(),
      clientId,
      userId: client.userId
    });
  }

  // Handle authentication
  private handleAuthentication(clientId: string, payload: any): void {
    const { token } = payload;
    if (!token) {
      this.sendToClient(clientId, {
        type: 'auth_error',
        payload: { message: 'Token is required' },
        timestamp: new Date()
      });
      return;
    }

    // TODO: Verify JWT token and extract user info
    // For now, we'll just accept any token and extract userId from payload
    const client = this.clients.get(clientId);
    if (client) {
      client.userId = payload.userId; // In real implementation, extract from verified JWT
      
      this.sendToClient(clientId, {
        type: 'authenticated',
        payload: { userId: client.userId },
        timestamp: new Date()
      });
    }
  }

  // Subscribe client to a channel
  private subscribeToChannel(clientId: string, channel: string, _filters?: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(clientId);
  }

  // Unsubscribe client from a channel
  private unsubscribeFromChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(channel);
    }

    const channelClients = this.channels.get(channel);
    if (channelClients) {
      channelClients.delete(clientId);
      if (channelClients.size === 0) {
        this.channels.delete(channel);
        this.messageHistory.delete(channel); // Clean up history when no subscribers
      }
    }
  }

  // Send message to a specific client
  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === 1) { // OPEN
      try {
        client.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.unregisterClient(clientId);
      }
    }
  }

  // Broadcast message to all subscribers of a channel
  broadcast(channel: string, message: WebSocketMessage): void {
    const channelClients = this.channels.get(channel);
    if (!channelClients) return;

    // Store in message history
    if (!this.messageHistory.has(channel)) {
      this.messageHistory.set(channel, []);
    }
    const history = this.messageHistory.get(channel)!;
    history.push(message);
    if (history.length > this.maxHistoryPerChannel) {
      history.shift(); // Remove oldest message
    }

    // Send to all subscribers
    channelClients.forEach(clientId => {
      this.sendToClient(clientId, message);
    });
  }

  // Broadcast to all connected clients
  broadcastToAll(message: WebSocketMessage): void {
    this.clients.forEach((_client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  // Get WebSocket statistics
  getStats() {
    const channelStats = Array.from(this.channels.entries()).map(([channel, clients]) => ({
      channel,
      subscribers: clients.size
    }));

    return {
      totalClients: this.clients.size,
      totalChannels: this.channels.size,
      channels: channelStats,
      authenticatedClients: Array.from(this.clients.values()).filter(c => c.userId).length
    };
  }

  // Get channel information
  getChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // Get client information
  getClients(): any[] {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      userId: client.userId,
      subscriptions: Array.from(client.subscriptions),
      lastSeen: client.lastSeen,
      connected: client.socket.readyState === 1
    }));
  }

  // Clean up disconnected clients
  private cleanupClients(): void {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    this.clients.forEach((client, clientId) => {
      if (client.socket.readyState !== 1 || (now.getTime() - client.lastSeen.getTime()) > timeout) {
        this.unregisterClient(clientId);
      }
    });
  }

  // Generate unique client ID
  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const webSocketService = new WebSocketService();

// WebSocket route registration
export async function websocketRoutes(fastify: FastifyInstance) {
  // WebSocket plugin is already registered in main server
  // await fastify.register(import('@fastify/websocket'));

  fastify.get('/ws', { websocket: true }, (connection, _request) => {
    const clientId = webSocketService.registerClient(connection, _request.raw);
    console.log(`[WebSocket] New connection: ${clientId}`);
  });

  // WebSocket stats endpoint
  fastify.get('/ws/stats', async (_request, reply) => {
    reply.send({
      success: true,
      data: webSocketService.getStats()
    });
  });

  // Broadcast message endpoint (for server-side broadcasting)
  fastify.post('/ws/broadcast/:channel', async (request, reply) => {
    const { channel } = request.params as { channel: string };
    const { data } = request.body as { data: any };

    webSocketService.broadcast(channel, {
      type: 'broadcast',
      payload: {
        channel,
        data,
        source: 'server'
      },
      timestamp: new Date()
    });

    reply.send({
      success: true,
      message: `Message broadcasted to channel: ${channel}`
    });
  });

  console.log('[INFO] WebSocket routes registered');
}

export default WebSocketService;
