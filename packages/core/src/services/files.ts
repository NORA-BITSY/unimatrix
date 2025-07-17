import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from './database.js';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
  userId: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface FileUploadOptions {
  userId: string;
  folder?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface FileSearchOptions {
  userId?: string;
  folder?: string;
  tags?: string[];
  mimeType?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'size' | 'date';
  sortOrder?: 'asc' | 'desc';
}

class FileService extends EventEmitter {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    super();
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    this.allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'application/xml',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed'
    ];

    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'documents'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'archives'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'temp'), { recursive: true });
      
      logger.info('File service directories initialized');
    } catch (error) {
      logger.error('Failed to initialize file directories:', error);
    }
  }

  // Upload a file
  async uploadFile(buffer: Buffer, originalName: string, options: FileUploadOptions): Promise<FileMetadata> {
    try {
      // Validate file size
      if (options.maxSize && buffer.length > options.maxSize) {
        throw new Error(`File size exceeds limit of ${options.maxSize} bytes`);
      }
      
      if (buffer.length > this.maxFileSize) {
        throw new Error(`File size exceeds system limit of ${this.maxFileSize} bytes`);
      }

      // Detect MIME type from buffer
      const mimeType = this.detectMimeType(buffer, originalName);
      
      // Validate file type
      if (options.allowedTypes && !options.allowedTypes.includes(mimeType)) {
        throw new Error(`File type ${mimeType} is not allowed`);
      }
      
      if (!this.allowedTypes.includes(mimeType)) {
        throw new Error(`File type ${mimeType} is not allowed by system`);
      }

      // Generate unique filename
      const fileId = crypto.randomUUID();
      const extension = path.extname(originalName);
      const filename = `${fileId}${extension}`;
      
      // Determine folder based on MIME type or user preference
      const folder = options.folder || this.getFolderForMimeType(mimeType);
      const filePath = path.join(this.uploadDir, folder, filename);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write file to disk
      await fs.writeFile(filePath, buffer);
      
      // Generate URL (would be configurable for different storage backends)
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const fileUrl = `${baseUrl}/files/${folder}/${filename}`;
      
      // Save metadata to database
      const fileRecord = await db.fileUpload.create({
        data: {
          id: fileId,
          filename,
          originalName,
          mimeType,
          size: buffer.length,
          path: filePath,
          url: fileUrl,
          userId: options.userId,
          folder,
          tags: JSON.stringify(options.tags || []),
          metadata: JSON.stringify(options.metadata || {})
        }
      });

      const fileMetadata: FileMetadata = {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        path: fileRecord.path,
        url: fileRecord.url,
        uploadedAt: fileRecord.uploadedAt,
        userId: fileRecord.userId,
        tags: options.tags,
        metadata: options.metadata
      };

      this.emit('fileUploaded', fileMetadata);
      logger.info(`File uploaded: ${originalName} (${fileId})`);
      
      return fileMetadata;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw error;
    }
  }

  // Get file metadata by ID
  async getFile(fileId: string, userId?: string): Promise<FileMetadata | null> {
    try {
      const whereClause: any = { id: fileId };
      if (userId) {
        whereClause.userId = userId;
      }

      const fileRecord = await db.fileUpload.findUnique({
        where: whereClause
      });

      if (!fileRecord) {
        return null;
      }

      return {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        path: fileRecord.path,
        url: fileRecord.url,
        uploadedAt: fileRecord.uploadedAt,
        userId: fileRecord.userId,
        tags: fileRecord.tags ? JSON.parse(fileRecord.tags) : [],
        metadata: fileRecord.metadata ? JSON.parse(fileRecord.metadata) : {}
      };
    } catch (error) {
      logger.error('Error getting file:', error);
      throw error;
    }
  }

  // Get file content as buffer
  async getFileContent(fileId: string, userId?: string): Promise<Buffer | null> {
    try {
      const file = await this.getFile(fileId, userId);
      if (!file) {
        return null;
      }

      const buffer = await fs.readFile(file.path);
      return buffer;
    } catch (error) {
      logger.error('Error reading file content:', error);
      throw error;
    }
  }

  // Search files
  async searchFiles(options: FileSearchOptions = {}): Promise<{
    files: FileMetadata[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const page = Math.floor(offset / limit) + 1;

      const whereClause: any = {};
      
      if (options.userId) {
        whereClause.userId = options.userId;
      }
      
      if (options.folder) {
        whereClause.folder = options.folder;
      }
      
      if (options.mimeType) {
        whereClause.mimeType = options.mimeType;
      }

      const orderBy: any = {};
      switch (options.sortBy) {
        case 'name':
          orderBy.originalName = options.sortOrder || 'asc';
          break;
        case 'size':
          orderBy.size = options.sortOrder || 'desc';
          break;
        case 'date':
        default:
          orderBy.uploadedAt = options.sortOrder || 'desc';
          break;
      }

      const [files, total] = await Promise.all([
        db.fileUpload.findMany({
          where: whereClause,
          orderBy,
          take: limit,
          skip: offset
        }),
        db.fileUpload.count({ where: whereClause })
      ]);

      const fileMetadata: FileMetadata[] = files.map((file: any) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        url: file.url,
        uploadedAt: file.uploadedAt,
        userId: file.userId,
        tags: file.tags ? JSON.parse(file.tags) : [],
        metadata: file.metadata ? JSON.parse(file.metadata) : {}
      }));

      return {
        files: fileMetadata,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('Error searching files:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileId: string, userId?: string): Promise<boolean> {
    try {
      const file = await this.getFile(fileId, userId);
      if (!file) {
        return false;
      }

      // Delete from disk
      try {
        await fs.unlink(file.path);
      } catch (fsError) {
        logger.warn(`Could not delete file from disk: ${file.path}`, fsError);
      }

      // Delete from database
      await db.fileUpload.delete({
        where: { id: fileId }
      });

      this.emit('fileDeleted', file);
      logger.info(`File deleted: ${file.originalName} (${fileId})`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  // Update file metadata
  async updateFileMetadata(fileId: string, updates: {
    tags?: string[];
    metadata?: Record<string, any>;
  }, userId?: string): Promise<FileMetadata | null> {
    try {
      const whereClause: any = { id: fileId };
      if (userId) {
        whereClause.userId = userId;
      }

      const updateData: any = {};
      if (updates.tags !== undefined) {
        updateData.tags = JSON.stringify(updates.tags);
      }
      if (updates.metadata !== undefined) {
        updateData.metadata = JSON.stringify(updates.metadata);
      }

      const updatedFile = await db.fileUpload.update({
        where: whereClause,
        data: updateData
      });

      const fileMetadata: FileMetadata = {
        id: updatedFile.id,
        filename: updatedFile.filename,
        originalName: updatedFile.originalName,
        mimeType: updatedFile.mimeType,
        size: updatedFile.size,
        path: updatedFile.path,
        url: updatedFile.url,
        uploadedAt: updatedFile.uploadedAt,
        userId: updatedFile.userId,
        tags: updatedFile.tags ? JSON.parse(updatedFile.tags) : [],
        metadata: updatedFile.metadata ? JSON.parse(updatedFile.metadata) : {}
      };

      this.emit('fileUpdated', fileMetadata);
      return fileMetadata;
    } catch (error) {
      logger.error('Error updating file metadata:', error);
      throw error;
    }
  }

  // Get storage statistics
  async getStorageStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byMimeType: Record<string, { count: number; size: number }>;
    byFolder: Record<string, { count: number; size: number }>;
  }> {
    try {
      const whereClause = userId ? { userId } : {};
      
      const files = await db.fileUpload.findMany({
        where: whereClause,
        select: {
          mimeType: true,
          size: true,
          folder: true
        }
      });

      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum: number, file: any) => sum + file.size, 0),
        byMimeType: {} as Record<string, { count: number; size: number }>,
        byFolder: {} as Record<string, { count: number; size: number }>
      };

      files.forEach((file: any) => {
        // By MIME type
        if (!stats.byMimeType[file.mimeType]) {
          stats.byMimeType[file.mimeType] = { count: 0, size: 0 };
        }
        stats.byMimeType[file.mimeType].count++;
        stats.byMimeType[file.mimeType].size += file.size;

        // By folder
        const folder = file.folder || 'root';
        if (!stats.byFolder[folder]) {
          stats.byFolder[folder] = { count: 0, size: 0 };
        }
        stats.byFolder[folder].count++;
        stats.byFolder[folder].size += file.size;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting storage stats:', error);
      throw error;
    }
  }

  // Clean up temporary files older than specified hours
  async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      const tempFiles = await db.fileUpload.findMany({
        where: {
          folder: 'temp',
          uploadedAt: {
            lt: cutoffDate
          }
        }
      });

      let cleanedCount = 0;
      for (const file of tempFiles) {
        const deleted = await this.deleteFile(file.id);
        if (deleted) cleanedCount++;
      }

      logger.info(`Cleaned up ${cleanedCount} temporary files`);
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
      throw error;
    }
  }

  // Helper methods
  private detectMimeType(buffer: Buffer, filename: string): string {
    // Simple MIME type detection based on file signature and extension
    const ext = path.extname(filename).toLowerCase();
    
    // Check file signatures (magic numbers)
    if (buffer.length >= 4) {
      const signature = buffer.subarray(0, 4);
      
      // JPEG
      if (signature[0] === 0xFF && signature[1] === 0xD8) {
        return 'image/jpeg';
      }
      
      // PNG
      if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
        return 'image/png';
      }
      
      // PDF
      if (signature.toString('ascii', 0, 4) === '%PDF') {
        return 'application/pdf';
      }
      
      // ZIP
      if (signature[0] === 0x50 && signature[1] === 0x4B) {
        return 'application/zip';
      }
    }

    // Fallback to extension-based detection
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
      '.zip': 'application/zip'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getFolderForMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'images';
    } else if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
      return 'archives';
    } else {
      return 'documents';
    }
  }
}

export const fileService = new FileService();
