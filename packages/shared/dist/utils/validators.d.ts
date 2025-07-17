import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const ethereumAddressSchema: z.ZodString;
export declare const apiKeySchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export declare const aiModelSchema: z.ZodObject<{
    provider: z.ZodEnum<["openai", "anthropic", "huggingface"]>;
    model: z.ZodString;
    temperature: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    provider: "openai" | "anthropic" | "huggingface";
    model: string;
    temperature: number;
    maxTokens?: number | undefined;
}, {
    provider: "openai" | "anthropic" | "huggingface";
    model: string;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
}>;
export declare const blockchainNetworkSchema: z.ZodObject<{
    chainId: z.ZodNumber;
    name: z.ZodString;
    rpcUrl: z.ZodString;
    explorerUrl: z.ZodOptional<z.ZodString>;
    nativeCurrency: z.ZodObject<{
        name: z.ZodString;
        symbol: z.ZodString;
        decimals: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        name: string;
        decimals: number;
    }, {
        symbol: string;
        name: string;
        decimals: number;
    }>;
}, "strip", z.ZodTypeAny, {
    chainId: number;
    name: string;
    rpcUrl: string;
    nativeCurrency: {
        symbol: string;
        name: string;
        decimals: number;
    };
    explorerUrl?: string | undefined;
}, {
    chainId: number;
    name: string;
    rpcUrl: string;
    nativeCurrency: {
        symbol: string;
        name: string;
        decimals: number;
    };
    explorerUrl?: string | undefined;
}>;
export declare const iotDeviceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["sensor", "actuator", "gateway", "controller"]>;
    status: z.ZodDefault<z.ZodEnum<["online", "offline", "error"]>>;
    ipAddress: z.ZodOptional<z.ZodString>;
    macAddress: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "sensor" | "actuator" | "gateway" | "controller";
    status: "online" | "offline" | "error";
    name: string;
    id: string;
    ipAddress?: string | undefined;
    macAddress?: string | undefined;
}, {
    type: "sensor" | "actuator" | "gateway" | "controller";
    name: string;
    id: string;
    status?: "online" | "offline" | "error" | undefined;
    ipAddress?: string | undefined;
    macAddress?: string | undefined;
}>;
export declare const pluginSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    category: z.ZodEnum<["ai", "blockchain", "iot", "monitoring", "utility"]>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    category: "ai" | "blockchain" | "iot" | "monitoring" | "utility";
    name: string;
    version: string;
    enabled: boolean;
    config?: Record<string, any> | undefined;
}, {
    category: "ai" | "blockchain" | "iot" | "monitoring" | "utility";
    name: string;
    version: string;
    enabled?: boolean | undefined;
    config?: Record<string, any> | undefined;
}>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["admin", "user", "viewer"]>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    email: string;
    role: "admin" | "user" | "viewer";
    isActive: boolean;
}, {
    name: string;
    id: string;
    email: string;
    role?: "admin" | "user" | "viewer" | undefined;
    isActive?: boolean | undefined;
}>;
export declare class ValidationUtil {
    static validateEmail(email: string): boolean;
    static validatePassword(password: string): boolean;
    static validateEthereumAddress(address: string): boolean;
    static sanitizeInput(input: string): string;
    static validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T;
}
//# sourceMappingURL=validators.d.ts.map