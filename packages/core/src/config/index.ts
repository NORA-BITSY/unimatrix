import 'dotenv/config';

export interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  isDevelopment: () => boolean;
  isProduction: () => boolean;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origins: string[];
  };
  rateLimit: {
    max: number;
    timeWindow: string;
  };
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
}

export const config: Config = {
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
