import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

// Simple auth middleware
async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ success: false, error: 'Unauthorized' });
  }
}

// Validation schemas
const deviceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['sensor', 'actuator', 'gateway', 'controller']),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
  ipAddress: z.string().ip().optional(),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const sensorDataSchema = z.object({
  deviceId: z.string(),
  metric: z.string(),
  value: z.any(),
  unit: z.string().optional(),
  timestamp: z.string().optional(),
});

const commandSchema = z.object({
  deviceId: z.string(),
  command: z.string(),
  payload: z.record(z.any()).optional(),
});

const deviceUpdateSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const paginationSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Mock IoT service for development
class MockIoTService {
  private devices: Map<string, any> = new Map();
  private sensorData: Map<string, any[]> = new Map();
  private commands: Map<string, any[]> = new Map();

  constructor() {
    // Add some mock devices
    this.addMockDevices();
  }

  private addMockDevices() {
    const mockDevices = [
      {
        id: 'device-1',
        name: 'Temperature Sensor 1',
        type: 'sensor',
        macAddress: '00:11:22:33:44:55',
        ipAddress: '192.168.1.100',
        status: 'online',
        location: 'Office Room 1',
        lastSeen: new Date(),
        metadata: { model: 'TempSens-3000', firmware: '1.2.0' }
      },
      {
        id: 'device-2',
        name: 'Smart Light 1',
        type: 'actuator',
        macAddress: '00:11:22:33:44:56',
        ipAddress: '192.168.1.101',
        status: 'online',
        location: 'Office Room 1',
        lastSeen: new Date(),
        metadata: { model: 'SmartLight-2000', brightness: 75, color: '#FFFFFF' }
      }
    ];

    mockDevices.forEach(device => {
      this.devices.set(device.id, device);
      this.sensorData.set(device.id, []);
      this.commands.set(device.id, []);
    });

    // Add some mock sensor data
    this.addMockSensorData();
  }

  private addMockSensorData() {
    const now = new Date();
    const tempData = [];
    const lightData = [];

    // Generate temperature data for the last 24 hours
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      tempData.push({
        id: `temp-${i}`,
        deviceId: 'device-1',
        metric: 'temperature',
        value: 20 + Math.random() * 10,
        unit: '°C',
        timestamp
      });

      lightData.push({
        id: `light-${i}`,
        deviceId: 'device-2',
        metric: 'power_consumption',
        value: Math.random() * 50,
        unit: 'watts',
        timestamp
      });
    }

    this.sensorData.set('device-1', tempData);
    this.sensorData.set('device-2', lightData);
  }

  async getDevices(_userId: string, options: { limit?: number; offset?: number } = {}) {
    const devices = Array.from(this.devices.values());
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    return {
      devices: devices.slice(offset, offset + limit),
      total: devices.length,
      hasMore: offset + limit < devices.length
    };
  }

  async getDevice(deviceId: string) {
    return this.devices.get(deviceId) || null;
  }

  async createDevice(deviceData: any, userId: string) {
    const device = {
      id: `device-${Date.now()}`,
      ...deviceData,
      status: 'offline',
      createdAt: new Date(),
      lastSeen: null,
      userId
    };

    this.devices.set(device.id, device);
    this.sensorData.set(device.id, []);
    this.commands.set(device.id, []);

    return device;
  }

  async updateDevice(deviceId: string, updates: any) {
    const device = this.devices.get(deviceId);
    if (!device) return null;

    const updatedDevice = { ...device, ...updates, updatedAt: new Date() };
    this.devices.set(deviceId, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(deviceId: string) {
    const deleted = this.devices.delete(deviceId);
    if (deleted) {
      this.sensorData.delete(deviceId);
      this.commands.delete(deviceId);
    }
    return deleted;
  }

  async getSensorData(deviceId: string, options: { limit?: number; offset?: number } = {}) {
    const data = this.sensorData.get(deviceId) || [];
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    return {
      data: data.slice(offset, offset + limit).reverse(), // Most recent first
      total: data.length,
      hasMore: offset + limit < data.length
    };
  }

  async addSensorData(sensorData: any) {
    const { deviceId, ...data } = sensorData;
    const deviceData = this.sensorData.get(deviceId) || [];
    
    const newData = {
      id: `data-${Date.now()}`,
      deviceId,
      ...data,
      timestamp: data.timestamp || new Date()
    };

    deviceData.push(newData);
    this.sensorData.set(deviceId, deviceData);

    // Update device last seen
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = new Date();
      device.status = 'online';
      this.devices.set(deviceId, device);
    }

    return newData;
  }

  async sendCommand(command: any, userId: string) {
    const { deviceId, ...commandData } = command;
    const commands = this.commands.get(deviceId) || [];
    
    const newCommand = {
      id: `cmd-${Date.now()}`,
      deviceId,
      ...commandData,
      status: 'pending',
      sentAt: new Date(),
      userId
    };

    commands.push(newCommand);
    this.commands.set(deviceId, commands);

    // Simulate command execution after 1 second
    setTimeout(() => {
      newCommand.status = 'executed';
      newCommand.executedAt = new Date();
      newCommand.response = { success: true, message: 'Command executed successfully' };
    }, 1000);

    return newCommand;
  }

  async getCommands(deviceId: string, options: { limit?: number; offset?: number } = {}) {
    const commands = this.commands.get(deviceId) || [];
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    return {
      commands: commands.slice(offset, offset + limit).reverse(), // Most recent first
      total: commands.length,
      hasMore: offset + limit < commands.length
    };
  }

  async getDeviceStats() {
    const devices = Array.from(this.devices.values());
    const online = devices.filter(d => d.status === 'online').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    const error = devices.filter(d => d.status === 'error').length;

    return {
      total: devices.length,
      online,
      offline,
      error,
      byType: {
        sensor: devices.filter(d => d.type === 'sensor').length,
        actuator: devices.filter(d => d.type === 'actuator').length,
        gateway: devices.filter(d => d.type === 'gateway').length,
        controller: devices.filter(d => d.type === 'controller').length,
      }
    };
  }
}

const iotService = new MockIoTService();

export async function iotRoutes(fastify: FastifyInstance) {
  // Get all devices
  fastify.get('/devices', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const query = paginationSchema.parse(request.query);

      const result = await iotService.getDevices(user.id, query);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting devices:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get devices'
      });
    }
  });

  // Get device by ID
  fastify.get('/devices/:deviceId', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const device = await iotService.getDevice(deviceId);

      if (!device) {
        reply.code(404).send({
          success: false,
          error: 'Device not found'
        });
        return;
      }

      reply.send({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('Error getting device:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get device'
      });
    }
  });

  // Create new device
  fastify.post('/devices', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const deviceData = deviceSchema.parse(request.body);

      const device = await iotService.createDevice(deviceData, user.id);

      reply.code(201).send({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('Error creating device:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create device'
      });
    }
  });

  // Update device
  fastify.put('/devices/:deviceId', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const updates = deviceUpdateSchema.parse(request.body);

      const device = await iotService.updateDevice(deviceId, updates);

      if (!device) {
        reply.code(404).send({
          success: false,
          error: 'Device not found'
        });
        return;
      }

      reply.send({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('Error updating device:', error);
      reply.code(400).send({
        success: false,
        error: 'Failed to update device'
      });
    }
  });

  // Delete device
  fastify.delete('/devices/:deviceId', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const deleted = await iotService.deleteDevice(deviceId);

      if (!deleted) {
        reply.code(404).send({
          success: false,
          error: 'Device not found'
        });
        return;
      }

      reply.send({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting device:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to delete device'
      });
    }
  });

  // Get sensor data for device
  fastify.get('/devices/:deviceId/data', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const query = paginationSchema.parse(request.query);

      const result = await iotService.getSensorData(deviceId, query);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting sensor data:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get sensor data'
      });
    }
  });

  // Add sensor data
  fastify.post('/devices/:deviceId/data', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const body = request.body as any;
      const sensorData = sensorDataSchema.parse({ deviceId, ...body });

      const data = await iotService.addSensorData(sensorData);

      reply.code(201).send({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error adding sensor data:', error);
      reply.code(400).send({
        success: false,
        error: 'Failed to add sensor data'
      });
    }
  });

  // Send command to device
  fastify.post('/devices/:deviceId/commands', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { deviceId } = request.params as { deviceId: string };
      const body = request.body as any;
      const commandData = commandSchema.parse({ deviceId, ...body });

      const command = await iotService.sendCommand(commandData, user.id);

      reply.code(201).send({
        success: true,
        data: command
      });
    } catch (error) {
      logger.error('Error sending command:', error);
      reply.code(400).send({
        success: false,
        error: 'Failed to send command'
      });
    }
  });

  // Get commands for device
  fastify.get('/devices/:deviceId/commands', {
    preHandler: [requireAuth]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { deviceId } = request.params as { deviceId: string };
      const query = paginationSchema.parse(request.query);

      const result = await iotService.getCommands(deviceId, query);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting commands:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get commands'
      });
    }
  });

  // Get IoT statistics
  fastify.get('/stats', {
    preHandler: [requireAuth]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await iotService.getDeviceStats();

      reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting IoT stats:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get IoT statistics'
      });
    }
  });

  logger.info('IoT API routes registered');
}
