<template>
  <div class="iot-view p-6 space-y-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        IoT Device Management
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Monitor, control, and automate your connected devices
      </p>
    </div>

    <!-- Device Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="stat in deviceStats"
        :key="stat.label"
        class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ stat.label }}</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">{{ stat.change }}</p>
          </div>
          <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', stat.color]">
            <span class="text-white text-2xl">{{ stat.icon }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Device Status and Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <!-- Device List -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Connected Devices
            </h3>
            <button
              @click="addDevice"
              class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Add Device
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="device in devices"
              :key="device.id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
            >
              <div class="flex items-center space-x-4">
                <div
                  :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    device.type === 'sensor' ? 'bg-blue-500' :
                    device.type === 'light' ? 'bg-yellow-500' :
                    device.type === 'camera' ? 'bg-red-500' :
                    device.type === 'thermostat' ? 'bg-orange-500' : 'bg-gray-500'
                  ]"
                >
                  <span class="text-white text-lg">{{ device.icon }}</span>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ device.name }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ device.location }} • {{ device.model }}
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-4">
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ device.status }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ device.lastSeen }}
                  </p>
                </div>
                
                <div
                  :class="[
                    'w-3 h-3 rounded-full',
                    device.online ? 'bg-green-500' : 'bg-red-500'
                  ]"
                ></div>

                <button
                  @click="toggleDevice(device)"
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-full',
                    device.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ device.active ? 'ON' : 'OFF' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Controls -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Controls
          </h3>
        </div>

        <div class="p-6 space-y-4">
          <div
            v-for="scene in scenes"
            :key="scene.name"
            class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', scene.color]">
                <span class="text-white text-sm">{{ scene.icon }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ scene.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ scene.devices }} devices</p>
              </div>
            </div>
            <button
              @click="activateScene(scene)"
              :class="[
                'px-3 py-1 text-xs font-medium rounded-lg',
                scene.active ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              ]"
            >
              {{ scene.active ? 'Active' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Environmental Monitoring -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          Environmental Monitoring
        </h3>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="sensor in sensorData"
            :key="sensor.name"
            class="text-center"
          >
            <div class="relative w-24 h-24 mx-auto mb-4">
              <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  :stroke-width="8"
                  fill="transparent"
                  class="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  :stroke="sensor.color"
                  :stroke-width="8"
                  fill="transparent"
                  :stroke-dasharray="`${sensor.percentage * 2.51} 251`"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ sensor.value }}
                </span>
              </div>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ sensor.name }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ sensor.unit }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ sensor.trend }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Automation Rules -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Automation Rules
          </h3>
          <button
            @click="createRule"
            class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Create Rule
          </button>
        </div>
      </div>

      <div class="p-6">
        <div class="space-y-4">
          <div
            v-for="rule in automationRules"
            :key="rule.id"
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', rule.color]">
                <span class="text-white text-lg">{{ rule.icon }}</span>
              </div>
              <div>
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ rule.name }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ rule.description }}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  rule.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                ]"
              >
                {{ rule.enabled ? 'Enabled' : 'Disabled' }}
              </span>
              
              <button
                @click="toggleRule(rule)"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Device Analytics -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          Device Analytics
        </h3>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Energy Consumption
            </h4>
            <div class="h-48 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
              <p class="text-gray-500 dark:text-gray-400">Energy consumption chart placeholder</p>
            </div>
          </div>
          
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Device Usage Patterns
            </h4>
            <div class="space-y-3">
              <div
                v-for="usage in usagePatterns"
                :key="usage.device"
                class="flex items-center justify-between"
              >
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ usage.device }}</span>
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      :class="['h-2 rounded-full', usage.color]"
                      :style="{ width: `${usage.percentage}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ usage.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Device statistics
const deviceStats = ref([
  { label: 'Total Devices', value: '24', change: '+2 this week', icon: '📱', color: 'bg-blue-500' },
  { label: 'Online Now', value: '21', change: '87.5% uptime', icon: '🟢', color: 'bg-green-500' },
  { label: 'Alerts Today', value: '3', change: '-2 from yesterday', icon: '⚠️', color: 'bg-yellow-500' },
  { label: 'Energy Saved', value: '15%', change: 'vs last month', icon: '⚡', color: 'bg-purple-500' }
])

// Connected devices
const devices = ref([
  {
    id: '1',
    name: 'Living Room Thermostat',
    location: 'Living Room',
    model: 'Nest Learning 3rd Gen',
    type: 'thermostat',
    icon: '🌡️',
    online: true,
    active: true,
    status: '72°F',
    lastSeen: '2 min ago'
  },
  {
    id: '2',
    name: 'Kitchen Smart Light',
    location: 'Kitchen',
    model: 'Philips Hue White',
    type: 'light',
    icon: '💡',
    online: true,
    active: false,
    status: 'Off',
    lastSeen: '1 min ago'
  },
  {
    id: '3',
    name: 'Security Camera',
    location: 'Front Door',
    model: 'Ring Video Doorbell',
    type: 'camera',
    icon: '📹',
    online: true,
    active: true,
    status: 'Recording',
    lastSeen: 'Now'
  },
  {
    id: '4',
    name: 'Motion Sensor',
    location: 'Hallway',
    model: 'SmartThings Motion',
    type: 'sensor',
    icon: '👁️',
    online: false,
    active: false,
    status: 'No Motion',
    lastSeen: '1 hour ago'
  },
  {
    id: '5',
    name: 'Smart Speaker',
    location: 'Bedroom',
    model: 'Amazon Echo Dot',
    type: 'speaker',
    icon: '🔊',
    online: true,
    active: true,
    status: 'Playing',
    lastSeen: 'Now'
  }
])

// Scene presets
const scenes = ref([
  { name: 'Good Morning', devices: '8', icon: '🌅', color: 'bg-yellow-500', active: false },
  { name: 'Movie Night', devices: '5', icon: '🎬', color: 'bg-purple-500', active: false },
  { name: 'Bed Time', devices: '12', icon: '🌙', color: 'bg-blue-500', active: true },
  { name: 'Away Mode', devices: '15', icon: '🏠', color: 'bg-gray-500', active: false }
])

// Environmental sensor data
const sensorData = ref([
  { name: 'Temperature', value: '72°F', unit: 'Fahrenheit', percentage: 72, color: '#ef4444', trend: '↑ 2°F from yesterday' },
  { name: 'Humidity', value: '45%', unit: 'Relative', percentage: 45, color: '#3b82f6', trend: '↓ 5% from yesterday' },
  { name: 'Air Quality', value: 'Good', unit: 'AQI 28', percentage: 85, color: '#10b981', trend: '↑ Improving' },
  { name: 'Light Level', value: '850', unit: 'Lux', percentage: 65, color: '#f59e0b', trend: '→ Stable' }
])

// Automation rules
const automationRules = ref([
  {
    id: '1',
    name: 'Energy Saver',
    description: 'Turn off lights when no motion detected for 10 minutes',
    enabled: true,
    icon: '⚡',
    color: 'bg-green-500'
  },
  {
    id: '2',
    name: 'Security Alert',
    description: 'Send notification when motion detected while away',
    enabled: true,
    icon: '🔒',
    color: 'bg-red-500'
  },
  {
    id: '3',
    name: 'Climate Control',
    description: 'Adjust temperature based on weather forecast',
    enabled: false,
    icon: '🌡️',
    color: 'bg-blue-500'
  },
  {
    id: '4',
    name: 'Welcome Home',
    description: 'Turn on lights and adjust temperature when arriving',
    enabled: true,
    icon: '🏠',
    color: 'bg-purple-500'
  }
])

// Usage patterns
const usagePatterns = ref([
  { device: 'Smart Lights', percentage: 85, color: 'bg-yellow-500' },
  { device: 'Thermostat', percentage: 92, color: 'bg-blue-500' },
  { device: 'Security System', percentage: 98, color: 'bg-red-500' },
  { device: 'Smart Speakers', percentage: 67, color: 'bg-purple-500' },
  { device: 'Motion Sensors', percentage: 78, color: 'bg-green-500' }
])

// Methods
function addDevice() {
  console.log('Adding new device...')
  // Implement device addition logic
}

function toggleDevice(device: any) {
  device.active = !device.active
  device.status = device.active ? 'On' : 'Off'
  console.log(`Toggled ${device.name} to ${device.active ? 'ON' : 'OFF'}`)
}

function activateScene(scene: any) {
  // Deactivate all scenes first
  scenes.value.forEach(s => s.active = false)
  // Activate selected scene
  scene.active = true
  console.log(`Activated scene: ${scene.name}`)
}

function createRule() {
  console.log('Creating new automation rule...')
  // Implement rule creation logic
}

function toggleRule(rule: any) {
  rule.enabled = !rule.enabled
  console.log(`Toggled rule ${rule.name} to ${rule.enabled ? 'enabled' : 'disabled'}`)
}

onMounted(() => {
  console.log('IoT Devices view mounted')
  // Initialize real-time updates
})
</script>

<style scoped>
.iot-view {
  min-height: 100vh;
}
</style>
