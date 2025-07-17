// Core User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

// AI Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatCompletion {
  id: string;
  message: ChatMessage;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter';
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface AIModel {
  id: string;
  provider: 'openai' | 'anthropic' | 'huggingface';
  name: string;
  description?: string;
  maxTokens: number;
  costPerToken?: number;
}

// Blockchain Types
export interface BlockchainNetwork {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface Wallet {
  address: string;
  privateKey?: string;
  publicKey: string;
  balance?: string;
  network: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed?: string;
  blockNumber?: number;
  timestamp?: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface SmartContract {
  address: string;
  abi: any[];
  bytecode?: string;
  network: string;
  deployedAt?: Date;
}

// IoT Types
export interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'actuator' | 'gateway' | 'controller';
  status: 'online' | 'offline' | 'error';
  ipAddress?: string;
  macAddress?: string;
  lastSeen?: Date;
  metadata?: Record<string, any>;
}

export interface SensorData {
  deviceId: string;
  timestamp: Date;
  type: string;
  value: number | string | boolean;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface MQTTBroker {
  url: string;
  username?: string;
  password?: string;
  clientId?: string;
  keepalive?: number;
}

export interface RemoteConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'rdp' | 'vnc' | 'http' | 'https';
  credentials?: {
    username: string;
    password?: string;
    privateKey?: string;
  };
  status: 'connected' | 'disconnected' | 'error';
}

// Plugin Types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  category: 'ai' | 'blockchain' | 'iot' | 'monitoring' | 'utility';
  description?: string;
  enabled: boolean;
  config?: Record<string, any>;
  dependencies?: string[];
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  category: Plugin['category'];
  main: string;
  dependencies?: Record<string, string>;
  permissions?: string[];
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export interface WebSocketSubscription {
  channel: string;
  userId: string;
  filters?: Record<string, any>;
}

// Configuration Types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface AppConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  cors: {
    origin: string[];
    credentials: boolean;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    bcryptRounds: number;
  };
  database: DatabaseConfig;
  redis: RedisConfig;
  ai: {
    openai?: {
      apiKey: string;
      organization?: string;
    };
    anthropic?: {
      apiKey: string;
    };
    huggingface?: {
      apiKey: string;
    };
  };
  blockchain: {
    ethereum?: {
      rpcUrl: string;
      privateKey?: string;
    };
    polygon?: {
      rpcUrl: string;
      privateKey?: string;
    };
  };
  mqtt: MQTTBroker;
}
