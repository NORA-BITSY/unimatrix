/**
 * Application constants
 */
export declare const APP_CONSTANTS: {
    readonly NAME: "UniMatrix";
    readonly VERSION: "1.0.0";
    readonly DESCRIPTION: "Universal AI, Blockchain, IoT Platform";
    readonly AUTHOR: "UniMatrix Team";
    readonly DEFAULT_LOCALE: "en-US";
    readonly DEFAULT_TIMEZONE: "UTC";
};
/**
 * HTTP status codes
 */
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
/**
 * API configuration constants
 */
export declare const API_CONSTANTS: {
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly DEFAULT_API_VERSION: "v1";
    readonly RATE_LIMIT: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: 100;
    };
    readonly CORS: {
        readonly MAX_AGE: 86400;
        readonly CREDENTIALS: true;
    };
};
/**
 * Security constants
 */
export declare const SECURITY_CONSTANTS: {
    readonly JWT: {
        readonly ALGORITHM: "HS256";
        readonly EXPIRES_IN: "24h";
        readonly REFRESH_EXPIRES_IN: "7d";
        readonly ISSUER: "unimatrix";
    };
    readonly ENCRYPTION: {
        readonly ALGORITHM: "aes-256-gcm";
        readonly IV_LENGTH: 16;
        readonly SALT_LENGTH: 32;
        readonly TAG_LENGTH: 16;
        readonly KEY_ITERATIONS: 100000;
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly REQUIRE_UPPERCASE: true;
        readonly REQUIRE_LOWERCASE: true;
        readonly REQUIRE_NUMBER: true;
        readonly REQUIRE_SPECIAL: true;
        readonly BCRYPT_ROUNDS: 12;
    };
    readonly API_KEY: {
        readonly LENGTH: 32;
        readonly PREFIX: "umx_";
    };
};
/**
 * Database constants
 */
export declare const DATABASE_CONSTANTS: {
    readonly DEFAULT_POOL_SIZE: 10;
    readonly CONNECTION_TIMEOUT: 30000;
    readonly IDLE_TIMEOUT: 10000;
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY: 1000;
};
/**
 * Cache constants
 */
export declare const CACHE_CONSTANTS: {
    readonly DEFAULT_TTL: 3600;
    readonly SESSION_TTL: 86400;
    readonly REFRESH_TOKEN_TTL: 604800;
    readonly USER_CACHE_TTL: 300;
    readonly API_CACHE_TTL: 60;
};
/**
 * File upload constants
 */
export declare const UPLOAD_CONSTANTS: {
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_MIME_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "text/csv", "application/json"];
    readonly ALLOWED_EXTENSIONS: readonly [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt", ".csv", ".json"];
};
/**
 * WebSocket constants
 */
export declare const WEBSOCKET_CONSTANTS: {
    readonly HEARTBEAT_INTERVAL: 30000;
    readonly CONNECTION_TIMEOUT: 60000;
    readonly MAX_CONNECTIONS_PER_USER: 5;
    readonly EVENTS: {
        readonly CONNECTION: "connection";
        readonly DISCONNECT: "disconnect";
        readonly ERROR: "error";
        readonly HEARTBEAT: "heartbeat";
        readonly AUTH: "auth";
        readonly DATA: "data";
        readonly NOTIFICATION: "notification";
    };
};
/**
 * AI service constants
 */
export declare const AI_CONSTANTS: {
    readonly MODELS: {
        readonly OPENAI: {
            readonly GPT_4: "gpt-4";
            readonly GPT_4_TURBO: "gpt-4-turbo";
            readonly GPT_3_5_TURBO: "gpt-3.5-turbo";
        };
        readonly ANTHROPIC: {
            readonly CLAUDE_3_OPUS: "claude-3-opus-20240229";
            readonly CLAUDE_3_SONNET: "claude-3-sonnet-20240229";
            readonly CLAUDE_3_HAIKU: "claude-3-haiku-20240307";
        };
    };
    readonly DEFAULT_MAX_TOKENS: 4096;
    readonly DEFAULT_TEMPERATURE: 0.7;
    readonly TIMEOUT: 60000;
};
/**
 * Blockchain constants
 */
export declare const BLOCKCHAIN_CONSTANTS: {
    readonly NETWORKS: {
        readonly ETHEREUM: {
            readonly MAINNET: 1;
            readonly SEPOLIA: 11155111;
            readonly HOLESKY: 17000;
        };
        readonly POLYGON: {
            readonly MAINNET: 137;
            readonly MUMBAI: 80001;
        };
    };
    readonly GAS: {
        readonly DEFAULT_LIMIT: 21000;
        readonly DEFAULT_PRICE: 20000000000;
    };
    readonly CONFIRMATION_BLOCKS: 12;
};
/**
 * IoT constants
 */
export declare const IOT_CONSTANTS: {
    readonly MQTT: {
        readonly DEFAULT_PORT: 1883;
        readonly DEFAULT_SECURE_PORT: 8883;
        readonly QOS_LEVELS: {
            readonly AT_MOST_ONCE: 0;
            readonly AT_LEAST_ONCE: 1;
            readonly EXACTLY_ONCE: 2;
        };
        readonly KEEP_ALIVE: 60;
    };
    readonly DEVICE: {
        readonly MAX_OFFLINE_TIME: 300000;
        readonly HEARTBEAT_INTERVAL: 30000;
        readonly DATA_RETENTION_DAYS: 30;
    };
};
/**
 * Validation constants
 */
export declare const VALIDATION_CONSTANTS: {
    readonly EMAIL: {
        readonly MAX_LENGTH: 254;
        readonly REGEX: RegExp;
    };
    readonly USERNAME: {
        readonly MIN_LENGTH: 3;
        readonly MAX_LENGTH: 30;
        readonly REGEX: RegExp;
    };
    readonly PHONE: {
        readonly REGEX: RegExp;
    };
    readonly URL: {
        readonly REGEX: RegExp;
    };
};
/**
 * Error codes
 */
export declare const ERROR_CODES: {
    readonly AUTH_REQUIRED: "AUTH_REQUIRED";
    readonly AUTH_INVALID: "AUTH_INVALID";
    readonly AUTH_EXPIRED: "AUTH_EXPIRED";
    readonly AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS";
    readonly RESOURCE_CONFLICT: "RESOURCE_CONFLICT";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly EXTERNAL_SERVICE_UNAVAILABLE: "EXTERNAL_SERVICE_UNAVAILABLE";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly CACHE_ERROR: "CACHE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
};
/**
 * Supported languages for i18n
 */
export declare const SUPPORTED_LANGUAGES: readonly ["en-US", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-BR", "zh-CN", "ja-JP", "ko-KR", "ru-RU"];
/**
 * Time formats
 */
export declare const TIME_FORMATS: {
    readonly ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
    readonly DATE: "yyyy-MM-dd";
    readonly TIME: "HH:mm:ss";
    readonly DATETIME: "yyyy-MM-dd HH:mm:ss";
    readonly HUMAN_READABLE: "MMM dd, yyyy HH:mm";
};
//# sourceMappingURL=constants.d.ts.map