// Hello World Plugin - Demonstrates basic plugin functionality
export default {
  name: 'hello-world',
  version: '1.0.0',
  description: 'A simple hello world plugin',
  
  // Plugin initialization
  async initialize(server, options = {}) {
    console.log('🔌 Hello World Plugin initialized!');
    
    // Register a new API endpoint
    server.get('/api/v1/plugins/hello', async (request, reply) => {
      return {
        message: 'Hello from the Hello World plugin!',
        timestamp: new Date().toISOString(),
        plugin: 'hello-world',
        version: '1.0.0'
      };
    });
    
    console.log('✅ Hello World Plugin routes registered');
    return true;
  },

  // Hook handlers
  hooks: {
    // Execute before each request
    async beforeRequest(request, reply, options) {
      const { url, method } = request;
      
      // Add custom header to all responses
      reply.header('X-Hello-Plugin', 'active');
      
      // Log request (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔌 [Hello Plugin] ${method} ${url}`);
      }
    },

    // Execute after each response
    async afterResponse(request, reply, payload) {
      // Could modify response payload here
      return payload;
    }
  },

  // Plugin configuration schema
  configSchema: {
    type: 'object',
    properties: {
      greeting: {
        type: 'string',
        default: 'Hello'
      },
      enabled: {
        type: 'boolean',
        default: true
      }
    }
  },

  // Plugin cleanup
  async destroy() {
    console.log('🔌 Hello World Plugin destroyed');
    return true;
  }
};
