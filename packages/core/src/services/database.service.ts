import { logger } from '@matrix/shared';
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './database.js';

export class DatabaseService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Database service already initialized');
      return;
    }

    try {
      await connectDatabase();
      this.isInitialized = true;
      logger.info('Database service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database service', { error });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await disconnectDatabase();
      this.isInitialized = false;
      logger.info('Database service disconnected');
    } catch (error) {
      logger.error('Error disconnecting database service', { error });
      throw error;
    }
  }

  static async healthCheck(): Promise<boolean> {
    return checkDatabaseHealth();
  }

  static get initialized(): boolean {
    return this.isInitialized;
  }
}
