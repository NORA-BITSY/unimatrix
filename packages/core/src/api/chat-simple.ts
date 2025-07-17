import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { chatService } from '../services/chat.js';

// Simple auth middleware
async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ success: false, error: 'Unauthorized' });
  }
}

// Validation schemas
const createConversationSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['direct', 'group', 'channel']),
  participants: z.array(z.string()).min(1),
  metadata: z.record(z.any()).optional()
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.enum(['text', 'image', 'file', 'system']).optional(),
  metadata: z.record(z.any()).optional(),
  replyToId: z.string().optional()
});

const editMessageSchema = z.object({
  content: z.string().min(1)
});

const addParticipantSchema = z.object({
  userId: z.string()
});

const typingSchema = z.object({
  username: z.string()
});

const paginationSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

export async function chatRoutes(fastify: FastifyInstance) {
  // Create conversation
  fastify.post('/conversations', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const body = createConversationSchema.parse(request.body);

      // Ensure creator is in participants list
      if (!body.participants.includes(user.id)) {
        body.participants.push(user.id);
      }

      const conversation = await chatService.createConversation({
        ...body,
        createdBy: user.id
      });

      reply.code(201).send({
        success: true,
        data: conversation
      });
    } catch (error) {
      logger.error('Error creating conversation:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation'
      });
    }
  });

  // Get user conversations
  fastify.get('/conversations', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const query = paginationSchema.parse(request.query);

      const result = await chatService.getUserConversations(user.id, query);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting conversations:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get conversations'
      });
    }
  });

  // Send message
  fastify.post('/conversations/:conversationId/messages', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { conversationId } = request.params as { conversationId: string };
      const body = sendMessageSchema.parse(request.body);

      const message = await chatService.sendMessage({
        conversationId,
        senderId: user.id,
        ...body
      });

      reply.code(201).send({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  });

  // Get conversation messages
  fastify.get('/conversations/:conversationId/messages', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { conversationId } = request.params as { conversationId: string };
      const query = paginationSchema.parse(request.query);

      const result = await chatService.getMessages(conversationId, {
        ...query,
        userId: user.id
      });

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting messages:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get messages'
      });
    }
  });

  // Edit message
  fastify.put('/messages/:messageId', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { messageId } = request.params as { messageId: string };
      const { content } = editMessageSchema.parse(request.body);

      const message = await chatService.editMessage(messageId, content, user.id);

      if (!message) {
        reply.code(404).send({
          success: false,
          error: 'Message not found or not authorized'
        });
        return;
      }

      reply.send({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('Error editing message:', error);
      reply.code(400).send({
        success: false,
        error: 'Failed to edit message'
      });
    }
  });

  // Delete message
  fastify.delete('/messages/:messageId', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { messageId } = request.params as { messageId: string };

      const deleted = await chatService.deleteMessage(messageId, user.id);

      if (!deleted) {
        reply.code(404).send({
          success: false,
          error: 'Message not found or not authorized'
        });
        return;
      }

      reply.send({
        success: true
      });
    } catch (error) {
      logger.error('Error deleting message:', error);
      reply.code(400).send({
        success: false,
        error: 'Failed to delete message'
      });
    }
  });

  // Add participant to conversation
  fastify.post('/conversations/:conversationId/participants', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { conversationId } = request.params as { conversationId: string };
      const { userId } = addParticipantSchema.parse(request.body);

      const added = await chatService.addParticipant(conversationId, userId, user.id);

      if (!added) {
        reply.code(400).send({
          success: false,
          error: 'User is already a participant'
        });
        return;
      }

      reply.send({
        success: true
      });
    } catch (error) {
      logger.error('Error adding participant:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add participant'
      });
    }
  });

  // Set typing indicator
  fastify.post('/conversations/:conversationId/typing', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { conversationId } = request.params as { conversationId: string };
      const { username } = typingSchema.parse(request.body);

      chatService.setTyping(conversationId, user.id, username);

      reply.send({
        success: true
      });
    } catch (error) {
      logger.error('Error setting typing:', error);
      reply.code(400).send({
        success: false,
        error: 'Failed to set typing indicator'
      });
    }
  });

  // Clear typing indicator
  fastify.delete('/conversations/:conversationId/typing', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { conversationId } = request.params as { conversationId: string };

      chatService.clearTyping(conversationId, user.id);

      reply.send({
        success: true
      });
    } catch (error) {
      logger.error('Error clearing typing:', error);
      reply.code(400).send({
        success: false,
        error: 'Failed to clear typing indicator'
      });
    }
  });

  // Get typing users
  fastify.get('/conversations/:conversationId/typing', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { conversationId } = request.params as { conversationId: string };

      const typingUsers = chatService.getTypingUsers(conversationId);

      reply.send({
        success: true,
        data: {
          typingUsers
        }
      });
    } catch (error) {
      logger.error('Error getting typing users:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get typing users'
      });
    }
  });

  logger.info('Chat API routes registered');
}
