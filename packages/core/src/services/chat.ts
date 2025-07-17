import { EventEmitter } from 'events';
import { db } from './database.js';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  replyToId?: string;
}

export interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[];
  createdBy: string;
  createdAt: Date;
  lastMessage?: Message;
  metadata?: Record<string, any>;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  timestamp: Date;
}

class ChatService extends EventEmitter {
  private typingUsers: Map<string, Map<string, NodeJS.Timeout>> = new Map();

  constructor() {
    super();
    logger.info('Chat service initialized');
  }

  // Create a new conversation
  async createConversation(data: {
    name?: string;
    type: 'direct' | 'group' | 'channel';
    participants: string[];
    createdBy: string;
    metadata?: Record<string, any>;
  }): Promise<Conversation> {
    try {
      // For direct conversations, ensure only 2 participants
      if (data.type === 'direct' && data.participants.length !== 2) {
        throw new Error('Direct conversations must have exactly 2 participants');
      }

      // Check if direct conversation already exists
      if (data.type === 'direct') {
        const existingConversation = await this.findDirectConversation(
          data.participants[0],
          data.participants[1]
        );
        if (existingConversation) {
          return existingConversation;
        }
      }

      const conversation = await db.conversation.create({
        data: {
          name: data.name,
          type: data.type.toUpperCase() as any,
          createdBy: data.createdBy,
          metadata: JSON.stringify(data.metadata || {}),
          participants: {
            create: data.participants.map(userId => ({
              userId,
              joinedAt: new Date()
            }))
          }
        },
        include: {
          participants: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      const result: Conversation = {
        id: conversation.id,
        name: conversation.name || undefined,
        type: conversation.type.toLowerCase() as any,
        participants: conversation.participants.map((p: any) => p.userId),
        createdBy: conversation.createdBy,
        createdAt: conversation.createdAt,
        metadata: conversation.metadata ? JSON.parse(conversation.metadata) : {}
      };

      this.emit('conversationCreated', result);
      logger.info(`Conversation created: ${conversation.id} (${data.type})`);
      
      return result;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: 'text' | 'image' | 'file' | 'system';
    metadata?: Record<string, any>;
    replyToId?: string;
  }): Promise<Message> {
    try {
      // Verify user is participant in conversation
      const participant = await db.conversationParticipant.findFirst({
        where: {
          conversationId: data.conversationId,
          userId: data.senderId
        }
      });

      if (!participant) {
        throw new Error('User is not a participant in this conversation');
      }

      const message = await db.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          messageType: (data.messageType || 'text').toUpperCase() as any,
          metadata: JSON.stringify(data.metadata || {}),
          replyToId: data.replyToId
        }
      });

      const result: Message = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        messageType: message.messageType.toLowerCase() as any,
        metadata: message.metadata ? JSON.parse(message.metadata) : {},
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        isEdited: message.isEdited,
        replyToId: message.replyToId || undefined
      };

      // Clear typing indicator for this user
      this.clearTyping(data.conversationId, data.senderId);

      // Emit message to all participants
      this.emit('messageReceived', result);
      
      logger.info(`Message sent: ${message.id} in conversation ${data.conversationId}`);
      
      return result;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  // Get conversation messages
  async getMessages(conversationId: string, options: {
    limit?: number;
    offset?: number;
    userId?: string;
  } = {}): Promise<{
    messages: Message[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      // Verify user access if userId provided
      if (options.userId) {
        const participant = await db.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: options.userId
          }
        });

        if (!participant) {
          throw new Error('User is not a participant in this conversation');
        }
      }

      const [messages, total] = await Promise.all([
        db.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        db.message.count({ where: { conversationId } })
      ]);

      const result: Message[] = messages.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        messageType: msg.messageType.toLowerCase() as any,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : {},
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        isEdited: msg.isEdited,
        replyToId: msg.replyToId || undefined
      }));

      return {
        messages: result,
        total,
        hasMore: offset + messages.length < total
      };
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  // Get user conversations
  async getUserConversations(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    conversations: Conversation[];
    total: number;
  }> {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const [participantData, total] = await Promise.all([
        db.conversationParticipant.findMany({
          where: { userId },
          include: {
            conversation: {
              include: {
                participants: true,
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          },
          orderBy: {
            conversation: {
              updatedAt: 'desc'
            }
          },
          take: limit,
          skip: offset
        }),
        db.conversationParticipant.count({ where: { userId } })
      ]);

      const conversations: Conversation[] = participantData.map((p: any) => {
        const conv = p.conversation;
        return {
          id: conv.id,
          name: conv.name || undefined,
          type: conv.type.toLowerCase() as any,
          participants: conv.participants.map((p: any) => p.userId),
          createdBy: conv.createdBy,
          createdAt: conv.createdAt,
          lastMessage: conv.messages[0] ? {
            id: conv.messages[0].id,
            conversationId: conv.messages[0].conversationId,
            senderId: conv.messages[0].senderId,
            content: conv.messages[0].content,
            messageType: conv.messages[0].messageType.toLowerCase() as any,
            metadata: conv.messages[0].metadata ? JSON.parse(conv.messages[0].metadata) : {},
            createdAt: conv.messages[0].createdAt,
            updatedAt: conv.messages[0].updatedAt,
            isEdited: conv.messages[0].isEdited,
            replyToId: conv.messages[0].replyToId || undefined
          } : undefined,
          metadata: conv.metadata ? JSON.parse(conv.metadata) : {}
        };
      });

      return { conversations, total };
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // Add user to conversation
  async addParticipant(conversationId: string, userId: string, addedBy: string): Promise<boolean> {
    try {
      // Check if user is already a participant
      const existing = await db.conversationParticipant.findFirst({
        where: { conversationId, userId }
      });

      if (existing) {
        return false; // Already a participant
      }

      // Verify the person adding has permission (is a participant)
      const adder = await db.conversationParticipant.findFirst({
        where: { conversationId, userId: addedBy }
      });

      if (!adder) {
        throw new Error('User does not have permission to add participants');
      }

      await db.conversationParticipant.create({
        data: {
          conversationId,
          userId,
          joinedAt: new Date()
        }
      });

      // Send system message
      await this.sendMessage({
        conversationId,
        senderId: addedBy,
        content: `User ${userId} was added to the conversation`,
        messageType: 'system'
      });

      this.emit('participantAdded', { conversationId, userId, addedBy });
      
      return true;
    } catch (error) {
      logger.error('Error adding participant:', error);
      throw error;
    }
  }

  // Handle typing indicators
  setTyping(conversationId: string, userId: string, username: string): void {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Map());
    }

    const conversationTyping = this.typingUsers.get(conversationId)!;
    
    // Clear existing timeout
    if (conversationTyping.has(userId)) {
      clearTimeout(conversationTyping.get(userId)!);
    }

    // Set new timeout (stop typing after 3 seconds)
    const timeout = setTimeout(() => {
      this.clearTyping(conversationId, userId);
    }, 3000);

    conversationTyping.set(userId, timeout);

    const typingIndicator: TypingIndicator = {
      conversationId,
      userId,
      username,
      timestamp: new Date()
    };

    this.emit('userTyping', typingIndicator);
  }

  clearTyping(conversationId: string, userId: string): void {
    const conversationTyping = this.typingUsers.get(conversationId);
    if (conversationTyping && conversationTyping.has(userId)) {
      clearTimeout(conversationTyping.get(userId)!);
      conversationTyping.delete(userId);
      
      this.emit('userStoppedTyping', { conversationId, userId });
    }
  }

  // Get typing users for a conversation
  getTypingUsers(conversationId: string): string[] {
    const conversationTyping = this.typingUsers.get(conversationId);
    return conversationTyping ? Array.from(conversationTyping.keys()) : [];
  }

  // Edit a message
  async editMessage(messageId: string, newContent: string, userId: string): Promise<Message | null> {
    try {
      // Verify user owns the message
      const existingMessage = await db.message.findFirst({
        where: { id: messageId, senderId: userId }
      });

      if (!existingMessage) {
        return null;
      }

      const updatedMessage = await db.message.update({
        where: { id: messageId },
        data: {
          content: newContent,
          isEdited: true,
          updatedAt: new Date()
        }
      });

      const result: Message = {
        id: updatedMessage.id,
        conversationId: updatedMessage.conversationId,
        senderId: updatedMessage.senderId,
        content: updatedMessage.content,
        messageType: updatedMessage.messageType.toLowerCase() as any,
        metadata: updatedMessage.metadata ? JSON.parse(updatedMessage.metadata) : {},
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
        isEdited: updatedMessage.isEdited,
        replyToId: updatedMessage.replyToId || undefined
      };

      this.emit('messageEdited', result);
      
      return result;
    } catch (error) {
      logger.error('Error editing message:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      // Verify user owns the message
      const existingMessage = await db.message.findFirst({
        where: { id: messageId, senderId: userId }
      });

      if (!existingMessage) {
        return false;
      }

      await db.message.delete({
        where: { id: messageId }
      });

      this.emit('messageDeleted', { messageId, conversationId: existingMessage.conversationId });
      
      return true;
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  // Find direct conversation between two users
  private async findDirectConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    try {
      const conversation = await db.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: { in: [userId1, userId2] }
            }
          }
        },
        include: {
          participants: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!conversation) {
        return null;
      }

      return {
        id: conversation.id,
        name: conversation.name || undefined,
        type: conversation.type.toLowerCase() as any,
        participants: conversation.participants.map((p: any) => p.userId),
        createdBy: conversation.createdBy,
        createdAt: conversation.createdAt,
        lastMessage: conversation.messages[0] ? {
          id: conversation.messages[0].id,
          conversationId: conversation.messages[0].conversationId,
          senderId: conversation.messages[0].senderId,
          content: conversation.messages[0].content,
          messageType: conversation.messages[0].messageType.toLowerCase() as any,
          metadata: conversation.messages[0].metadata ? JSON.parse(conversation.messages[0].metadata) : {},
          createdAt: conversation.messages[0].createdAt,
          updatedAt: conversation.messages[0].updatedAt,
          isEdited: conversation.messages[0].isEdited,
          replyToId: conversation.messages[0].replyToId || undefined
        } : undefined,
        metadata: conversation.metadata ? JSON.parse(conversation.metadata) : {}
      };
    } catch (error) {
      logger.error('Error finding direct conversation:', error);
      return null;
    }
  }
}

export const chatService = new ChatService();
