/**
 * Application constants
 */
export const APP_CONSTANTS = {
    NAME: 'UniMatrix',
    VERSION: '1.0.0',
    DESCRIPTION: 'Universal AI, Blockchain, IoT Platform',
    AUTHOR: 'UniMatrix Team',
    DEFAULT_LOCALE: 'en-US',
    DEFAULT_TIMEZONE: 'UTC',
};
/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
/**
 * API configuration constants
 */
export const API_CONSTANTS = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_API_VERSION: 'v1',
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100,
    },
    CORS: {
        MAX_AGE: 86400, // 24 hours
        CREDENTIALS: true,
    },
};
/**
 * Security constants
 */
export const SECURITY_CONSTANTS = {
    JWT: {
        ALGORITHM: 'HS256',
        EXPIRES_IN: '24h',
        REFRESH_EXPIRES_IN: '7d',
        ISSUER: 'unimatrix',
    },
    ENCRYPTION: {
        ALGORITHM: 'aes-256-gcm',
        IV_LENGTH: 16,
        SALT_LENGTH: 32,
        TAG_LENGTH: 16,
        KEY_ITERATIONS: 100000,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL: true,
        BCRYPT_ROUNDS: 12,
    },
    API_KEY: {
        LENGTH: 32,
        PREFIX: 'umx_',
    },
};
/**
 * Database constants
 */
export const DATABASE_CONSTANTS = {
    DEFAULT_POOL_SIZE: 10,
    CONNECTION_TIMEOUT: 30000, // 30 seconds
    IDLE_TIMEOUT: 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
};
/**
 * Cache constants
 */
export const CACHE_CONSTANTS = {
    DEFAULT_TTL: 3600, // 1 hour
    SESSION_TTL: 86400, // 24 hours
    REFRESH_TOKEN_TTL: 604800, // 7 days
    USER_CACHE_TTL: 300, // 5 minutes
    API_CACHE_TTL: 60, // 1 minute
};
/**
 * File upload constants
 */
export const UPLOAD_CONSTANTS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_MIME_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/json',
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.csv', '.json'],
};
/**
 * WebSocket constants
 */
export const WEBSOCKET_CONSTANTS = {
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    CONNECTION_TIMEOUT: 60000, // 1 minute
    MAX_CONNECTIONS_PER_USER: 5,
    EVENTS: {
        CONNECTION: 'connection',
        DISCONNECT: 'disconnect',
        ERROR: 'error',
        HEARTBEAT: 'heartbeat',
        AUTH: 'auth',
        DATA: 'data',
        NOTIFICATION: 'notification',
    },
};
/**
 * AI service constants
 */
export const AI_CONSTANTS = {
    MODELS: {
        OPENAI: {
            GPT_4: 'gpt-4',
            GPT_4_TURBO: 'gpt-4-turbo',
            GPT_3_5_TURBO: 'gpt-3.5-turbo',
        },
        ANTHROPIC: {
            CLAUDE_3_OPUS: 'claude-3-opus-20240229',
            CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
            CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
        },
    },
    DEFAULT_MAX_TOKENS: 4096,
    DEFAULT_TEMPERATURE: 0.7,
    TIMEOUT: 60000, // 1 minute
};
/**
 * Blockchain constants
 */
export const BLOCKCHAIN_CONSTANTS = {
    NETWORKS: {
        ETHEREUM: {
            MAINNET: 1,
            SEPOLIA: 11155111,
            HOLESKY: 17000,
        },
        POLYGON: {
            MAINNET: 137,
            MUMBAI: 80001,
        },
    },
    GAS: {
        DEFAULT_LIMIT: 21000,
        DEFAULT_PRICE: 20000000000, // 20 gwei
    },
    CONFIRMATION_BLOCKS: 12,
};
/**
 * IoT constants
 */
export const IOT_CONSTANTS = {
    MQTT: {
        DEFAULT_PORT: 1883,
        DEFAULT_SECURE_PORT: 8883,
        QOS_LEVELS: {
            AT_MOST_ONCE: 0,
            AT_LEAST_ONCE: 1,
            EXACTLY_ONCE: 2,
        },
        KEEP_ALIVE: 60,
    },
    DEVICE: {
        MAX_OFFLINE_TIME: 300000, // 5 minutes
        HEARTBEAT_INTERVAL: 30000, // 30 seconds
        DATA_RETENTION_DAYS: 30,
    },
};
/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = {
    EMAIL: {
        MAX_LENGTH: 254,
        REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    USERNAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 30,
        REGEX: /^[a-zA-Z0-9_-]+$/,
    },
    PHONE: {
        REGEX: /^\+?[1-9]\d{1,14}$/,
    },
    URL: {
        REGEX: /^https?:\/\/.+/,
    },
};
/**
 * Error codes
 */
export const ERROR_CODES = {
    // Authentication & Authorization
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID: 'AUTH_INVALID',
    AUTH_EXPIRED: 'AUTH_EXPIRED',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
    // Validation
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    // Resources
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    // External Services
    EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    CACHE_ERROR: 'CACHE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
};
/**
 * Supported languages for i18n
 */
export const SUPPORTED_LANGUAGES = [
    'en-US',
    'es-ES',
    'fr-FR',
    'de-DE',
    'it-IT',
    'pt-BR',
    'zh-CN',
    'ja-JP',
    'ko-KR',
    'ru-RU',
];
/**
 * Time formats
 */
export const TIME_FORMATS = {
    ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX',
    DATE: 'yyyy-MM-dd',
    TIME: 'HH:mm:ss',
    DATETIME: 'yyyy-MM-dd HH:mm:ss',
    HUMAN_READABLE: 'MMM dd, yyyy HH:mm',
};
//# sourceMappingURL=constants.js.map