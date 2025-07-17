import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { fileService } from '../services/files.js';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

// Authentication middleware function  
const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
};

// Request schemas
const FileIdSchema = z.object({
  fileId: z.string().uuid()
});

const UploadFileSchema = z.object({
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  maxSize: z.number().int().positive().optional(),
  allowedTypes: z.array(z.string()).optional()
});

const SearchFilesSchema = z.object({
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mimeType: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['name', 'size', 'date']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const UpdateFileMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

interface AuthenticatedRequest extends FastifyRequest {
  user: any;
}

export async function fileRoutes(fastify: FastifyInstance) {
  // Authentication middleware
  fastify.addHook('preHandler', authenticate);

  // Upload file
  fastify.post('/upload', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      const buffer = await data.toBuffer();
      const options = UploadFileSchema.parse(request.query);
      
      const fileMetadata = await fileService.uploadFile(buffer, data.filename, {
        userId: request.user.id,
        ...options
      });

      reply.send({
        success: true,
        data: fileMetadata,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      logger.error('Error uploading file:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }
      
      reply.status(500).send({
        success: false,
        error: 'Failed to upload file'
      });
    }
  });

  // Get file metadata
  fastify.get('/:fileId/metadata', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { fileId } = FileIdSchema.parse(request.params);
      
      const file = await fileService.getFile(fileId, request.user.id);
      
      if (!file) {
        return reply.status(404).send({
          success: false,
          error: 'File not found'
        });
      }

      reply.send({
        success: true,
        data: file
      });
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get file metadata'
      });
    }
  });

  // Download file
  fastify.get('/:fileId/download', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { fileId } = FileIdSchema.parse(request.params);
      
      const file = await fileService.getFile(fileId, request.user.id);
      
      if (!file) {
        return reply.status(404).send({
          success: false,
          error: 'File not found'
        });
      }

      const content = await fileService.getFileContent(fileId, request.user.id);
      
      if (!content) {
        return reply.status(404).send({
          success: false,
          error: 'File content not found'
        });
      }

      reply
        .header('Content-Type', file.mimeType)
        .header('Content-Disposition', `attachment; filename="${file.originalName}"`)
        .header('Content-Length', file.size.toString())
        .send(content);
    } catch (error) {
      logger.error('Error downloading file:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to download file'
      });
    }
  });

  // Stream file (for viewing in browser)
  fastify.get('/:fileId/stream', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { fileId } = FileIdSchema.parse(request.params);
      
      const file = await fileService.getFile(fileId, request.user.id);
      
      if (!file) {
        return reply.status(404).send({
          success: false,
          error: 'File not found'
        });
      }

      const content = await fileService.getFileContent(fileId, request.user.id);
      
      if (!content) {
        return reply.status(404).send({
          success: false,
          error: 'File content not found'
        });
      }

      reply
        .header('Content-Type', file.mimeType)
        .header('Content-Length', file.size.toString())
        .send(content);
    } catch (error) {
      logger.error('Error streaming file:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to stream file'
      });
    }
  });

  // Search files
  fastify.get('/search', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const searchOptions = SearchFilesSchema.parse(request.query);
      
      const results = await fileService.searchFiles({
        userId: request.user.id,
        ...searchOptions
      });

      reply.send({
        success: true,
        data: results.files,
        pagination: {
          page: results.page,
          limit: results.limit,
          total: results.total,
          pages: Math.ceil(results.total / results.limit)
        }
      });
    } catch (error) {
      logger.error('Error searching files:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to search files'
      });
    }
  });

  // Get all files for user
  fastify.get('/', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const searchOptions = SearchFilesSchema.parse(request.query);
      
      const results = await fileService.searchFiles({
        userId: request.user.id,
        ...searchOptions
      });

      reply.send({
        success: true,
        data: results.files,
        pagination: {
          page: results.page,
          limit: results.limit,
          total: results.total,
          pages: Math.ceil(results.total / results.limit)
        }
      });
    } catch (error) {
      logger.error('Error getting user files:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get files'
      });
    }
  });

  // Update file metadata
  fastify.put('/:fileId/metadata', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { fileId } = FileIdSchema.parse(request.params);
      const updates = UpdateFileMetadataSchema.parse(request.body);
      
      const updatedFile = await fileService.updateFileMetadata(fileId, updates, request.user.id);
      
      if (!updatedFile) {
        return reply.status(404).send({
          success: false,
          error: 'File not found'
        });
      }

      reply.send({
        success: true,
        data: updatedFile,
        message: 'File metadata updated successfully'
      });
    } catch (error) {
      logger.error('Error updating file metadata:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update file metadata'
      });
    }
  });

  // Delete file
  fastify.delete('/:fileId', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const { fileId } = FileIdSchema.parse(request.params);
      
      const deleted = await fileService.deleteFile(fileId, request.user.id);
      
      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: 'File not found'
        });
      }

      reply.send({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting file:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to delete file'
      });
    }
  });

  // Get storage statistics
  fastify.get('/stats', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const stats = await fileService.getStorageStats(request.user.id);

      reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting storage stats:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get storage statistics'
      });
    }
  });

  // Clean up temporary files (admin only)
  fastify.post('/cleanup-temp', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      // Check if user has admin role (you might want to implement role checking)
      if (request.user.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: 'Admin access required'
        });
      }

      const { hours = 24 } = request.body as { hours?: number };
      
      const cleanedCount = await fileService.cleanupTempFiles(hours);

      reply.send({
        success: true,
        data: { cleanedFiles: cleanedCount },
        message: `Cleaned up ${cleanedCount} temporary files`
      });
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to clean up temporary files'
      });
    }
  });

  logger.info('File management API routes registered');
}
