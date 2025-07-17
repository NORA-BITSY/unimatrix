import { PrismaClient } from '@prisma/client';
import { logger } from '@matrix/shared';

// Global Prisma instance
let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'info', emit: 'event' },
    ],
    errorFormat: 'pretty',
  });

  // Log queries in development
  if (process.env.NODE_ENV !== 'production') {
    client.$on('query', (e: any) => {
      logger.debug('Prisma Query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }

  // Log errors
  client.$on('error', (e: any) => {
    logger.error('Prisma Error', { error: e });
  });

  // Log warnings
  client.$on('warn', (e: any) => {
    logger.warn('Prisma Warning', { message: e.message });
  });

  // Log info
  client.$on('info', (e: any) => {
    logger.info('Prisma Info', { message: e.message });
  });

  return client;
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    if (process.env.NODE_ENV === 'production') {
      prisma = createPrismaClient();
    } else {
      // In development, use a global variable to preserve the connection
      // across hot reloads
      if (!global.__prisma) {
        global.__prisma = createPrismaClient();
      }
      prisma = global.__prisma;
    }
  }
  return prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Database connected successfully');
    
    // Test the connection
    await client.$queryRaw`SELECT 1`;
    logger.info('Database connection test passed');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from database', { error });
    throw error;
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

// Export the database instance
export const db = getPrismaClient();
