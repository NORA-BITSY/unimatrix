import { z } from 'zod';
const configSchema = z.object({
    port: z.number().default(3000),
    env: z.enum(['development', 'production', 'test']).default('development'),
    cors: z.object({
        origin: z.array(z.string()).default(['http://localhost:3000', 'http://localhost:5173']),
        credentials: z.boolean().default(true),
    }),
    security: z.object({
        jwtSecret: z.string().min(32),
        encryptionKey: z.string().min(32),
        bcryptRounds: z.number().default(12),
    }),
    database: z.object({
        host: z.string().default('localhost'),
        port: z.number().default(5432),
        database: z.string().default('unimatrix'),
        username: z.string().default('postgres'),
        password: z.string(),
        ssl: z.boolean().default(false),
        pool: z.object({
            min: z.number().default(2),
            max: z.number().default(10),
        }).optional(),
    }),
    redis: z.object({
        host: z.string().default('localhost'),
        port: z.number().default(6379),
        password: z.string().optional(),
        db: z.number().default(0),
    }),
    ai: z.object({
        openai: z.object({
            apiKey: z.string(),
            organization: z.string().optional(),
        }).optional(),
        anthropic: z.object({
            apiKey: z.string(),
        }).optional(),
        huggingface: z.object({
            apiKey: z.string(),
        }).optional(),
    }),
    blockchain: z.object({
        ethereum: z.object({
            rpcUrl: z.string().url(),
            privateKey: z.string().optional(),
        }).optional(),
        polygon: z.object({
            rpcUrl: z.string().url(),
            privateKey: z.string().optional(),
        }).optional(),
    }),
    mqtt: z.object({
        url: z.string(),
        username: z.string().optional(),
        password: z.string().optional(),
        clientId: z.string().optional(),
        keepalive: z.number().default(60),
    }),
});
export class Config {
    static instance;
    config;
    constructor() {
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    loadConfig() {
        const rawConfig = {
            port: Number(process.env.PORT) || 3000,
            env: process.env.NODE_ENV || 'development',
            cors: {
                origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
                credentials: process.env.CORS_CREDENTIALS === 'true',
            },
            security: {
                jwtSecret: process.env.JWT_SECRET || '',
                encryptionKey: process.env.ENCRYPTION_KEY || '',
                bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
            },
            database: {
                host: process.env.DATABASE_HOST || 'localhost',
                port: Number(process.env.DATABASE_PORT) || 5432,
                database: process.env.DATABASE_NAME || 'unimatrix',
                username: process.env.DATABASE_USER || 'postgres',
                password: process.env.DATABASE_PASSWORD || '',
                ssl: process.env.DATABASE_SSL === 'true',
                pool: {
                    min: Number(process.env.DATABASE_POOL_MIN) || 2,
                    max: Number(process.env.DATABASE_POOL_MAX) || 10,
                },
            },
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD,
                db: Number(process.env.REDIS_DB) || 0,
            },
            ai: {
                ...(process.env.OPENAI_API_KEY && {
                    openai: {
                        apiKey: process.env.OPENAI_API_KEY,
                        organization: process.env.OPENAI_ORGANIZATION,
                    },
                }),
                ...(process.env.ANTHROPIC_API_KEY && {
                    anthropic: {
                        apiKey: process.env.ANTHROPIC_API_KEY,
                    },
                }),
                ...(process.env.HUGGINGFACE_API_KEY && {
                    huggingface: {
                        apiKey: process.env.HUGGINGFACE_API_KEY,
                    },
                }),
            },
            blockchain: {
                ...(process.env.ETHEREUM_RPC_URL && {
                    ethereum: {
                        rpcUrl: process.env.ETHEREUM_RPC_URL,
                        privateKey: process.env.ETHEREUM_PRIVATE_KEY,
                    },
                }),
                ...(process.env.POLYGON_RPC_URL && {
                    polygon: {
                        rpcUrl: process.env.POLYGON_RPC_URL,
                        privateKey: process.env.POLYGON_PRIVATE_KEY,
                    },
                }),
            },
            mqtt: {
                url: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
                username: process.env.MQTT_USERNAME,
                password: process.env.MQTT_PASSWORD,
                clientId: process.env.MQTT_CLIENT_ID,
                keepalive: Number(process.env.MQTT_KEEPALIVE) || 60,
            },
        };
        return configSchema.parse(rawConfig);
    }
    get(key) {
        return this.config[key];
    }
    getAll() {
        return { ...this.config };
    }
    isDevelopment() {
        return this.config.env === 'development';
    }
    isProduction() {
        return this.config.env === 'production';
    }
    isTest() {
        return this.config.env === 'test';
    }
}
// Export singleton instance
export const config = Config.getInstance();
//# sourceMappingURL=index.js.map