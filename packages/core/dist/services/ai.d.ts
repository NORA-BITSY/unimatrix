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
export declare class OpenAIProvider implements AiProvider {
    name: string;
    private client;
    constructor(apiKey?: string);
    generateText(prompt: string, options?: GenerateOptions): Promise<AiResponse>;
    generateChat(messages: ChatMessage[], options?: GenerateOptions): Promise<AiResponse>;
}
export declare class AnthropicProvider implements AiProvider {
    name: string;
    private client;
    constructor(apiKey?: string);
    generateText(prompt: string, options?: GenerateOptions): Promise<AiResponse>;
    generateChat(messages: ChatMessage[], options?: GenerateOptions): Promise<AiResponse>;
}
export declare class HuggingFaceProvider implements AiProvider {
    name: string;
    private client;
    constructor(apiKey?: string);
    generateText(prompt: string, options?: GenerateOptions): Promise<AiResponse>;
    generateChat(messages: ChatMessage[], options?: GenerateOptions): Promise<AiResponse>;
}
export declare class MockAIProvider implements AiProvider {
    name: string;
    generateText(prompt: string, options?: GenerateOptions): Promise<AiResponse>;
    generateChat(messages: ChatMessage[], options?: GenerateOptions): Promise<AiResponse>;
}
export declare class AiService {
    private providers;
    constructor();
    getProvider(name: string): AiProvider | undefined;
    getAvailableProviders(): string[];
    generateText(prompt: string, provider?: string, options?: GenerateOptions): Promise<AiResponse>;
    generateChat(messages: ChatMessage[], provider?: string, options?: GenerateOptions): Promise<AiResponse>;
    saveConversation(userId: string, messages: ChatMessage[], title?: string, model?: string): Promise<string>;
    loadConversation(conversationId: string): Promise<{
        id: string;
        title: string;
        messages: ChatMessage[];
    } | null>;
    getUserConversations(userId: string): Promise<Array<{
        id: string;
        title: string;
        createdAt: Date;
        messageCount: number;
    }>>;
}
export declare const aiService: AiService;
//# sourceMappingURL=ai.d.ts.map