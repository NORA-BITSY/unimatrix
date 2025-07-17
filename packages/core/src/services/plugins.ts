import { FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dependencies?: Record<string, string>;
  permissions: string[];
  hooks: string[];
  api?: {
    endpoints?: string[];
    middleware?: string[];
  };
  config?: Record<string, any>;
}

interface PluginInstance {
  id: string;
  manifest: PluginManifest;
  module: any;
  enabled: boolean;
  loadedAt: Date;
  error?: string;
}

interface PluginHook {
  name: string;
  handler: Function;
  priority: number;
  pluginId: string;
}

class PluginManager extends EventEmitter {
  private plugins: Map<string, PluginInstance> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();
  private pluginsDirectory: string;
  private fastifyInstance?: FastifyInstance;

  constructor(pluginsDirectory: string) {
    super();
    this.pluginsDirectory = pluginsDirectory;
    this.ensurePluginsDirectory();
  }

  // Initialize plugin manager with Fastify instance
  async initialize(fastify: FastifyInstance): Promise<void> {
    this.fastifyInstance = fastify;
    await this.loadAllPlugins();
  }

  // Load all plugins from the plugins directory
  async loadAllPlugins(): Promise<void> {
    try {
      const pluginDirs = await fs.promises.readdir(this.pluginsDirectory);
      
      for (const dir of pluginDirs) {
        const pluginPath = path.join(this.pluginsDirectory, dir);
        const stat = await fs.promises.stat(pluginPath);
        
        if (stat.isDirectory()) {
          await this.loadPlugin(dir);
        }
      }
      
      console.log(`[PluginManager] Loaded ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('[PluginManager] Error loading plugins:', error);
    }
  }

  // Load a specific plugin
  async loadPlugin(pluginName: string): Promise<boolean> {
    try {
      const pluginPath = path.join(this.pluginsDirectory, pluginName);
      const manifestPath = path.join(pluginPath, 'package.json');
      
      // Check if manifest exists
      if (!fs.existsSync(manifestPath)) {
        console.error(`[PluginManager] No package.json found for plugin: ${pluginName}`);
        return false;
      }

      // Load manifest
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf8');
      const manifest: PluginManifest = JSON.parse(manifestContent);
      
      // Validate manifest
      if (!this.validateManifest(manifest)) {
        console.error(`[PluginManager] Invalid manifest for plugin: ${pluginName}`);
        return false;
      }

      // Load plugin module
      const mainPath = path.join(pluginPath, manifest.main || 'index.js');
      if (!fs.existsSync(mainPath)) {
        console.error(`[PluginManager] Main file not found for plugin: ${pluginName}`);
        return false;
      }

      // Dynamic import of plugin module
      const module = await import(mainPath);
      
      // Create plugin instance
      const pluginInstance: PluginInstance = {
        id: pluginName,
        manifest,
        module,
        enabled: true,
        loadedAt: new Date()
      };

      // Initialize plugin if it has an init function
      if (typeof module.init === 'function') {
        await module.init({
          fastify: this.fastifyInstance,
          pluginManager: this,
          config: manifest.config || {}
        });
      }

      // Register plugin hooks
      this.registerPluginHooks(pluginName, module);

      // Register plugin API endpoints
      if (this.fastifyInstance && manifest.api?.endpoints) {
        await this.registerPluginEndpoints(pluginName, module);
      }

      this.plugins.set(pluginName, pluginInstance);
      this.emit('plugin:loaded', pluginInstance);
      
      console.log(`[PluginManager] Loaded plugin: ${pluginName} v${manifest.version}`);
      return true;
    } catch (error) {
      console.error(`[PluginManager] Error loading plugin ${pluginName}:`, error);
      
      const errorInstance: PluginInstance = {
        id: pluginName,
        manifest: { name: pluginName, version: '0.0.0', description: '', author: '', main: '', permissions: [], hooks: [] },
        module: null,
        enabled: false,
        loadedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.plugins.set(pluginName, errorInstance);
      return false;
    }
  }

  // Unload a plugin
  async unloadPlugin(pluginName: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    try {
      // Call plugin cleanup if available
      if (plugin.module && typeof plugin.module.cleanup === 'function') {
        await plugin.module.cleanup();
      }

      // Remove plugin hooks
      this.unregisterPluginHooks(pluginName);

      // Remove from plugins map
      this.plugins.delete(pluginName);
      
      this.emit('plugin:unloaded', plugin);
      console.log(`[PluginManager] Unloaded plugin: ${pluginName}`);
      return true;
    } catch (error) {
      console.error(`[PluginManager] Error unloading plugin ${pluginName}:`, error);
      return false;
    }
  }

  // Enable/disable a plugin
  async togglePlugin(pluginName: string, enabled: boolean): Promise<boolean> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    if (enabled && !plugin.enabled) {
      // Enable plugin
      if (plugin.module && typeof plugin.module.enable === 'function') {
        await plugin.module.enable();
      }
      this.registerPluginHooks(pluginName, plugin.module);
    } else if (!enabled && plugin.enabled) {
      // Disable plugin
      if (plugin.module && typeof plugin.module.disable === 'function') {
        await plugin.module.disable();
      }
      this.unregisterPluginHooks(pluginName);
    }

    plugin.enabled = enabled;
    this.emit('plugin:toggled', plugin);
    return true;
  }

  // Register plugin hooks
  private registerPluginHooks(pluginId: string, module: any): void {
    if (!module.hooks) return;

    Object.entries(module.hooks).forEach(([hookName, handler]: [string, any]) => {
      if (typeof handler === 'function') {
        this.registerHook(hookName, handler, 100, pluginId);
      }
    });
  }

  // Unregister plugin hooks
  private unregisterPluginHooks(pluginId: string): void {
    this.hooks.forEach((hookList, hookName) => {
      const filtered = hookList.filter(hook => hook.pluginId !== pluginId);
      if (filtered.length > 0) {
        this.hooks.set(hookName, filtered);
      } else {
        this.hooks.delete(hookName);
      }
    });
  }

  // Register plugin API endpoints
  private async registerPluginEndpoints(pluginId: string, module: any): Promise<void> {
    if (!this.fastifyInstance || !module.routes) return;

    try {
      // Register routes under /api/plugins/{pluginId}
      await this.fastifyInstance.register(async function (fastify) {
        if (typeof module.routes === 'function') {
          await module.routes(fastify);
        }
      }, { prefix: `/api/plugins/${pluginId}` });
      
      console.log(`[PluginManager] Registered API endpoints for plugin: ${pluginId}`);
    } catch (error) {
      console.error(`[PluginManager] Error registering endpoints for plugin ${pluginId}:`, error);
    }
  }

  // Register a hook
  registerHook(name: string, handler: Function, priority: number = 100, pluginId: string): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }

    const hook: PluginHook = {
      name,
      handler,
      priority,
      pluginId
    };

    const hooks = this.hooks.get(name)!;
    hooks.push(hook);
    hooks.sort((a, b) => a.priority - b.priority); // Lower priority number = higher priority
  }

  // Execute hooks
  async executeHook(name: string, ...args: any[]): Promise<any[]> {
    const hooks = this.hooks.get(name) || [];
    const results = [];

    for (const hook of hooks) {
      try {
        const result = await hook.handler(...args);
        results.push(result);
      } catch (error) {
        console.error(`[PluginManager] Error executing hook ${name} from plugin ${hook.pluginId}:`, error);
      }
    }

    return results;
  }

  // Get plugin information
  getPlugin(pluginName: string): PluginInstance | undefined {
    return this.plugins.get(pluginName);
  }

  // Get all plugins
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  // Get enabled plugins
  getEnabledPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  // Get plugin statistics
  getStats() {
    const plugins = this.getAllPlugins();
    const enabled = plugins.filter(p => p.enabled);
    const errors = plugins.filter(p => p.error);

    return {
      total: plugins.length,
      enabled: enabled.length,
      disabled: plugins.length - enabled.length,
      errors: errors.length,
      hooks: this.hooks.size,
      totalHookHandlers: Array.from(this.hooks.values()).reduce((sum, hooks) => sum + hooks.length, 0)
    };
  }

  // Validate plugin manifest
  private validateManifest(manifest: any): manifest is PluginManifest {
    return (
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string' &&
      typeof manifest.description === 'string' &&
      typeof manifest.author === 'string' &&
      Array.isArray(manifest.permissions) &&
      Array.isArray(manifest.hooks)
    );
  }

  // Ensure plugins directory exists
  private ensurePluginsDirectory(): void {
    if (!fs.existsSync(this.pluginsDirectory)) {
      fs.mkdirSync(this.pluginsDirectory, { recursive: true });
      console.log(`[PluginManager] Created plugins directory: ${this.pluginsDirectory}`);
    }
  }

  // Install a plugin from a package
  async installPlugin(packagePath: string): Promise<boolean> {
    // TODO: Implement plugin installation from npm package or zip file
    console.log(`[PluginManager] Plugin installation not yet implemented: ${packagePath}`);
    return false;
  }

  // Create a sample plugin
  async createSamplePlugin(): Promise<void> {
    const samplePluginDir = path.join(this.pluginsDirectory, 'sample-plugin');
    
    if (fs.existsSync(samplePluginDir)) {
      return; // Sample plugin already exists
    }

    await fs.promises.mkdir(samplePluginDir, { recursive: true });

    // Create package.json
    const manifest = {
      name: 'sample-plugin',
      version: '1.0.0',
      description: 'A sample UniMatrix plugin',
      author: 'UniMatrix Team',
      main: 'index.js',
      permissions: ['api:read', 'webhooks:send'],
      hooks: ['request:before', 'response:after'],
      api: {
        endpoints: ['/hello', '/info']
      },
      config: {
        greeting: 'Hello from Sample Plugin!'
      }
    };

    await fs.promises.writeFile(
      path.join(samplePluginDir, 'package.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Create index.js
    const pluginCode = `
// Sample UniMatrix Plugin
module.exports = {
  // Plugin initialization
  async init(context) {
    console.log('[SamplePlugin] Initializing with config:', context.config);
    this.config = context.config;
  },

  // Plugin hooks
  hooks: {
    'request:before': async (request) => {
      console.log('[SamplePlugin] Before request:', request.method, request.url);
      return { timestamp: new Date().toISOString() };
    },

    'response:after': async (request, reply) => {
      console.log('[SamplePlugin] After response:', reply.statusCode);
      return { processed: true };
    }
  },

  // Plugin API routes
  async routes(fastify) {
    fastify.get('/hello', async (request, reply) => {
      return {
        message: this.config.greeting,
        timestamp: new Date().toISOString(),
        plugin: 'sample-plugin'
      };
    });

    fastify.get('/info', async (request, reply) => {
      return {
        name: 'Sample Plugin',
        version: '1.0.0',
        status: 'active',
        uptime: process.uptime()
      };
    });
  },

  // Plugin enable/disable
  async enable() {
    console.log('[SamplePlugin] Plugin enabled');
  },

  async disable() {
    console.log('[SamplePlugin] Plugin disabled');
  },

  // Plugin cleanup
  async cleanup() {
    console.log('[SamplePlugin] Plugin cleanup');
  }
};
`;

    await fs.promises.writeFile(
      path.join(samplePluginDir, 'index.js'),
      pluginCode
    );

    console.log('[PluginManager] Created sample plugin');
  }
}

export const pluginManager = new PluginManager(
  path.join(process.cwd(), 'plugins')
);

export default PluginManager;
