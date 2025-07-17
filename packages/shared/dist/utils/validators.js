import { z } from 'zod';
// Email validation
export const emailSchema = z.string().email();
// Password validation
export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
// Ethereum address validation
export const ethereumAddressSchema = z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');
// API key validation
export const apiKeySchema = z.string()
    .min(32, 'API key must be at least 32 characters');
// Pagination validation
export const paginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
});
// AI model validation
export const aiModelSchema = z.object({
    provider: z.enum(['openai', 'anthropic', 'huggingface']),
    model: z.string().min(1),
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().int().min(1).max(100000).optional(),
});
// Blockchain network validation
export const blockchainNetworkSchema = z.object({
    chainId: z.number().int().min(1),
    name: z.string().min(1),
    rpcUrl: z.string().url(),
    explorerUrl: z.string().url().optional(),
    nativeCurrency: z.object({
        name: z.string(),
        symbol: z.string(),
        decimals: z.number().int().min(0).max(18),
    }),
});
// IoT device validation
export const iotDeviceSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: z.enum(['sensor', 'actuator', 'gateway', 'controller']),
    status: z.enum(['online', 'offline', 'error']).default('offline'),
    ipAddress: z.string().ip().optional(),
    macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
});
// Plugin validation
export const pluginSchema = z.object({
    name: z.string().min(1).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    category: z.enum(['ai', 'blockchain', 'iot', 'monitoring', 'utility']),
    enabled: z.boolean().default(true),
    config: z.record(z.any()).optional(),
});
// User validation
export const userSchema = z.object({
    id: z.string().uuid(),
    email: emailSchema,
    name: z.string().min(1).max(100),
    role: z.enum(['admin', 'user', 'viewer']).default('user'),
    isActive: z.boolean().default(true),
});
export class ValidationUtil {
    static validateEmail(email) {
        try {
            emailSchema.parse(email);
            return true;
        }
        catch {
            return false;
        }
    }
    static validatePassword(password) {
        try {
            passwordSchema.parse(password);
            return true;
        }
        catch {
            return false;
        }
    }
    static validateEthereumAddress(address) {
        try {
            ethereumAddressSchema.parse(address);
            return true;
        }
        catch {
            return false;
        }
    }
    static sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .slice(0, 1000); // Limit length
    }
    static validateAndSanitize(schema, data) {
        const sanitized = typeof data === 'string' ? this.sanitizeInput(data) : data;
        return schema.parse(sanitized);
    }
}
//# sourceMappingURL=validators.js.map