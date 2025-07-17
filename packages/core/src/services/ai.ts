import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { HfInference } from '@huggingface/inference';
import { logger } from '@matrix/shared';
import { db } from './database.js';

// AI Provider interfaces
export interface AiProvider {
  name: string;
  generateText(prompt: string, options?: GenerateOptions): Promise<AiResponse>;
  generateChat(messages: ChatMessage[], options?: GenerateOptions): Promise<AiResponse>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

export interface AiResponse {
  content: string;
  tokens?: number;
  model: string;
  provider: string;
  finishReason?: string;
}

// OpenAI Provider
export class OpenAIProvider implements AiProvider {
  public name = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateText(prompt: string, options: GenerateOptions = {}): Promise<AiResponse> {
    try {
      const response = await this.client.completions.create({
        model: options.model || 'gpt-3.5-turbo-instruct',
        prompt,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
      });

      return {
        content: response.choices[0]?.text || '',
        tokens: response.usage?.total_tokens,
        model: response.model,
        provider: this.name,
        finishReason: response.choices[0]?.finish_reason || undefined,
      };
    } catch (error) {
      logger.error('OpenAI generateText error', { error });
      throw error;
    }
  }

  async generateChat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<AiResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        stream: false, // Ensure non-streaming response
      });

      // Type assertion for non-streaming response
      const chatResponse = response as OpenAI.Chat.Completions.ChatCompletion;

      return {
        content: chatResponse.choices[0]?.message?.content || '',
        tokens: chatResponse.usage?.total_tokens,
        model: chatResponse.model,
        provider: this.name,
        finishReason: chatResponse.choices[0]?.finish_reason || undefined,
      };
    } catch (error) {
      logger.error('OpenAI generateChat error', { error });
      throw error;
    }
  }
}

// Anthropic Provider
export class AnthropicProvider implements AiProvider {
  public name = 'anthropic';
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateText(prompt: string, options: GenerateOptions = {}): Promise<AiResponse> {
    // Convert to chat format for Claude
    return this.generateChat([{ role: 'user', content: prompt }], options);
  }

  async generateChat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<AiResponse> {
    try {
      const response = await this.client.messages.create({
        model: options.model || 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        messages: messages.filter(msg => msg.role !== 'system').map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        system: messages.find(msg => msg.role === 'system')?.content,
      });

      return {
        content: response.content[0]?.type === 'text' ? response.content[0].text : '',
        tokens: response.usage?.input_tokens + response.usage?.output_tokens,
        model: response.model,
        provider: this.name,
        finishReason: response.stop_reason || undefined,
      };
    } catch (error) {
      logger.error('Anthropic generateChat error', { error });
      throw error;
    }
  }
}

// Hugging Face Provider
export class HuggingFaceProvider implements AiProvider {
  public name = 'huggingface';
  private client: HfInference;

  constructor(apiKey?: string) {
    this.client = new HfInference(apiKey || process.env.HUGGINGFACE_API_KEY);
  }

  async generateText(prompt: string, options: GenerateOptions = {}): Promise<AiResponse> {
    try {
      const response = await this.client.textGeneration({
        model: options.model || 'microsoft/DialoGPT-medium',
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
        },
      });

      return {
        content: response.generated_text || '',
        model: options.model || 'microsoft/DialoGPT-medium',
        provider: this.name,
      };
    } catch (error) {
      logger.error('HuggingFace generateText error', { error });
      throw error;
    }
  }

  async generateChat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<AiResponse> {
    // Convert chat to single prompt
    const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    return this.generateText(prompt + '\nassistant:', options);
  }
}

// Mock Provider for development/testing
export class MockAIProvider implements AiProvider {
  public name = 'mock';

  async generateText(prompt: string, options: GenerateOptions = {}): Promise<AiResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const mockResponses = [
      `This is a mock response to: "${prompt.substring(0, 50)}..."`,
      "I'm a mock AI provider for development and testing purposes.",
      "Your message has been received and processed by the mock AI system.",
      "This is a simulated AI response. In production, this would be from a real AI model.",
    ];

    const content = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    return {
      content,
      tokens: Math.floor(prompt.length * 0.75) + Math.floor(content.length * 1.2),
      model: options.model || 'mock-model',
      provider: this.name,
      finishReason: 'stop',
    };
  }

  async generateChat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<AiResponse> {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error('No messages provided');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

    const mockResponses = [
      `I understand you said: "${lastMessage.content.substring(0, 30)}..." This is a mock response.`,
      "Thank you for your message! I'm a mock AI assistant for development purposes.",
      "Your conversation is being handled by the mock AI provider. This simulates real AI chat functionality.",
      "I'm processing your request using the mock AI system. In production, this would be a real AI model.",
      "That's an interesting question! As a mock AI, I can simulate responses for testing the chat system.",
    ];

    const content = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const totalTokens = messages.reduce((sum, msg) => sum + msg.content.length, 0) * 0.75 + content.length * 1.2;

    return {
      content,
      tokens: Math.floor(totalTokens),
      model: options.model || 'mock-chat-model',
      provider: this.name,
      finishReason: 'stop',
    };
  }
}

// Main AI Service
export class AiService {
  private providers: Map<string, AiProvider> = new Map();

  constructor() {
    // Initialize providers with proper API key validation
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== 'your-openai-api-key') {
      try {
        this.providers.set('openai', new OpenAIProvider());
        logger.info('OpenAI provider initialized');
      } catch (error) {
        logger.error('Failed to initialize OpenAI provider', { error });
      }
    } else {
      logger.warn('OpenAI API key not configured');
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== 'your-anthropic-api-key') {
      try {
        this.providers.set('anthropic', new AnthropicProvider());
        logger.info('Anthropic provider initialized');
      } catch (error) {
        logger.error('Failed to initialize Anthropic provider', { error });
      }
    } else {
      logger.warn('Anthropic API key not configured');
    }

    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (hfKey && hfKey !== 'your-huggingface-api-key') {
      try {
        this.providers.set('huggingface', new HuggingFaceProvider());
        logger.info('Hugging Face provider initialized');
      } catch (error) {
        logger.error('Failed to initialize Hugging Face provider', { error });
      }
    } else {
      logger.warn('Hugging Face API key not configured');
    }

    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      logger.warn('No AI providers available. Adding mock provider for development.');
      this.providers.set('mock', new MockAIProvider());
      logger.info('Mock AI provider initialized for development');
    } else {
      logger.info(`AI service initialized with providers: ${availableProviders.join(', ')}`);
    }
  }

  getProvider(name: string): AiProvider | undefined {
    return this.providers.get(name);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async generateText(
    prompt: string, 
    provider: string = 'openai', 
    options: GenerateOptions = {}
  ): Promise<AiResponse> {
    const aiProvider = this.getProvider(provider);
    if (!aiProvider) {
      throw new Error(`AI provider '${provider}' not available`);
    }

    logger.info('AI text generation request', { provider, prompt: prompt.substring(0, 100) });
    const response = await aiProvider.generateText(prompt, options);
    logger.info('AI text generation response', { provider, tokens: response.tokens });
    
    return response;
  }

  async generateChat(
    messages: ChatMessage[], 
    provider: string = 'openai', 
    options: GenerateOptions = {}
  ): Promise<AiResponse> {
    let aiProvider = this.getProvider(provider);
    
    // Fall back to any available provider if the requested one isn't available
    if (!aiProvider) {
      const availableProviders = this.getAvailableProviders();
      if (availableProviders.length > 0) {
        const fallbackProvider = availableProviders[0];
        logger.warn(`AI provider '${provider}' not available, using '${fallbackProvider}' instead`);
        aiProvider = this.getProvider(fallbackProvider);
        provider = fallbackProvider;
      } else {
        throw new Error(`No AI providers available. Please configure API keys.`);
      }
    }

    if (!aiProvider) {
      throw new Error(`AI provider '${provider}' not available`);
    }

    logger.info('AI chat generation request', { provider, messageCount: messages.length });
    const response = await aiProvider.generateChat(messages, options);
    logger.info('AI chat generation response', { provider, tokens: response.tokens });
    
    return response;
  }

  // Save conversation to database
  async saveConversation(
    userId: string,
    messages: ChatMessage[],
    title?: string,
    model?: string
  ): Promise<string> {
    try {
      const conversation = await db.aiConversation.create({
        data: {
          userId,
          title: title || 'New Conversation',
          model: model || 'gpt-3.5-turbo',
          messages: {
            create: messages.map(msg => ({
              role: msg.role.toUpperCase() as any,
              content: msg.content,
              model,
            })),
          },
        },
      });

      return conversation.id;
    } catch (error) {
      logger.error('Error saving conversation', { error });
      throw error;
    }
  }

  // Load conversation from database
  async loadConversation(conversationId: string): Promise<{
    id: string;
    title: string;
    messages: ChatMessage[];
  } | null> {
    try {
      const conversation = await db.aiConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        return null;
      }

      return {
        id: conversation.id,
        title: conversation.title || 'Untitled',
        messages: conversation.messages.map((msg: any) => ({
          role: msg.role.toLowerCase() as any,
          content: msg.content,
        })),
      };
    } catch (error) {
      logger.error('Error loading conversation', { error });
      throw error;
    }
  }

  // Get user conversations
  async getUserConversations(userId: string): Promise<Array<{
    id: string;
    title: string;
    createdAt: Date;
    messageCount: number;
  }>> {
    try {
      const conversations = await db.aiConversation.findMany({
        where: { userId },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title || 'Untitled',
        createdAt: conv.createdAt,
        messageCount: conv._count.messages,
      }));
    } catch (error) {
      logger.error('Error getting user conversations', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AiService();
