import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Server config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  
  // Security
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  CORS_ORIGINS: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  
  // Blockchain
  ETHEREUM_RPC_URL: z.string().url().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  BSC_RPC_URL: z.string().url().optional(),
  PRIVATE_KEY: z.string().optional(),
  
  // MQTT/IoT
  MQTT_URL: z.string().optional(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  
  // Analytics
  ANALYTICS_RETENTION_DAYS: z.string().default('30').transform(Number),
  
  // Monitoring
  ENABLE_METRICS: z.string().default('true').transform(v => v === 'true'),
  METRICS_PORT: z.string().default('9090').transform(Number),
});

// Parse and validate environment variables
function validateEnvironment() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Export validated config
export const config = validateEnvironment();

// Environment utilities
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Service availability checks
export const hasRedis = config.REDIS_HOST && config.REDIS_PORT;
export const hasOpenAI = !!config.OPENAI_API_KEY;
export const hasAnthropic = !!config.ANTHROPIC_API_KEY;
export const hasBlockchain = !!(config.ETHEREUM_RPC_URL || config.POLYGON_RPC_URL || config.BSC_RPC_URL);
export const hasMQTT = !!config.MQTT_URL;

// Default values for missing configs
export const defaults = {
  JWT_SECRET: isDevelopment 
    ? 'your-very-long-32-character-secret-key-for-development-only-change-this-in-production'
    : undefined,
  CORS_ORIGINS: isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080']
    : [],
};

export default config;
