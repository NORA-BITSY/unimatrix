<template>
  <div class="settings-view p-6 space-y-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        System Settings
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Configure system preferences, security, and user settings
      </p>
    </div>

    <!-- Settings Navigation -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex space-x-6">
          <button
            v-for="tab in settingsTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
          >
            <span class="mr-2">{{ tab.icon }}</span>
            {{ tab.name }}
          </button>
        </div>
      </div>

      <!-- General Settings -->
      <div v-if="activeTab === 'general'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              General Settings
            </h3>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  System Name
                </label>
                <input
                  v-model="generalSettings.systemName"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Zone
                </label>
                <select
                  v-model="generalSettings.timeZone"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  v-model="generalSettings.language"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  v-model="generalSettings.theme"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Preferences
            </h4>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Auto-save settings</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Automatically save configuration changes</p>
                </div>
                <button
                  @click="toggleSetting('autoSave')"
                  :class="getToggleClasses(generalSettings.autoSave)"
                >
                  <span :class="getToggleSpanClasses(generalSettings.autoSave)"></span>
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Desktop notifications</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Show system notifications on desktop</p>
                </div>
                <button
                  @click="toggleSetting('notifications')"
                  :class="getToggleClasses(generalSettings.notifications)"
                >
                  <span :class="getToggleSpanClasses(generalSettings.notifications)"></span>
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Sound effects</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Play sounds for system events</p>
                </div>
                <button
                  @click="toggleSetting('soundEffects')"
                  :class="getToggleClasses(generalSettings.soundEffects)"
                >
                  <span :class="getToggleSpanClasses(generalSettings.soundEffects)"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div v-if="activeTab === 'security'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Security & Authentication
            </h3>
            
            <div class="space-y-6">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Password Policy
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Length
                    </label>
                    <input
                      v-model="securitySettings.passwordMinLength"
                      type="number"
                      min="8"
                      max="64"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      v-model="securitySettings.sessionTimeout"
                      type="number"
                      min="5"
                      max="1440"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div class="mt-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Require uppercase letters</span>
                    <button
                      @click="toggleSecuritySetting('requireUppercase')"
                      :class="getToggleClasses(securitySettings.requireUppercase)"
                    >
                      <span :class="getToggleSpanClasses(securitySettings.requireUppercase)"></span>
                    </button>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Require special characters</span>
                    <button
                      @click="toggleSecuritySetting('requireSpecialChars')"
                      :class="getToggleClasses(securitySettings.requireSpecialChars)"
                    >
                      <span :class="getToggleSpanClasses(securitySettings.requireSpecialChars)"></span>
                    </button>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Enable two-factor authentication</span>
                    <button
                      @click="toggleSecuritySetting('twoFactorAuth')"
                      :class="getToggleClasses(securitySettings.twoFactorAuth)"
                    >
                      <span :class="getToggleSpanClasses(securitySettings.twoFactorAuth)"></span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  API Security
                </h4>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Enable API rate limiting</span>
                    <button
                      @click="toggleSecuritySetting('apiRateLimit')"
                      :class="getToggleClasses(securitySettings.apiRateLimit)"
                    >
                      <span :class="getToggleSpanClasses(securitySettings.apiRateLimit)"></span>
                    </button>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Require API key authentication</span>
                    <button
                      @click="toggleSecuritySetting('apiKeyAuth')"
                      :class="getToggleClasses(securitySettings.apiKeyAuth)"
                    >
                      <span :class="getToggleSpanClasses(securitySettings.apiKeyAuth)"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Settings -->
      <div v-if="activeTab === 'network'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Network Configuration
            </h3>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Server Port
                </label>
                <input
                  v-model="networkSettings.serverPort"
                  type="number"
                  min="1024"
                  max="65535"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Connections
                </label>
                <input
                  v-model="networkSettings.maxConnections"
                  type="number"
                  min="10"
                  max="10000"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Timeout (seconds)
                </label>
                <input
                  v-model="networkSettings.requestTimeout"
                  type="number"
                  min="5"
                  max="300"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proxy Server
                </label>
                <input
                  v-model="networkSettings.proxyServer"
                  type="text"
                  placeholder="http://proxy.example.com:8080"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Enable HTTPS</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Use SSL/TLS encryption for all connections</p>
                </div>
                <button
                  @click="toggleNetworkSetting('httpsEnabled')"
                  :class="getToggleClasses(networkSettings.httpsEnabled)"
                >
                  <span :class="getToggleSpanClasses(networkSettings.httpsEnabled)"></span>
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">CORS enabled</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Allow cross-origin resource sharing</p>
                </div>
                <button
                  @click="toggleNetworkSetting('corsEnabled')"
                  :class="getToggleClasses(networkSettings.corsEnabled)"
                >
                  <span :class="getToggleSpanClasses(networkSettings.corsEnabled)"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Database Settings -->
      <div v-if="activeTab === 'database'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Database Configuration
            </h3>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Database Type
                </label>
                <select
                  v-model="databaseSettings.type"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="sqlite">SQLite</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Connection Pool Size
                </label>
                <input
                  v-model="databaseSettings.poolSize"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Backup Interval (hours)
                </label>
                <input
                  v-model="databaseSettings.backupInterval"
                  type="number"
                  min="1"
                  max="168"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Query Timeout (seconds)
                </label>
                <input
                  v-model="databaseSettings.queryTimeout"
                  type="number"
                  min="1"
                  max="600"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Auto-backup enabled</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Automatically backup database at regular intervals</p>
                </div>
                <button
                  @click="toggleDatabaseSetting('autoBackup')"
                  :class="getToggleClasses(databaseSettings.autoBackup)"
                >
                  <span :class="getToggleSpanClasses(databaseSettings.autoBackup)"></span>
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Query logging</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Log all database queries for debugging</p>
                </div>
                <button
                  @click="toggleDatabaseSetting('queryLogging')"
                  :class="getToggleClasses(databaseSettings.queryLogging)"
                >
                  <span :class="getToggleSpanClasses(databaseSettings.queryLogging)"></span>
                </button>
              </div>
            </div>

            <div class="mt-6 flex space-x-3">
              <button
                @click="testDatabaseConnection"
                class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Test Connection
              </button>
              <button
                @click="optimizeDatabase"
                class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Optimize Database
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div v-if="activeTab === 'advanced'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Advanced Configuration
            </h3>
            
            <div class="space-y-6">
              <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div class="flex items-start">
                  <span class="text-yellow-500 text-lg mr-3">⚠️</span>
                  <div>
                    <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Advanced Settings Warning
                    </h4>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      These settings are for advanced users only. Incorrect configuration may cause system instability.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Debug mode</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Enable detailed logging and debugging features</p>
                  </div>
                  <button
                    @click="toggleAdvancedSetting('debugMode')"
                    :class="getToggleClasses(advancedSettings.debugMode)"
                  >
                    <span :class="getToggleSpanClasses(advancedSettings.debugMode)"></span>
                  </button>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Experimental features</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Enable beta features and experimental functionality</p>
                  </div>
                  <button
                    @click="toggleAdvancedSetting('experimentalFeatures')"
                    :class="getToggleClasses(advancedSettings.experimentalFeatures)"
                  >
                    <span :class="getToggleSpanClasses(advancedSettings.experimentalFeatures)"></span>
                  </button>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Performance monitoring</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Collect detailed performance metrics</p>
                  </div>
                  <button
                    @click="toggleAdvancedSetting('performanceMonitoring')"
                    :class="getToggleClasses(advancedSettings.performanceMonitoring)"
                  >
                    <span :class="getToggleSpanClasses(advancedSettings.performanceMonitoring)"></span>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Configuration (JSON)
                </label>
                <textarea
                  v-model="advancedSettings.customConfig"
                  rows="8"
                  placeholder='{"feature": "value", "setting": true}'
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Settings -->
    <div class="flex justify-end space-x-3">
      <button
        @click="resetToDefaults"
        class="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        Reset to Defaults
      </button>
      <button
        @click="saveSettings"
        class="px-6 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Save Settings
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Settings tabs
const settingsTabs = ref([
  { id: 'general', name: 'General', icon: '⚙️' },
  { id: 'security', name: 'Security', icon: '🔒' },
  { id: 'network', name: 'Network', icon: '🌐' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'advanced', name: 'Advanced', icon: '🔧' }
])

const activeTab = ref('general')

// General settings
const generalSettings = ref({
  systemName: 'EPMatrix System',
  timeZone: 'UTC',
  language: 'en',
  theme: 'system',
  autoSave: true,
  notifications: true,
  soundEffects: false
})

// Security settings
const securitySettings = ref({
  passwordMinLength: 12,
  sessionTimeout: 120,
  requireUppercase: true,
  requireSpecialChars: true,
  twoFactorAuth: false,
  apiRateLimit: true,
  apiKeyAuth: true
})

// Network settings
const networkSettings = ref({
  serverPort: 3001,
  maxConnections: 1000,
  requestTimeout: 30,
  proxyServer: '',
  httpsEnabled: true,
  corsEnabled: true
})

// Database settings
const databaseSettings = ref({
  type: 'sqlite',
  poolSize: 10,
  backupInterval: 24,
  queryTimeout: 30,
  autoBackup: true,
  queryLogging: false
})

// Advanced settings
const advancedSettings = ref({
  debugMode: false,
  experimentalFeatures: false,
  performanceMonitoring: true,
  customConfig: '{\n  "example": "value",\n  "feature": true\n}'
})

// Helper methods for toggle switches
function getToggleClasses(isEnabled: boolean): string {
  return [
    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    isEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
  ].join(' ')
}

function getToggleSpanClasses(isEnabled: boolean): string {
  return [
    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
    isEnabled ? 'translate-x-5' : 'translate-x-0'
  ].join(' ')
}

// Settings toggle methods
function toggleSetting(setting: 'autoSave' | 'notifications' | 'soundEffects') {
  generalSettings.value[setting] = !generalSettings.value[setting]
  console.log(`General setting ${setting} toggled to ${generalSettings.value[setting]}`)
}

function toggleSecuritySetting(setting: keyof typeof securitySettings.value) {
  if (typeof securitySettings.value[setting] === 'boolean') {
    (securitySettings.value[setting] as boolean) = !(securitySettings.value[setting] as boolean)
    console.log(`Security setting ${setting} toggled to ${securitySettings.value[setting]}`)
  }
}

function toggleNetworkSetting(setting: keyof typeof networkSettings.value) {
  if (typeof networkSettings.value[setting] === 'boolean') {
    (networkSettings.value[setting] as boolean) = !(networkSettings.value[setting] as boolean)
    console.log(`Network setting ${setting} toggled to ${networkSettings.value[setting]}`)
  }
}

function toggleDatabaseSetting(setting: keyof typeof databaseSettings.value) {
  if (typeof databaseSettings.value[setting] === 'boolean') {
    (databaseSettings.value[setting] as boolean) = !(databaseSettings.value[setting] as boolean)
    console.log(`Database setting ${setting} toggled to ${databaseSettings.value[setting]}`)
  }
}

function toggleAdvancedSetting(setting: keyof typeof advancedSettings.value) {
  if (typeof advancedSettings.value[setting] === 'boolean') {
    (advancedSettings.value[setting] as boolean) = !(advancedSettings.value[setting] as boolean)
    console.log(`Advanced setting ${setting} toggled to ${advancedSettings.value[setting]}`)
  }
}

// Database operations
function testDatabaseConnection() {
  console.log('Testing database connection...')
  // Simulate database connection test
  setTimeout(() => {
    alert('Database connection successful!')
  }, 1000)
}

function optimizeDatabase() {
  console.log('Optimizing database...')
  // Simulate database optimization
  setTimeout(() => {
    alert('Database optimization complete!')
  }, 2000)
}

// Settings management
function saveSettings() {
  console.log('Saving settings...')
  
  const allSettings = {
    general: generalSettings.value,
    security: securitySettings.value,
    network: networkSettings.value,
    database: databaseSettings.value,
    advanced: advancedSettings.value
  }
  
  // Simulate API call to save settings
  setTimeout(() => {
    console.log('Settings saved successfully:', allSettings)
    alert('Settings saved successfully!')
  }, 1000)
}

function resetToDefaults() {
  if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
    console.log('Resetting settings to defaults...')
    
    // Reset all settings to defaults
    generalSettings.value = {
      systemName: 'EPMatrix System',
      timeZone: 'UTC',
      language: 'en',
      theme: 'system',
      autoSave: true,
      notifications: true,
      soundEffects: false
    }
    
    securitySettings.value = {
      passwordMinLength: 12,
      sessionTimeout: 120,
      requireUppercase: true,
      requireSpecialChars: true,
      twoFactorAuth: false,
      apiRateLimit: true,
      apiKeyAuth: true
    }
    
    networkSettings.value = {
      serverPort: 3001,
      maxConnections: 1000,
      requestTimeout: 30,
      proxyServer: '',
      httpsEnabled: true,
      corsEnabled: true
    }
    
    databaseSettings.value = {
      type: 'sqlite',
      poolSize: 10,
      backupInterval: 24,
      queryTimeout: 30,
      autoBackup: true,
      queryLogging: false
    }
    
    advancedSettings.value = {
      debugMode: false,
      experimentalFeatures: false,
      performanceMonitoring: true,
      customConfig: '{\n  "example": "value",\n  "feature": true\n}'
    }
    
    alert('Settings reset to defaults!')
  }
}

onMounted(() => {
  console.log('Settings view mounted')
  // Load current settings from API
})
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
}
</style>
