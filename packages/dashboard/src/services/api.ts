import type { User, LoginCredentials, RegisterData } from '@shared/types'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const token = localStorage.getItem('token')

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          data: data
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      }
    } catch (error: any) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL)

// Authentication API
export const authApi = {
  async login(credentials: LoginCredentials) {
    return apiClient.post<{
      user: User
      tokens: {
        accessToken: string
        refreshToken: string
      }
    }>('/auth/login', credentials)
  },

  async register(userData: RegisterData) {
    return apiClient.post<{
      user: User
      tokens: {
        accessToken: string
        refreshToken: string
      }
    }>('/auth/register', userData)
  },

  async logout() {
    return apiClient.post('/auth/logout')
  },

  async refreshToken(refreshToken: string) {
    return apiClient.post<{
      accessToken: string
    }>('/auth/refresh', { refreshToken })
  },

  async me() {
    return apiClient.get<User>('/auth/me')
  },

  async updateProfile(profileData: Partial<User>) {
    return apiClient.patch<User>('/auth/profile', profileData)
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return apiClient.post('/auth/change-password', data)
  }
}

// System monitoring API
export const monitoringApi = {
  async getSystemStatus() {
    return apiClient.get<{
      status: 'healthy' | 'warning' | 'error'
      uptime: number
      version: string
      timestamp: string
      services: Record<string, {
        status: 'up' | 'down' | 'degraded'
        lastCheck: string
        responseTime?: number
      }>
    }>('/system/status')
  },

  async getMetrics() {
    return apiClient.get<{
      cpu: { usage: number; cores: number }
      memory: { used: number; total: number; percentage: number }
      disk: { used: number; total: number; percentage: number }
      network: { bytesIn: number; bytesOut: number }
      requests: { total: number; errors: number; avgResponseTime: number }
    }>('/system/metrics')
  },

  async getLogs(options?: {
    level?: 'error' | 'warn' | 'info' | 'debug'
    limit?: number
    offset?: number
    service?: string
  }) {
    const params = new URLSearchParams()
    if (options?.level) params.append('level', options.level)
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    if (options?.service) params.append('service', options.service)

    const query = params.toString()
    return apiClient.get<{
      logs: Array<{
        timestamp: string
        level: string
        message: string
        service: string
        metadata?: any
      }>
      total: number
    }>(`/system/logs${query ? `?${query}` : ''}`)
  }
}

// Analytics API
export const analyticsApi = {
  async getOverview(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    return apiClient.get<{
      totalRequests: number
      totalUsers: number
      avgResponseTime: number
      errorRate: number
      uptime: number
      trending: {
        requests: number
        users: number
        responseTime: number
      }
    }>(`/analytics/overview?range=${timeRange}`)
  },

  async getTraffic(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    return apiClient.get<{
      data: Array<{
        timestamp: string
        requests: number
        users: number
        errors: number
      }>
      summary: {
        totalRequests: number
        totalUsers: number
        totalErrors: number
        peakTraffic: number
      }
    }>(`/analytics/traffic?range=${timeRange}`)
  },

  async getPerformance(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    return apiClient.get<{
      data: Array<{
        timestamp: string
        avgResponseTime: number
        cpuUsage: number
        memoryUsage: number
        errorRate: number
      }>
      summary: {
        avgResponseTime: number
        maxResponseTime: number
        avgCpuUsage: number
        avgMemoryUsage: number
        errorRate: number
      }
    }>(`/analytics/performance?range=${timeRange}`)
  }
}

// Plugin API
export const pluginApi = {
  async getPlugins() {
    return apiClient.get<Array<{
      id: string
      name: string
      description: string
      version: string
      author: string
      status: 'active' | 'inactive' | 'error'
      enabled: boolean
      config?: any
      dependencies?: string[]
      lastUpdated: string
    }>>('/plugins')
  },

  async getPlugin(id: string) {
    return apiClient.get(`/plugins/${id}`)
  },

  async enablePlugin(id: string) {
    return apiClient.post(`/plugins/${id}/enable`)
  },

  async disablePlugin(id: string) {
    return apiClient.post(`/plugins/${id}/disable`)
  },

  async configurePlugin(id: string, config: any) {
    return apiClient.put(`/plugins/${id}/config`, config)
  },

  async installPlugin(pluginData: {
    name: string
    source: 'npm' | 'github' | 'local'
    identifier: string
  }) {
    return apiClient.post('/plugins/install', pluginData)
  },

  async uninstallPlugin(id: string) {
    return apiClient.delete(`/plugins/${id}`)
  }
}

// AI API
export const aiApi = {
  async getModels() {
    return apiClient.get<Array<{
      id: string
      name: string
      description: string
      provider: string
      status: 'available' | 'loading' | 'error'
      capabilities: string[]
      config?: any
    }>>('/ai/models')
  },

  async chat(data: {
    model: string
    messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }>
    stream?: boolean
  }) {
    return apiClient.post('/ai/chat', data)
  },

  async complete(data: {
    model: string
    prompt: string
    maxTokens?: number
    temperature?: number
  }) {
    return apiClient.post('/ai/complete', data)
  }
}

// Settings API
export const settingsApi = {
  async getSettings() {
    return apiClient.get('/settings')
  },

  async updateSettings(settings: any) {
    return apiClient.put('/settings', settings)
  },

  async getSettingGroup(group: string) {
    return apiClient.get(`/settings/${group}`)
  },

  async updateSettingGroup(group: string, settings: any) {
    return apiClient.put(`/settings/${group}`, settings)
  }
}

// Export the main API client for custom requests
export { apiClient }
export default apiClient
