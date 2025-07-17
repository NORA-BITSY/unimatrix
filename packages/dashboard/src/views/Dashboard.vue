<template>
  <div class="dashboard-view">
    <!-- Header Section -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        System Dashboard
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Real-time monitoring and analytics for your UniMatrix system
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="stat in quickStats"
        :key="stat.label"
        class="stat-card bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {{ stat.label }}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stat.value }}
            </p>
            <div class="flex items-center mt-2">
              <span
                :class="[
                  'text-xs font-medium',
                  stat.trend > 0 ? 'text-green-600' : stat.trend < 0 ? 'text-red-600' : 'text-gray-600'
                ]"
              >
                {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                vs last period
              </span>
            </div>
          </div>
          <div
            :class="[
              'w-12 h-12 rounded-lg flex items-center justify-center',
              stat.color
            ]"
          >
            <component :is="stat.icon" class="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- System Status -->
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              System Status
            </h2>
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-2 h-2 rounded-full',
                  systemStatus.overall === 'healthy' ? 'bg-green-500' : 
                  systemStatus.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                ]"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {{ systemStatus.overall }}
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="service in systemStatus.services"
              :key="service.name"
              class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div class="flex items-center">
                <div
                  :class="[
                    'w-2 h-2 rounded-full mr-3',
                    service.status === 'up' ? 'bg-green-500' :
                    service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  ]"
                ></div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ service.name }}
                </span>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {{ service.responseTime }}ms
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-500">
                  Last check: {{ formatTime(service.lastCheck) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div class="space-y-3">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-start space-x-3"
            >
              <div
                :class="[
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                ]"
              ></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ activity.message }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(activity.timestamp) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- CPU & Memory Usage -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Resources
        </h2>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">CPU Usage</span>
              <span class="text-gray-900 dark:text-white">{{ systemMetrics.cpu.usage }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${systemMetrics.cpu.usage}%` }"
              ></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Memory Usage</span>
              <span class="text-gray-900 dark:text-white">{{ systemMetrics.memory.percentage }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-green-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${systemMetrics.memory.percentage}%` }"
              ></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Disk Usage</span>
              <span class="text-gray-900 dark:text-white">{{ systemMetrics.disk.percentage }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${systemMetrics.disk.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Activity -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Network Activity
        </h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Bytes In</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatBytes(systemMetrics.network.bytesIn) }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Bytes Out</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatBytes(systemMetrics.network.bytesOut) }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Total Requests</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ systemMetrics.requests.total.toLocaleString() }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ ((systemMetrics.requests.errors / systemMetrics.requests.total) * 100).toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWebSocketStore } from '../stores/websocket'
import { monitoringApi } from '../services/api'
import {
  ServerIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const wsStore = useWebSocketStore()

// Reactive data
const quickStats = ref([
  {
    label: 'Active Users',
    value: '1,234',
    trend: 5.2,
    color: 'bg-blue-500',
    icon: UserGroupIcon
  },
  {
    label: 'Total Requests',
    value: '45.2K',
    trend: 12.3,
    color: 'bg-green-500',
    icon: ChartBarIcon
  },
  {
    label: 'System Uptime',
    value: '99.9%',
    trend: 0.1,
    color: 'bg-purple-500',
    icon: ServerIcon
  },
  {
    label: 'Avg Response Time',
    value: '234ms',
    trend: -8.1,
    color: 'bg-orange-500',
    icon: ClockIcon
  }
])

const systemStatus = ref({
  overall: 'healthy' as 'healthy' | 'warning' | 'error',
  services: [
    { name: 'API Gateway', status: 'up' as 'up' | 'down' | 'degraded', responseTime: 45, lastCheck: new Date() },
    { name: 'Database', status: 'up' as 'up' | 'down' | 'degraded', responseTime: 23, lastCheck: new Date() },
    { name: 'Redis Cache', status: 'up' as 'up' | 'down' | 'degraded', responseTime: 12, lastCheck: new Date() },
    { name: 'WebSocket', status: 'up' as 'up' | 'down' | 'degraded', responseTime: 8, lastCheck: new Date() }
  ]
})

const systemMetrics = ref({
  cpu: { usage: 45 },
  memory: { percentage: 68, used: 2.1, total: 3.2 },
  disk: { percentage: 34, used: 125, total: 512 },
  network: { bytesIn: 1024000, bytesOut: 2048000 },
  requests: { total: 45234, errors: 123, avgResponseTime: 234 }
})

const recentActivity = ref([
  { id: 1, message: 'New user registered', type: 'info', timestamp: new Date(Date.now() - 5000) },
  { id: 2, message: 'AI model training completed', type: 'success', timestamp: new Date(Date.now() - 30000) },
  { id: 3, message: 'Plugin update available', type: 'warning', timestamp: new Date(Date.now() - 120000) },
  { id: 4, message: 'Database backup completed', type: 'success', timestamp: new Date(Date.now() - 300000) }
])

// Auto-refresh interval
let refreshInterval: number

// Methods
function formatTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return 'Just now'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

async function loadSystemStatus() {
  try {
    const response = await monitoringApi.getSystemStatus()
    if (response.success) {
      systemStatus.value = response.data
    }
  } catch (error) {
    console.error('Failed to load system status:', error)
  }
}

async function loadSystemMetrics() {
  try {
    const response = await monitoringApi.getMetrics()
    if (response.success) {
      systemMetrics.value = response.data
    }
  } catch (error) {
    console.error('Failed to load system metrics:', error)
  }
}

// Lifecycle
onMounted(() => {
  // Load initial data
  loadSystemStatus()
  loadSystemMetrics()
  
  // Set up auto-refresh
  refreshInterval = window.setInterval(() => {
    loadSystemStatus()
    loadSystemMetrics()
  }, 30000) // Refresh every 30 seconds

  // Subscribe to WebSocket updates
  wsStore.subscribe('system.status', (data) => {
    systemStatus.value = data
  })
  
  wsStore.subscribe('system.metrics', (data) => {
    systemMetrics.value = data
  })
  
  wsStore.subscribe('system.activity', (data) => {
    recentActivity.value.unshift({
      id: Date.now(),
      message: data.message,
      type: data.type,
      timestamp: new Date()
    })
    // Keep only latest 10 activities
    if (recentActivity.value.length > 10) {
      recentActivity.value = recentActivity.value.slice(0, 10)
    }
  })
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.dark .stat-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
</style>
