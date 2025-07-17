import mqtt from 'mqtt';
import { EventEmitter } from 'events';
import { logger } from '@matrix/shared';
import { db } from './database.js';

export interface IoTDevice {
  id: string;
  name: string;
  deviceId: string;
  deviceType: string;
  manufacturer?: string;
  model?: string;
  firmware?: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';
  lastSeen: Date | null;
  location?: string;
  metadata: Record<string, any>;
}

export interface IoTMessage {
  deviceId: string;
  topic: string;
  payload: any;
  timestamp: Date;
  qos?: 0 | 1 | 2;
}

export interface IoTCommand {
  deviceId: string;
  command: string;
  parameters: Record<string, any>;
  timestamp: Date;
}

export interface SensorReading {
  id?: string;
  deviceId: string;
  metric: string;
  value: any;
  unit?: string;
  timestamp: Date;
}

class IoTService extends EventEmitter {
  private client: mqtt.MqttClient | null = null;
  private devices: Map<string, IoTDevice> = new Map();
  private mqttConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    super();
    
    // Add a default error handler to prevent uncaught exceptions
    this.on('error', (error) => {
      logger.error('IoT Service error:', error);
      // Prevent crash in development mode
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logger.warn('IoT service error handled gracefully in development mode');
      }
    });
    
    // Initialize MQTT in a non-blocking way for development
    process.nextTick(() => {
      this.initializeMQTTSafely();
    });
  }

  private async initializeMQTTSafely(): Promise<void> {
    try {
      this.initializeMQTT();
    } catch (error) {
      logger.error('Failed to initialize MQTT client', { error });
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logger.warn('MQTT broker not available in development mode - IoT features will be limited');
      }
    }
  }

  private initializeMQTT(): void {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;

    if (brokerUrl === 'mqtt://localhost:1883') {
      logger.warn('MQTT broker URL not configured, using default localhost');
    }

    const options: mqtt.IClientOptions = {
      clientId: `unimatrix-iot-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: process.env.NODE_ENV === 'development' ? 0 : 5000, // Disable reconnect in dev
    };

    if (username) {
      options.username = username;
      options.password = password;
    }

    try {
      this.client = mqtt.connect(brokerUrl, options);
      this.setupEventHandlers();
      logger.info('MQTT client initialized', { brokerUrl });
    } catch (error) {
      logger.error('Failed to initialize MQTT client', { error });
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      this.mqttConnected = true;
      this.reconnectAttempts = 0;
      logger.info('MQTT client connected');
      
      // Subscribe to device discovery and status topics
      this.subscribeToTopics([
        'devices/+/status',
        'devices/+/sensors/+',
        'devices/+/discovery',
        'devices/+/heartbeat',
        'unimatrix/+/+', // Custom namespace
      ]);

      this.emit('connected');
    });

    this.client.on('disconnect', () => {
      this.mqttConnected = false;
      logger.warn('MQTT client disconnected');
      this.emit('disconnected');
    });

    this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        await this.handleMessage(topic, payload);
      } catch (error) {
        logger.error('Error processing MQTT message', { topic, error });
      }
    });

    this.client.on('error', (error) => {
      logger.error('MQTT client error', { error });
      this.mqttConnected = false;
      this.emit('error', error);
      
      // Don't crash in development if MQTT broker is not available
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logger.warn('MQTT broker not available in development mode - IoT features will be limited');
        return;
      }
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        logger.info(`MQTT client reconnecting (attempt ${this.reconnectAttempts})`);
      } else {
        logger.error('MQTT client max reconnection attempts reached');
        this.client?.end(true);
      }
    });
  }

  private subscribeToTopics(topics: string[]): void {
    if (!this.client || !this.mqttConnected) return;

    topics.forEach(topic => {
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to topic: ${topic}`, { error: err });
        } else {
          logger.info(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, payload: any): Promise<void> {
    const parts = topic.split('/');
    
    if (parts.length < 3) {
      logger.warn('Invalid topic format', { topic });
      return;
    }

    const deviceId = parts[1];
    const messageType = parts[2];

    // Store the message
    const iotMessage: IoTMessage = {
      deviceId,
      topic,
      payload,
      timestamp: new Date(),
    };

    this.emit('message', iotMessage);

    switch (messageType) {
      case 'status':
        await this.handleDeviceStatus(deviceId, payload);
        break;
      case 'sensors':
        await this.handleSensorData(deviceId, parts[3], payload);
        break;
      case 'discovery':
        await this.handleDeviceDiscovery(deviceId, payload);
        break;
      case 'heartbeat':
        await this.handleHeartbeat(deviceId, payload);
        break;
      default:
        logger.debug('Unhandled message type', { messageType, topic });
    }
  }

  private async handleDeviceStatus(deviceId: string, payload: any): Promise<void> {
    try {
      const device = this.devices.get(deviceId) || await this.getDeviceFromDatabase(deviceId);
      
      if (device) {
        device.status = payload.status || 'online';
        device.lastSeen = new Date();
        device.metadata = { ...device.metadata, ...payload.metadata };
        
        this.devices.set(deviceId, device);
        await this.updateDeviceInDatabase(device);
        
        this.emit('deviceStatusChanged', device);
        logger.info('Device status updated', { deviceId, status: device.status });
      }
    } catch (error) {
      logger.error('Error handling device status', { deviceId, error });
    }
  }

  private async handleSensorData(deviceId: string, sensorType: string, payload: any): Promise<void> {
    try {
      const reading: SensorReading = {
        deviceId,
        sensorType,
        value: payload.value,
        unit: payload.unit || '',
        timestamp: new Date(payload.timestamp || Date.now()),
        metadata: payload.metadata,
      };

      await this.storeSensorReading(reading);
      this.emit('sensorReading', reading);
      
      logger.debug('Sensor reading received', { deviceId, sensorType, value: reading.value });
    } catch (error) {
      logger.error('Error handling sensor data', { deviceId, sensorType, error });
    }
  }

  private async handleDeviceDiscovery(deviceId: string, payload: any): Promise<void> {
    try {
      const device: IoTDevice = {
        id: deviceId,
        name: payload.name || `Device ${deviceId}`,
        type: payload.type || 'unknown',
        status: 'online',
        lastSeen: new Date(),
        metadata: payload.metadata || {},
        location: payload.location,
      };

      this.devices.set(deviceId, device);
      await this.createOrUpdateDeviceInDatabase(device);
      
      this.emit('deviceDiscovered', device);
      logger.info('Device discovered', { deviceId, name: device.name, type: device.type });
    } catch (error) {
      logger.error('Error handling device discovery', { deviceId, error });
    }
  }

  private async handleHeartbeat(deviceId: string, _payload: any): Promise<void> {
    try {
      const device = this.devices.get(deviceId);
      if (device) {
        device.lastSeen = new Date();
        device.status = 'online';
        this.devices.set(deviceId, device);
        
        this.emit('deviceHeartbeat', device);
      }
    } catch (error) {
      logger.error('Error handling heartbeat', { deviceId, error });
    }
  }

  async sendCommand(deviceId: string, command: string, parameters: Record<string, any> = {}): Promise<boolean> {
    if (!this.client || !this.mqttConnected) {
      logger.error('MQTT client not connected');
      return false;
    }

    try {
      const topic = `devices/${deviceId}/commands`;
      const payload = {
        command,
        parameters,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9),
      };

      return new Promise((resolve) => {
        this.client!.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
          if (err) {
            logger.error('Failed to send command', { deviceId, command, error: err });
            resolve(false);
          } else {
            logger.info('Command sent successfully', { deviceId, command });
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('Error sending command', { deviceId, command, error });
      return false;
    }
  }

  async publishMessage(topic: string, payload: any, qos: 0 | 1 | 2 = 1): Promise<boolean> {
    if (!this.client || !this.mqttConnected) {
      logger.error('MQTT client not connected');
      return false;
    }

    try {
      return new Promise((resolve) => {
        this.client!.publish(topic, JSON.stringify(payload), { qos }, (err) => {
          if (err) {
            logger.error('Failed to publish message', { topic, error: err });
            resolve(false);
          } else {
            logger.debug('Message published successfully', { topic });
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('Error publishing message', { topic, error });
      return false;
    }
  }

  getConnectedDevices(): IoTDevice[] {
    return Array.from(this.devices.values()).filter(device => device.status === 'online');
  }

  getAllDevices(): IoTDevice[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): IoTDevice | undefined {
    return this.devices.get(deviceId);
  }

  // Get all devices
  async getDevices(): Promise<IoTDevice[]> {
    try {
      // Get from memory cache
      const memoryDevices = Array.from(this.devices.values());
      
      // Also get from database to ensure we have all devices
      const dbDevices = await db.iotDevice.findMany({
        orderBy: { lastSeen: 'desc' }
      });
      
      // Merge and deduplicate
      const deviceMap = new Map<string, IoTDevice>();
      
      // Add memory devices first (they have latest state)
      memoryDevices.forEach(device => deviceMap.set(device.id, device));
      
      // Add database devices if not in memory
      dbDevices.forEach((dbDevice: any) => {
        if (!deviceMap.has(dbDevice.id)) {
          deviceMap.set(dbDevice.id, {
            id: dbDevice.id,
            name: dbDevice.name,
            type: dbDevice.type,
            status: (dbDevice.status === 'unknown' ? 'error' : dbDevice.status) as 'online' | 'offline' | 'error',
            lastSeen: dbDevice.lastSeen,
            description: dbDevice.description || undefined,
            location: dbDevice.location || undefined,
            metadata: typeof dbDevice.metadata === 'string' 
              ? JSON.parse(dbDevice.metadata) 
              : dbDevice.metadata || {}
          });
        }
      });
      
      return Array.from(deviceMap.values());
    } catch (error) {
      logger.error(`Error getting devices: ${error}`);
      return Array.from(this.devices.values());
    }
  }

  // Register a new device
  async registerDevice(deviceData: {
    name: string;
    type: string;
    description?: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    metadata?: Record<string, any>;
  }): Promise<IoTDevice> {
    try {
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const device: IoTDevice = {
        id: deviceId,
        name: deviceData.name,
        type: deviceData.type,
        status: 'offline',
        lastSeen: new Date(),
        description: deviceData.description,
        location: deviceData.location,
        metadata: deviceData.metadata || {}
      };

      // Store in memory
      this.devices.set(deviceId, device);

      // Store in database
      await db.iotDevice.create({
        data: {
          id: deviceId,
          name: device.name,
          type: device.type,
          status: device.status,
          lastSeen: device.lastSeen,
          description: device.description,
          location: device.location,
          metadata: JSON.stringify(device.metadata)
        }
      });

      logger.info(`Device registered: ${deviceId} (${device.name})`);
      this.emit('deviceRegistered', device);
      
      return device;
    } catch (error) {
      logger.error(`Error registering device: ${error}`);
      throw error;
    }
  }

  // Update device information
  async updateDevice(deviceId: string, updateData: {
    name?: string;
    type?: string;
    description?: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    metadata?: Record<string, any>;
  }): Promise<IoTDevice | null> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        return null;
      }

      // Update device properties
      if (updateData.name !== undefined) device.name = updateData.name;
      if (updateData.type !== undefined) device.type = updateData.type;
      if (updateData.description !== undefined) device.description = updateData.description;
      if (updateData.location !== undefined) device.location = updateData.location;
      if (updateData.metadata !== undefined) device.metadata = updateData.metadata;

      // Update in memory
      this.devices.set(deviceId, device);

      // Update in database
      await db.iotDevice.update({
        where: { id: deviceId },
        data: {
          name: device.name,
          type: device.type,
          description: device.description,
          location: device.location,
          metadata: JSON.stringify(device.metadata)
        }
      });

      logger.info(`Device updated: ${deviceId}`);
      this.emit('deviceUpdated', device);
      
      return device;
    } catch (error) {
      logger.error(`Error updating device: ${error}`);
      throw error;
    }
  }

  // Remove a device
  async removeDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        return false;
      }

      // Remove from memory
      this.devices.delete(deviceId);

      // Remove from database
      await db.iotDevice.delete({
        where: { id: deviceId }
      });

      // Also remove associated sensor readings
      await db.sensorReading.deleteMany({
        where: { deviceId }
      });

      logger.info(`Device removed: ${deviceId}`);
      this.emit('deviceRemoved', { deviceId, device });
      
      return true;
    } catch (error) {
      logger.error(`Error removing device: ${error}`);
      return false;
    }
  }

  // Get sensor data with filtering
  async getSensorData(
    deviceId: string,
    sensorType?: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 100
  ): Promise<SensorReading[]> {
    try {
      const where: any = { deviceId };
      
      if (sensorType) {
        where.sensorType = sensorType;
      }
      
      if (startTime || endTime) {
        where.timestamp = {};
        if (startTime) where.timestamp.gte = startTime;
        if (endTime) where.timestamp.lte = endTime;
      }

      const readings = await db.sensorReading.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      return readings.map((reading: any) => ({
        id: reading.id,
        deviceId: reading.deviceId,
        sensorType: reading.sensorType,
        value: reading.value,
        timestamp: reading.timestamp,
        data: typeof reading.data === 'string' ? JSON.parse(reading.data) : reading.data
      }));
    } catch (error) {
      logger.error(`Error getting sensor data: ${error}`);
      return [];
    }
  }

  // Get analytics for sensor data
  async getAnalytics(
    deviceId: string,
    sensorType?: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<{
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    try {
      const sensorData = await this.getSensorData(deviceId, sensorType, startTime, endTime, 1000);
      
      if (sensorData.length === 0) {
        return {
          count: 0,
          average: 0,
          min: 0,
          max: 0,
          latest: 0,
          trend: 'stable'
        };
      }

      const values = sensorData.map(reading => reading.value);
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const average = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const latest = values[0]; // First item since ordered desc

      // Calculate trend (compare first half with second half)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (count > 4) {
        const midPoint = Math.floor(count / 2);
        const firstHalf = values.slice(0, midPoint);
        const secondHalf = values.slice(midPoint);
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const diffPercent = ((firstAvg - secondAvg) / secondAvg) * 100;
        if (diffPercent > 5) trend = 'up';
        else if (diffPercent < -5) trend = 'down';
      }

      return {
        count,
        average: Math.round(average * 100) / 100,
        min,
        max,
        latest,
        trend
      };
    } catch (error) {
      logger.error(`Error getting analytics: ${error}`);
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        latest: 0,
        trend: 'stable'
      };
    }
  }

  // Start device discovery
  async startDiscovery(): Promise<void> {
    if (!this.client || !this.mqttConnected) {
      throw new Error('MQTT client not connected');
    }
    
    // Publish discovery request
    await this.publishMessage('unimatrix/discovery/request', {
      timestamp: new Date().toISOString(),
      requestId: `discovery_${Date.now()}`
    });
    
    this.emit('discoveryStarted');
    logger.info('Device discovery started');
  }

  // Stop device discovery  
  async stopDiscovery(): Promise<void> {
    // Discovery is passive, so just emit event
    this.emit('discoveryStopped');
    logger.info('Device discovery stopped');
  }

  // Check if MQTT client is connected
  isConnected(): boolean {
    return this.mqttConnected;
  }

  // Database operations
  private async getDeviceFromDatabase(deviceId: string): Promise<IoTDevice | null> {
    try {
      const device = await db.iotDevice.findUnique({
        where: { id: deviceId },
      });

      if (!device) return null;

      return {
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status as 'online' | 'offline' | 'error',
        lastSeen: device.lastSeen,
        metadata: device.metadata as Record<string, any>,
        location: device.location as any,
      };
    } catch (error) {
      logger.error('Error getting device from database', { deviceId, error });
      return null;
    }
  }

  private async updateDeviceInDatabase(device: IoTDevice): Promise<void> {
    try {
      await db.iotDevice.update({
        where: { id: device.id },
        data: {
          name: device.name,
          type: device.type,
          status: device.status,
          lastSeen: device.lastSeen,
          metadata: device.metadata,
          location: device.location,
        },
      });
    } catch (error) {
      logger.error('Error updating device in database', { deviceId: device.id, error });
    }
  }

  private async createOrUpdateDeviceInDatabase(device: IoTDevice): Promise<void> {
    try {
      await db.iotDevice.upsert({
        where: { id: device.id },
        update: {
          name: device.name,
          type: device.type,
          status: device.status,
          lastSeen: device.lastSeen,
          metadata: device.metadata,
          location: device.location,
        },
        create: {
          id: device.id,
          name: device.name,
          type: device.type,
          status: device.status,
          lastSeen: device.lastSeen,
          metadata: device.metadata,
          location: device.location,
          userId: 'system', // TODO: Associate with actual user
        },
      });
    } catch (error) {
      logger.error('Error creating/updating device in database', { deviceId: device.id, error });
    }
  }

  private async storeSensorReading(reading: SensorReading): Promise<void> {
    try {
      await db.sensorReading.create({
        data: {
          deviceId: reading.deviceId,
          sensorType: reading.sensorType,
          value: reading.value,
          unit: reading.unit,
          timestamp: reading.timestamp,
          metadata: reading.metadata,
        },
      });
    } catch (error) {
      logger.error('Error storing sensor reading', { reading, error });
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end(true);
      this.mqttConnected = false;
      logger.info('MQTT client disconnected');
    }
  }
}

// TODO: Fix TypeScript errors with database schema alignment
// export const iotService = new IoTService();
