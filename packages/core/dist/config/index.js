import 'dotenv/config';
function getEnv(key, defaultValue) {
    const value = process.env[key];
    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is required`);
    }
    return value || defaultValue;
}
function getEnvNumber(key, defaultValue) {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required`);
    }
    return value ? parseInt(value, 10) : defaultValue;
}
export const config = {
    port: getEnvNumber('PORT', 3001),
    host: getEnv('HOST', 'localhost'),
    nodeEnv: getEnv('NODE_ENV', 'development'),
    isDevelopment: () => config.nodeEnv === 'development',
    isProduction: () => config.nodeEnv === 'production',
    database: {
        url: getEnv('DATABASE_URL', 'postgresql://localhost:5432/unimatrix'),
    },
    redis: {
        host: getEnv('REDIS_HOST', 'localhost'),
        port: getEnvNumber('REDIS_PORT', 6379),
        password: process.env.REDIS_PASSWORD,
        db: getEnvNumber('REDIS_DB', 0),
    },
    jwt: {
        secret: getEnv('JWT_SECRET', 'your-secret-key-change-in-production'),
        expiresIn: getEnv('JWT_EXPIRES_IN', '15m'),
        refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    },
    cors: {
        origins: getEnv('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
    },
    rateLimit: {
        max: getEnvNumber('RATE_LIMIT_MAX', 100),
        timeWindow: getEnv('RATE_LIMIT_WINDOW', '1 minute'),
    },
};
//# sourceMappingURL=index.js.map