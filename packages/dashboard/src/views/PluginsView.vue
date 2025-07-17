<template>
  <div class="plugins-view p-6 space-y-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Plugin Manager
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Extend your system with powerful plugins and integrations
      </p>
    </div>

    <!-- Plugin Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="stat in pluginStats"
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

    <!-- Plugin Tabs -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex space-x-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
          >
            {{ tab.name }}
          </button>
        </div>
      </div>

      <!-- Installed Plugins Tab -->
      <div v-if="activeTab === 'installed'" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="plugin in installedPlugins"
            :key="plugin.id"
            class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', plugin.color]">
                  <span class="text-white text-lg">{{ plugin.icon }}</span>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ plugin.name }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    v{{ plugin.version }}
                  </p>
                </div>
              </div>
              <div
                :class="[
                  'w-3 h-3 rounded-full',
                  plugin.status === 'active' ? 'bg-green-500' :
                  plugin.status === 'inactive' ? 'bg-gray-400' : 'bg-red-500'
                ]"
              ></div>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ plugin.description }}
            </p>

            <div class="flex items-center justify-between">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  plugin.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  plugin.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                ]"
              >
                {{ plugin.status }}
              </span>

              <div class="flex space-x-2">
                <button
                  @click="togglePlugin(plugin)"
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-lg',
                    plugin.status === 'active' 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                  ]"
                >
                  {{ plugin.status === 'active' ? 'Disable' : 'Enable' }}
                </button>
                <button
                  @click="configurePlugin(plugin)"
                  class="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plugin Marketplace Tab -->
      <div v-if="activeTab === 'marketplace'" class="p-6">
        <div class="mb-6">
          <div class="flex items-center space-x-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search plugins..."
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <select
              v-model="selectedCategory"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              <option value="integration">Integration</option>
              <option value="automation">Automation</option>
              <option value="analytics">Analytics</option>
              <option value="security">Security</option>
              <option value="utility">Utility</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="plugin in filteredMarketplacePlugins"
            :key="plugin.id"
            class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', plugin.color]">
                  <span class="text-white text-lg">{{ plugin.icon }}</span>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ plugin.name }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    by {{ plugin.author }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-yellow-400">⭐</span>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ plugin.rating }}</span>
              </div>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ plugin.description }}
            </p>

            <div class="flex items-center justify-between mb-4">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getCategoryColor(plugin.category)
                ]"
              >
                {{ plugin.category }}
              </span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ plugin.price === 0 ? 'Free' : `$${plugin.price}` }}
              </span>
            </div>

            <button
              @click="installPlugin(plugin)"
              :disabled="isPluginInstalled(plugin.id)"
              class="w-full px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPluginInstalled(plugin.id) ? 'Installed' : 'Install' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Development Tab -->
      <div v-if="activeTab === 'development'" class="p-6">
        <div class="space-y-6">
          <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Plugin Development Kit
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create your own plugins using our comprehensive development tools and documentation.
            </p>
            <div class="flex space-x-3">
              <button
                @click="createNewPlugin"
                class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Create New Plugin
              </button>
              <button
                @click="openDocumentation"
                class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                View Documentation
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Plugin Templates
              </h4>
              <div class="space-y-3">
                <div
                  v-for="template in pluginTemplates"
                  :key="template.id"
                  class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ template.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ template.description }}</p>
                  </div>
                  <button
                    @click="useTemplate(template)"
                    class="px-3 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                API Resources
              </h4>
              <div class="space-y-3">
                <div
                  v-for="resource in apiResources"
                  :key="resource.name"
                  class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ resource.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ resource.description }}</p>
                  </div>
                  <button
                    @click="viewApiDocs(resource)"
                    class="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  >
                    View Docs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="p-6">
        <div class="space-y-6">
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Plugin System Settings
            </h4>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Auto-update plugins</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Automatically update plugins when new versions are available</p>
                </div>
                <button
                  @click="toggleAutoUpdate"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    autoUpdate ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      autoUpdate ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  ></span>
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Plugin sandboxing</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Run plugins in isolated environments for security</p>
                </div>
                <button
                  @click="toggleSandboxing"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    sandboxing ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      sandboxing ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  ></span>
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Developer mode</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Enable additional debugging and development features</p>
                </div>
                <button
                  @click="toggleDeveloperMode"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    developerMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      developerMode ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  ></span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Storage Management
            </h4>
            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">Plugin storage used</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">245 MB / 1 GB</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-primary-600 h-2 rounded-full" style="width: 24.5%"></div>
              </div>
              <div class="flex justify-between mt-4">
                <button
                  @click="clearPluginCache"
                  class="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  Clear Cache
                </button>
                <button
                  @click="cleanupUnusedData"
                  class="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                >
                  Cleanup Unused Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Plugin statistics
const pluginStats = ref([
  { label: 'Installed', value: '12', change: '+3 this month', icon: '🔌', color: 'bg-blue-500' },
  { label: 'Active', value: '9', change: '75% enabled', icon: '✅', color: 'bg-green-500' },
  { label: 'Updates Available', value: '2', change: 'Security fixes', icon: '⬆️', color: 'bg-orange-500' },
  { label: 'Storage Used', value: '245MB', change: '24% of limit', icon: '💾', color: 'bg-purple-500' }
])

// Tab management
const tabs = ref([
  { id: 'installed', name: 'Installed' },
  { id: 'marketplace', name: 'Marketplace' },
  { id: 'development', name: 'Development' },
  { id: 'settings', name: 'Settings' }
])

const activeTab = ref('installed')

// Installed plugins
const installedPlugins = ref([
  {
    id: 'auth-plugin',
    name: 'Enhanced Authentication',
    version: '2.1.0',
    description: 'Advanced authentication with multi-factor support and OAuth integrations.',
    status: 'active',
    color: 'bg-blue-500',
    icon: '🔐'
  },
  {
    id: 'analytics-pro',
    name: 'Analytics Pro',
    version: '1.5.2',
    description: 'Advanced analytics and reporting with custom dashboards and insights.',
    status: 'active',
    color: 'bg-green-500',
    icon: '📊'
  },
  {
    id: 'backup-manager',
    name: 'Backup Manager',
    version: '3.0.1',
    description: 'Automated backup and restore functionality with cloud storage integration.',
    status: 'inactive',
    color: 'bg-yellow-500',
    icon: '💾'
  },
  {
    id: 'notification-hub',
    name: 'Notification Hub',
    version: '1.2.3',
    description: 'Centralized notification system with multiple channels and templates.',
    status: 'active',
    color: 'bg-purple-500',
    icon: '🔔'
  },
  {
    id: 'file-processor',
    name: 'File Processor',
    version: '2.3.0',
    description: 'Advanced file processing with image optimization and format conversion.',
    status: 'error',
    color: 'bg-red-500',
    icon: '📁'
  },
  {
    id: 'email-service',
    name: 'Email Service',
    version: '1.8.1',
    description: 'SMTP email service with template engine and delivery tracking.',
    status: 'active',
    color: 'bg-blue-600',
    icon: '📧'
  }
])

// Marketplace plugins
const marketplacePlugins = ref([
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    author: 'TechCorp',
    version: '1.0.0',
    description: 'Intelligent AI assistant for automated tasks and natural language processing.',
    category: 'automation',
    rating: 4.8,
    price: 29.99,
    color: 'bg-indigo-500',
    icon: '🤖'
  },
  {
    id: 'blockchain-wallet',
    name: 'Blockchain Wallet',
    author: 'CryptoDevs',
    version: '2.1.0',
    description: 'Multi-chain cryptocurrency wallet with DeFi integration and staking.',
    category: 'integration',
    rating: 4.6,
    price: 0,
    color: 'bg-yellow-600',
    icon: '⛓️'
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    author: 'SecureApps',
    version: '3.2.1',
    description: 'Comprehensive security scanning and vulnerability assessment tools.',
    category: 'security',
    rating: 4.9,
    price: 49.99,
    color: 'bg-red-600',
    icon: '🛡️'
  },
  {
    id: 'data-visualizer',
    name: 'Data Visualizer',
    author: 'DataViz Inc',
    version: '1.4.0',
    description: 'Advanced data visualization with interactive charts and custom widgets.',
    category: 'analytics',
    rating: 4.7,
    price: 19.99,
    color: 'bg-green-600',
    icon: '📈'
  },
  {
    id: 'performance-monitor',
    name: 'Performance Monitor',
    author: 'MonitorTech',
    version: '2.0.3',
    description: 'Real-time performance monitoring with alerts and optimization suggestions.',
    category: 'utility',
    rating: 4.5,
    price: 0,
    color: 'bg-orange-600',
    icon: '⚡'
  }
])

// Search and filtering
const searchQuery = ref('')
const selectedCategory = ref('')

const filteredMarketplacePlugins = computed(() => {
  return marketplacePlugins.value.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || plugin.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

// Plugin templates
const pluginTemplates = ref([
  { id: 'basic', name: 'Basic Plugin', description: 'Simple plugin template with basic structure' },
  { id: 'api', name: 'API Integration', description: 'Template for external API integration plugins' },
  { id: 'ui', name: 'UI Component', description: 'Template for creating custom UI components' },
  { id: 'automation', name: 'Automation Script', description: 'Template for automation and workflow plugins' }
])

// API resources
const apiResources = ref([
  { name: 'Plugin API', description: 'Core plugin system APIs and hooks' },
  { name: 'UI Components', description: 'Available UI components and styling guides' },
  { name: 'Database API', description: 'Database access and ORM documentation' },
  { name: 'Event System', description: 'Event broadcasting and subscription system' }
])

// Settings
const autoUpdate = ref(true)
const sandboxing = ref(true)
const developerMode = ref(false)

// Methods
function togglePlugin(plugin: any) {
  if (plugin.status === 'active') {
    plugin.status = 'inactive'
  } else if (plugin.status === 'inactive') {
    plugin.status = 'active'
  }
  console.log(`Plugin ${plugin.name} toggled to ${plugin.status}`)
}

function configurePlugin(plugin: any) {
  console.log(`Configuring plugin: ${plugin.name}`)
  // Open configuration modal or navigate to config page
}

function installPlugin(plugin: any) {
  console.log(`Installing plugin: ${plugin.name}`)
  // Add to installed plugins
  const newPlugin = {
    ...plugin,
    status: 'inactive'
  }
  installedPlugins.value.push(newPlugin)
}

function isPluginInstalled(pluginId: string): boolean {
  return installedPlugins.value.some(plugin => plugin.id === pluginId)
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'integration': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'automation': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'analytics': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'security': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'utility': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
  return colors[category] || colors.utility
}

function createNewPlugin() {
  console.log('Creating new plugin...')
  // Open plugin creation wizard
}

function openDocumentation() {
  console.log('Opening plugin documentation...')
  // Navigate to documentation or open in new tab
}

function useTemplate(template: any) {
  console.log(`Using template: ${template.name}`)
  // Initialize new plugin from template
}

function viewApiDocs(resource: any) {
  console.log(`Viewing API docs for: ${resource.name}`)
  // Open API documentation
}

function toggleAutoUpdate() {
  autoUpdate.value = !autoUpdate.value
  console.log(`Auto-update ${autoUpdate.value ? 'enabled' : 'disabled'}`)
}

function toggleSandboxing() {
  sandboxing.value = !sandboxing.value
  console.log(`Plugin sandboxing ${sandboxing.value ? 'enabled' : 'disabled'}`)
}

function toggleDeveloperMode() {
  developerMode.value = !developerMode.value
  console.log(`Developer mode ${developerMode.value ? 'enabled' : 'disabled'}`)
}

function clearPluginCache() {
  console.log('Clearing plugin cache...')
  // Clear plugin cache
}

function cleanupUnusedData() {
  console.log('Cleaning up unused plugin data...')
  // Remove unused plugin data
}

onMounted(() => {
  console.log('Plugin Manager view mounted')
})
</script>

<style scoped>
.plugins-view {
  min-height: 100vh;
}
</style>
