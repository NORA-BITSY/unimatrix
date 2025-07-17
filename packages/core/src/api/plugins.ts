import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pluginManager } from '../services/plugins.js';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

// Validation schemas
const pluginToggleSchema = z.object({
  enabled: z.boolean(),
});

// Auth middleware placeholder (simplified for now)
async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ success: false, error: 'Unauthorized' });
  }
}

export async function pluginRoutes(fastify: FastifyInstance) {
  // Get all plugins
  fastify.get('/', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Plugins'],
      description: 'Get all plugins',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                plugins: { type: 'array' },
                stats: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const plugins = pluginManager.getAllPlugins().map(plugin => ({
        id: plugin.id,
        name: plugin.manifest.name,
        version: plugin.manifest.version,
        description: plugin.manifest.description,
        author: plugin.manifest.author,
        enabled: plugin.enabled,
        loadedAt: plugin.loadedAt,
        error: plugin.error,
        permissions: plugin.manifest.permissions,
        hooks: plugin.manifest.hooks,
        hasApi: !!plugin.manifest.api?.endpoints?.length
      }));

      const stats = pluginManager.getStats();
      
      reply.send({
        success: true,
        data: {
          plugins,
          stats
        }
      });
    } catch (error) {
      logger.error('Error getting plugins:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to get plugins',
          requestId: request.id
        }
      });
    }
  });

  // Get specific plugin
  fastify.get('/:pluginId', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Plugins'],
      description: 'Get specific plugin details',
      params: {
        type: 'object',
        properties: {
          pluginId: { type: 'string' }
        },
        required: ['pluginId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { pluginId } = request.params as { pluginId: string };
      const plugin = pluginManager.getPlugin(pluginId);
      
      if (!plugin) {
        reply.code(404).send({
          success: false,
          error: {
            type: 'NotFoundError',
            message: `Plugin not found: ${pluginId}`,
            requestId: request.id
          }
        });
        return;
      }

      reply.send({
        success: true,
        data: {
          id: plugin.id,
          manifest: plugin.manifest,
          enabled: plugin.enabled,
          loadedAt: plugin.loadedAt,
          error: plugin.error
        }
      });
    } catch (error) {
      logger.error('Error getting plugin:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to get plugin',
          requestId: request.id
        }
      });
    }
  });

  // Toggle plugin enabled/disabled
  fastify.put('/:pluginId/toggle', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Plugins'],
      description: 'Enable or disable a plugin',
      params: {
        type: 'object',
        properties: {
          pluginId: { type: 'string' }
        },
        required: ['pluginId']
      },
      body: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' }
        },
        required: ['enabled']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { pluginId } = request.params as { pluginId: string };
      const { enabled } = pluginToggleSchema.parse(request.body);
      
      const success = await pluginManager.togglePlugin(pluginId, enabled);
      
      if (!success) {
        reply.code(404).send({
          success: false,
          error: {
            type: 'NotFoundError',
            message: `Plugin not found: ${pluginId}`,
            requestId: request.id
          }
        });
        return;
      }

      reply.send({
        success: true,
        message: `Plugin ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      logger.error('Error toggling plugin:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to toggle plugin',
          requestId: request.id
        }
      });
    }
  });

  // Reload a plugin
  fastify.post('/:pluginId/reload', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Plugins'],
      description: 'Reload a plugin',
      params: {
        type: 'object',
        properties: {
          pluginId: { type: 'string' }
        },
        required: ['pluginId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { pluginId } = request.params as { pluginId: string };
      
      // Unload and reload the plugin
      await pluginManager.unloadPlugin(pluginId);
      const success = await pluginManager.loadPlugin(pluginId);
      
      if (!success) {
        reply.code(500).send({
          success: false,
          error: {
            type: 'InternalServerError',
            message: `Failed to reload plugin: ${pluginId}`,
            requestId: request.id
          }
        });
        return;
      }

      reply.send({
        success: true,
        message: 'Plugin reloaded successfully'
      });
    } catch (error) {
      logger.error('Error reloading plugin:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to reload plugin',
          requestId: request.id
        }
      });
    }
  });

  // Execute a plugin hook manually (for testing)
  fastify.post('/hooks/:hookName/execute', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Plugins'],
      description: 'Execute a plugin hook manually',
      params: {
        type: 'object',
        properties: {
          hookName: { type: 'string' }
        },
        required: ['hookName']
      },
      body: {
        type: 'object',
        properties: {
          args: { type: 'array' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { hookName } = request.params as { hookName: string };
      const { args = [] } = request.body as { args?: any[] };
      
      const results = await pluginManager.executeHook(hookName, ...args);
      
      reply.send({
        success: true,
        data: {
          hookName,
          results,
          executedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error executing hook:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to execute hook',
          requestId: request.id
        }
      });
    }
  });

  // Create sample plugin
  fastify.post('/samples/create', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Plugins'],
      description: 'Create a sample plugin for development',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await pluginManager.createSamplePlugin();
      
      // Load the sample plugin
      const loaded = await pluginManager.loadPlugin('sample-plugin');
      
      reply.send({
        success: true,
        message: `Sample plugin created and ${loaded ? 'loaded' : 'created but failed to load'}`
      });
    } catch (error) {
      logger.error('Error creating sample plugin:', error);
      reply.code(500).send({
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Failed to create sample plugin',
          requestId: request.id
        }
      });
    }
  });

  logger.info('Plugin API routes registered');
}
