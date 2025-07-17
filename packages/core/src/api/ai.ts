import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { aiService } from '../services/ai.js';
import { ValidationError } from '@matrix/shared';

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  model: z.string().optional(),
  provider: z.enum(['openai', 'anthropic', 'huggingface']).default('openai'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
});

const newConversationSchema = z.object({
  title: z.string().optional(),
  model: z.string().optional(),
});

// Types
interface ChatRequest {
  message: string;
  conversationId?: string;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'huggingface';
  temperature?: number;
  maxTokens?: number;
}

interface NewConversationRequest {
  title?: string;
  model?: string;
}

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export async function aiRoutes(fastify: FastifyInstance) {
  // Helper function for authentication
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const { authMiddleware } = await import('../middleware/auth.js');
    await authMiddleware(request, reply);
  };

  // Send chat message
  fastify.post<{ Body: ChatRequest }>('/chat', {
    preHandler: [requireAuth],
    schema: {
      tags: ['AI'],
      summary: 'Send a chat message to AI',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1 },
          conversationId: { type: 'string' },
          model: { type: 'string' },
          provider: { type: 'string', enum: ['openai', 'anthropic', 'huggingface'] },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          maxTokens: { type: 'number', minimum: 1, maximum: 4000 },
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
                message: { type: 'string' },
                conversationId: { type: 'string' },
                tokens: { type: 'number' },
                model: { type: 'string' },
                provider: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const validatedData = chatRequestSchema.parse(request.body);
      const userId = request.user.id;

      let conversationId = validatedData.conversationId;
      let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

      // Load existing conversation or create new one
      if (conversationId) {
        const conversation = await aiService.loadConversation(conversationId);
        if (!conversation) {
          throw new ValidationError('Conversation not found');
        }
        messages = conversation.messages;
      }

      // Add user message
      messages.push({
        role: 'user',
        content: validatedData.message,
      });

      // Generate AI response
      const response = await aiService.generateChat(
        messages,
        validatedData.provider,
        {
          model: validatedData.model,
          temperature: validatedData.temperature,
          maxTokens: validatedData.maxTokens,
        }
      );

      // Add AI response to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      // Save conversation
      if (!conversationId) {
        conversationId = await aiService.saveConversation(
          userId,
          messages,
          `Chat ${new Date().toLocaleDateString()}`,
          response.model
        );
      } else {
        // Update existing conversation (we'll need to implement this)
        await aiService.saveConversation(userId, messages, undefined, response.model);
      }

      await reply.send({
        success: true,
        data: {
          message: response.content,
          conversationId,
          tokens: response.tokens,
          model: response.model,
          provider: response.provider,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data');
      }
      throw error;
    }
  });

  // Get conversation history
  fastify.get<{ Params: { conversationId: string } }>('/conversations/:conversationId', {
    preHandler: [requireAuth],
    schema: {
      tags: ['AI'],
      summary: 'Get conversation history',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['conversationId'],
        properties: {
          conversationId: { type: 'string' },
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { conversationId } = request.params as { conversationId: string };
      const conversation = await aiService.loadConversation(conversationId);

      if (!conversation) {
        throw new ValidationError('Conversation not found');
      }

      await reply.send({
        success: true,
        data: conversation,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get user's conversations
  fastify.get('/conversations', {
    preHandler: [requireAuth],
    schema: {
      tags: ['AI'],
      summary: 'Get user conversations',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const conversations = await aiService.getUserConversations(userId);

      await reply.send({
        success: true,
        data: { conversations },
      });
    } catch (error) {
      throw error;
    }
  });

  // Create new conversation
  fastify.post<{ Body: NewConversationRequest }>('/conversations', {
    preHandler: [requireAuth],
    schema: {
      tags: ['AI'],
      summary: 'Create new conversation',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          model: { type: 'string' },
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const validatedData = newConversationSchema.parse(request.body);
      const userId = request.user.id;

      const conversationId = await aiService.saveConversation(
        userId,
        [],
        validatedData.title || 'New Conversation',
        validatedData.model
      );

      await reply.send({
        success: true,
        data: { conversationId },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data');
      }
      throw error;
    }
  });

  // Text generation endpoint (single request, no conversation)
  fastify.post<{ Body: { prompt: string; provider?: string; model?: string; temperature?: number; maxTokens?: number } }>('/generate', {
    preHandler: [requireAuth],
    schema: {
      tags: ['AI'],
      summary: 'Generate text from prompt',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          provider: { type: 'string', enum: ['openai', 'anthropic', 'huggingface'] },
          model: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          maxTokens: { type: 'number', minimum: 1, maximum: 4000 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { prompt, provider = 'openai', model, temperature, maxTokens } = request.body as any;

      const response = await aiService.generateText(prompt, provider, {
        model,
        temperature,
        maxTokens,
      });

      await reply.send({
        success: true,
        data: response,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get available AI providers
  fastify.get('/providers', {
    schema: {
      tags: ['AI'],
      summary: 'Get available AI providers',
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const providers = aiService.getAvailableProviders();

      await reply.send({
        success: true,
        data: { providers },
      });
    } catch (error) {
      throw error;
    }
  });
}
