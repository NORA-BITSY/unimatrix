<template>
  <div class="ai-models-view p-6 space-y-8">
    <!-- Header with Quick Actions -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Models & Providers
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            Manage, monitor, and interact with your AI models
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="toggleRealTimeMonitoring"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              realTimeMonitoring 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            ]"
          >
            <div class="flex items-center space-x-2">
              <div :class="['w-2 h-2 rounded-full', realTimeMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400']"></div>
              <span>{{ realTimeMonitoring ? 'Live' : 'Static' }}</span>
            </div>
          </button>
          <button
            @click="showAddProviderModal = true"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Add Provider
          </button>
        </div>
      </div>

      <!-- Global Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Total Models</p>
              <p class="text-2xl font-bold">{{ totalModels }}</p>
            </div>
            <CpuChipIcon class="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium">Active Providers</p>
              <p class="text-2xl font-bold">{{ activeProviders }}</p>
            </div>
            <CloudIcon class="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm font-medium">Requests Today</p>
              <p class="text-2xl font-bold">{{ totalRequestsToday }}</p>
            </div>
            <ChartBarIcon class="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm font-medium">Avg Response</p>
              <p class="text-2xl font-bold">{{ avgResponseTime }}</p>
            </div>
            <ClockIcon class="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Provider Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        v-for="provider in aiProviders"
        :key="provider.name"
        class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                provider.color
              ]"
            >
              <component :is="provider.icon" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ provider.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ provider.description }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                provider.status === 'active' ? 'bg-green-500 animate-pulse' : 
                provider.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
              ]"
            ></div>
            <span 
              :class="[
                'text-xs font-medium px-2 py-1 rounded-full',
                provider.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                provider.status === 'limited' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              ]"
            >
              {{ provider.status }}
            </span>
          </div>
        </div>
        
        <div class="space-y-3 mb-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Models Available</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ provider.modelsCount }}</span>
              <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  :class="['h-2 rounded-full', provider.color]" 
                  :style="`width: ${Math.min(provider.modelsCount * 12.5, 100)}%`"
                ></div>
              </div>
            </div>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Requests Today</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ provider.requestsToday }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</span>
            <span 
              :class="[
                'text-sm font-medium',
                parseFloat(provider.avgResponseTime) < 1.0 ? 'text-green-600 dark:text-green-400' :
                parseFloat(provider.avgResponseTime) < 2.0 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              ]"
            >
              {{ provider.avgResponseTime }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Usage Limit</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ provider.usageLimit }}</span>
          </div>
        </div>

        <div class="flex space-x-2">
          <button
            @click="configureProvider(provider)"
            class="flex-1 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            Configure
          </button>
          <button
            @click="testProviderConnection(provider)"
            :disabled="provider.status === 'offline'"
            class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Test
          </button>
        </div>
      </div>
    </div>

    <!-- Model Performance Monitoring -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Model Performance Monitoring
          </h3>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">Last updated: {{ lastUpdated }}</span>
            <button
              @click="refreshPerformanceData"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowPathIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="metric in performanceMetrics"
            :key="metric.name"
            class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ metric.name }}</h4>
              <component :is="metric.icon" :class="['w-5 h-5', metric.color]" />
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Current</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ metric.current }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Target</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ metric.target }}</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  :class="['h-2 rounded-full transition-all duration-500', metric.color.replace('text-', 'bg-')]" 
                  :style="`width: ${metric.percentage}%`"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Available Models -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Available Models
          </h3>
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">View:</label>
              <select
                v-model="viewMode"
                class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </div>
            <select
              v-model="selectedProvider"
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Providers</option>
              <option v-for="provider in aiProviders" :key="provider.name" :value="provider.name">
                {{ provider.name }}
              </option>
            </select>
            <button
              @click="refreshModels"
              class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="model in filteredModels"
            :key="model.id"
            class="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ model.name }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ model.provider }}
                </p>
                <div class="flex items-center space-x-2 mb-3">
                  <div :class="['w-2 h-2 rounded-full', getModelStatusColor(model.status)]"></div>
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      model.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      model.status === 'loading' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    ]"
                  >
                    {{ model.status }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ model.version }}</span>
                </div>
              </div>
              <button
                @click="toggleModelFavorite(model)"
                :class="[
                  'p-2 rounded-lg transition-colors',
                  model.isFavorite 
                    ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                ]"
              >
                <StarIcon :class="['w-5 h-5', model.isFavorite ? 'fill-current' : '']" />
              </button>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {{ model.description }}
            </p>

            <!-- Model Metrics -->
            <div class="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div class="bg-white dark:bg-gray-900/50 rounded-lg p-2">
                <p class="text-gray-500 dark:text-gray-400">Latency</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ model.metrics?.latency || 'N/A' }}</p>
              </div>
              <div class="bg-white dark:bg-gray-900/50 rounded-lg p-2">
                <p class="text-gray-500 dark:text-gray-400">Accuracy</p>
                <p class="font-semibold text-gray-900 dark:text-white">{{ model.metrics?.accuracy || 'N/A' }}</p>
              </div>
            </div>

            <div class="space-y-3 mb-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="capability in model.capabilities"
                  :key="capability"
                  class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  {{ capability }}
                </span>
              </div>
            </div>

            <div class="flex space-x-2">
              <button
                @click="testModel(model)"
                :disabled="model.status !== 'available'"
                class="flex-1 px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test
              </button>
              <button
                @click="configureModel(model)"
                class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Configure
              </button>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="space-y-3">
          <div
            v-for="model in filteredModels"
            :key="model.id"
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="flex items-center space-x-4 flex-1">
              <div class="flex items-center space-x-3">
                <div :class="['w-3 h-3 rounded-full', getModelStatusColor(model.status)]"></div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ model.name }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ model.provider }} • {{ model.version }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Latency: {{ model.metrics?.latency || 'N/A' }}</span>
                <span>Accuracy: {{ model.metrics?.accuracy || 'N/A' }}</span>
                <span>{{ model.capabilities.length }} capabilities</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="toggleModelFavorite(model)"
                :class="[
                  'p-2 rounded-lg transition-colors',
                  model.isFavorite 
                    ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'text-gray-400 hover:text-yellow-500'
                ]"
              >
                <StarIcon :class="['w-4 h-4', model.isFavorite ? 'fill-current' : '']" />
              </button>
              <button
                @click="testModel(model)"
                :disabled="model.status !== 'available'"
                class="px-3 py-1 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test
              </button>
              <button
                @click="configureModel(model)"
                class="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Configure
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredModels.length === 0" class="text-center py-12">
          <CpuChipIcon class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p class="text-gray-600 dark:text-gray-400 font-medium">No models available</p>
          <p class="text-sm text-gray-500 dark:text-gray-500">Configure AI providers to see available models</p>
        </div>
      </div>
    </div>

    <!-- Enhanced AI Chat Interface -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            AI Chat Interface
          </h3>
          <div class="flex items-center space-x-3">
            <button
              @click="clearChat"
              class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              @click="saveChat"
              class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <div class="flex items-center space-x-4 mb-6">
          <div class="flex-1">
            <select
              v-model="selectedModel"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a model</option>
              <option
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }} ({{ model.provider }})
              </option>
            </select>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Temperature:</span>
            <input
              v-model="chatSettings.temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="w-20"
            >
            <span class="text-sm font-medium text-gray-900 dark:text-white w-8">{{ chatSettings.temperature }}</span>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 h-80 overflow-y-auto mb-4" ref="chatContainer">
          <div v-if="chatMessages.length === 0" class="text-center text-gray-500 dark:text-gray-400 mt-24">
            <ChatBubbleLeftRightIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p class="font-medium mb-1">Start a conversation with an AI model</p>
            <p class="text-sm">Select a model and type your message below</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="message in chatMessages"
              :key="message.id"
              :class="[
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                :class="[
                  'max-w-xs lg:max-w-md px-4 py-3 rounded-lg relative',
                  message.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm'
                ]"
              >
                <div v-if="message.role === 'assistant'" class="flex items-center space-x-2 mb-2">
                  <div class="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <SparklesIcon class="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ getModelNameById(selectedModel) }}</span>
                </div>
                <div class="prose prose-sm max-w-none">
                  {{ message.content }}
                </div>
                <div :class="[
                  'text-xs mt-2 opacity-75',
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                ]">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
            <div v-if="isLoading" class="flex justify-start">
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg rounded-bl-none p-4 shadow-sm">
                <div class="flex items-center space-x-2">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ getModelNameById(selectedModel) }} is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex space-x-3">
            <div class="flex-1 relative">
              <textarea
                v-model="newMessage"
                @keydown="handleKeyDown"
                rows="3"
                placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
                class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              ></textarea>
              <button
                @click="sendMessage"
                :disabled="!selectedModel || !newMessage.trim() || isLoading"
                class="absolute bottom-2 right-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon v-if="!isLoading" class="w-4 h-4" />
                <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </button>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="prompt in quickPrompts"
              :key="prompt"
              @click="useQuickPrompt(prompt)"
              :disabled="!selectedModel || isLoading"
              class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ prompt }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Model Training & Fine-tuning (Future Feature) -->
    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
          <AcademicCapIcon class="w-6 h-6 text-white" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Model Training & Fine-tuning
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Train custom models or fine-tune existing ones for your specific use cases.
          </p>
        </div>
        <button
          @click="showTrainingModal = true"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Coming Soon
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CloudIcon,
  SparklesIcon,
  CogIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/vue/24/outline'

// Interface definitions
interface AIModel {
  id: string
  name: string
  provider: string
  status: string
  description: string
  capabilities: string[]
  version: string
  isFavorite: boolean
  metrics?: {
    latency: string
    accuracy: string
  }
}

interface AIProvider {
  name: string
  description: string
  status: string
  modelsCount: number
  requestsToday: string
  avgResponseTime: string
  usageLimit: string
  color: string
  icon: any
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface PerformanceMetric {
  name: string
  current: string
  target: string
  percentage: number
  color: string
  icon: any
}

// Reactive state
const realTimeMonitoring = ref(false)
const showAddProviderModal = ref(false)
const showTrainingModal = ref(false)
const viewMode = ref('grid')
const selectedProvider = ref('')
const selectedModel = ref('')
const newMessage = ref('')
const isLoading = ref(false)
const lastUpdated = ref(new Date().toLocaleTimeString())

// Chat settings
const chatSettings = ref({
  temperature: 0.7,
  maxTokens: 1000
})

// Quick prompts for chat
const quickPrompts = ref([
  'Explain this concept',
  'Write a summary',
  'Generate code',
  'Translate text',
  'Debug error'
])

// AI Providers with enhanced data
const aiProviders = ref<AIProvider[]>([
  {
    name: 'OpenAI',
    description: 'GPT models and embeddings',
    status: 'limited',
    modelsCount: 8,
    requestsToday: '1,234',
    avgResponseTime: '1.2s',
    usageLimit: '85% used',
    color: 'bg-green-500',
    icon: SparklesIcon
  },
  {
    name: 'Anthropic',
    description: 'Claude AI models',
    status: 'limited',
    modelsCount: 3,
    requestsToday: '456',
    avgResponseTime: '0.9s',
    usageLimit: '45% used',
    color: 'bg-purple-500',
    icon: CloudIcon
  },
  {
    name: 'Local Models',
    description: 'Self-hosted AI models',
    status: 'active',
    modelsCount: 2,
    requestsToday: '89',
    avgResponseTime: '2.1s',
    usageLimit: 'Unlimited',
    color: 'bg-blue-500',
    icon: CogIcon
  }
])

// AI Models with enhanced data
const aiModels = ref<AIModel[]>([
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    status: 'available',
    description: 'Most capable GPT model, great for complex tasks',
    capabilities: ['text-generation', 'reasoning', 'code'],
    version: 'v4.0',
    isFavorite: true,
    metrics: {
      latency: '1.2s',
      accuracy: '95%'
    }
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    status: 'available',
    description: 'Fast and efficient for most conversational tasks',
    capabilities: ['text-generation', 'chat'],
    version: 'v3.5',
    isFavorite: false,
    metrics: {
      latency: '0.8s',
      accuracy: '89%'
    }
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    status: 'available',
    description: 'Advanced reasoning and analysis capabilities',
    capabilities: ['text-generation', 'analysis', 'reasoning'],
    version: 'v3.0',
    isFavorite: true,
    metrics: {
      latency: '0.9s',
      accuracy: '92%'
    }
  },
  {
    id: 'local-llama',
    name: 'Local Llama',
    provider: 'Local Models',
    status: 'available',
    description: 'Self-hosted Llama model for privacy',
    capabilities: ['text-generation', 'local-processing'],
    version: 'v2.0',
    isFavorite: false,
    metrics: {
      latency: '2.1s',
      accuracy: '87%'
    }
  }
])

// Performance metrics
const performanceMetrics = ref<PerformanceMetric[]>([
  {
    name: 'Response Time',
    current: '1.2s avg',
    target: '< 1.0s',
    percentage: 75,
    color: 'text-yellow-500',
    icon: ClockIcon
  },
  {
    name: 'Success Rate',
    current: '98.5%',
    target: '> 99%',
    percentage: 95,
    color: 'text-green-500',
    icon: ChartBarIcon
  },
  {
    name: 'Token Usage',
    current: '2.4M/day',
    target: '< 3M/day',
    percentage: 80,
    color: 'text-blue-500',
    icon: CpuChipIcon
  }
])

// Chat messages
const chatMessages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    content: 'Hello! I\'m your AI assistant. How can I help you today?',
    timestamp: Date.now() - 300000
  }
])

// Chat container reference
const chatContainer = ref<HTMLElement>()

// Computed properties
const filteredModels = computed(() => {
  if (!selectedProvider.value) return aiModels.value
  return aiModels.value.filter(model => model.provider === selectedProvider.value)
})

const availableModels = computed(() => {
  return aiModels.value.filter(model => model.status === 'available')
})

const totalModels = computed(() => aiModels.value.length)

const activeProviders = computed(() => 
  aiProviders.value.filter(p => p.status === 'active').length
)

const totalRequestsToday = computed(() => {
  const total = aiProviders.value.reduce((sum, provider) => {
    return sum + parseInt(provider.requestsToday.replace(/,/g, ''))
  }, 0)
  return total.toLocaleString()
})

const avgResponseTime = computed(() => {
  const times = aiProviders.value.map(p => parseFloat(p.avgResponseTime))
  const avg = times.reduce((sum, time) => sum + time, 0) / times.length
  return `${avg.toFixed(1)}s`
})

// Methods
function toggleRealTimeMonitoring() {
  realTimeMonitoring.value = !realTimeMonitoring.value
  if (realTimeMonitoring.value) {
    // Start real-time updates
    console.log('Starting real-time monitoring')
  } else {
    console.log('Stopping real-time monitoring')
  }
}

function refreshPerformanceData() {
  lastUpdated.value = new Date().toLocaleTimeString()
  console.log('Refreshing performance data...')
}

function getModelStatusColor(status: string) {
  switch (status) {
    case 'available': return 'bg-green-500'
    case 'loading': return 'bg-yellow-500'
    default: return 'bg-red-500'
  }
}

function toggleModelFavorite(model: AIModel) {
  model.isFavorite = !model.isFavorite
  console.log(`${model.name} ${model.isFavorite ? 'added to' : 'removed from'} favorites`)
}

function getModelNameById(modelId: string) {
  const model = aiModels.value.find(m => m.id === modelId)
  return model ? model.name : 'Unknown Model'
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function configureProvider(provider: AIProvider) {
  console.log('Configure provider:', provider.name)
  // Implement provider configuration
}

function testProviderConnection(provider: AIProvider) {
  console.log('Testing connection to:', provider.name)
  // Implement connection test
}

function refreshModels() {
  console.log('Refreshing models...')
  // Implement model refresh
}

function testModel(model: AIModel) {
  console.log('Testing model:', model.name)
  selectedModel.value = model.id
  newMessage.value = `Test the ${model.name} model with a simple response.`
  sendMessage()
}

function configureModel(model: AIModel) {
  console.log('Configure model:', model.name)
  // Implement model configuration
}

function clearChat() {
  chatMessages.value = [
    {
      id: Date.now(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: Date.now()
    }
  ]
}

function saveChat() {
  console.log('Saving chat history...')
  // Implement chat save functionality
}

function useQuickPrompt(prompt: string) {
  newMessage.value = prompt
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function sendMessage() {
  if (!newMessage.value.trim() || !selectedModel.value) return

  // Add user message
  chatMessages.value.push({
    id: Date.now(),
    role: 'user',
    content: newMessage.value,
    timestamp: Date.now()
  })

  const userMessage = newMessage.value
  newMessage.value = ''
  isLoading.value = true

  // Scroll to bottom
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })

  // Simulate AI response
  setTimeout(() => {
    const selectedModelData = aiModels.value.find(m => m.id === selectedModel.value)
    const responses = [
      `As ${selectedModelData?.name}, I understand you're asking about: "${userMessage}". This is a comprehensive response that would come from the actual AI model.`,
      `Thank you for your question about "${userMessage}". Based on my training, I can provide detailed insights on this topic.`,
      `Interesting question! Let me analyze "${userMessage}" and provide a thoughtful response from the perspective of ${selectedModelData?.name}.`
    ]
    
    chatMessages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: Date.now()
    })
    
    isLoading.value = false
    
    // Scroll to bottom
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }, 1000 + Math.random() * 2000) // Random delay between 1-3 seconds
}

onMounted(() => {
  console.log('AI Models view mounted')
  // Initialize real-time monitoring if needed
  if (realTimeMonitoring.value) {
    toggleRealTimeMonitoring()
  }
})
</script>

<style scoped>
/* Enhanced animations and transitions */
.ai-models-view {
  min-height: 100vh;
}

/* Global stats animation */
.ai-models-view .bg-gradient-to-r {
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Provider cards hover effects */
.ai-models-view .group:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dark .ai-models-view .group:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

/* Model cards enhanced styling */
.ai-models-view .bg-gradient-to-br {
  transition: all 0.3s ease;
}

.ai-models-view .bg-gradient-to-br:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}

.dark .ai-models-view .bg-gradient-to-br:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

/* Performance metrics animations */
.ai-models-view .bg-gray-50 {
  position: relative;
  overflow: hidden;
}

.ai-models-view .bg-gray-50::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.ai-models-view .bg-gray-50:hover::before {
  left: 100%;
}

/* Chat interface enhancements */
.ai-models-view .prose {
  color: inherit;
}

.ai-models-view .prose p {
  margin: 0;
}

/* Loading animation */
.ai-models-view .animate-bounce {
  animation: bounce 1.4s infinite;
}

.ai-models-view .animate-bounce:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-models-view .animate-bounce:nth-child(3) {
  animation-delay: 0.4s;
}

/* Progress bars */
.ai-models-view .progress-bar {
  transition: width 0.5s ease-in-out;
}

/* Button hover effects */
.ai-models-view button {
  transition: all 0.2s ease;
}

.ai-models-view button:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* Status indicators */
.ai-models-view .animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Chat bubble animations */
.ai-models-view .rounded-br-none,
.ai-models-view .rounded-bl-none {
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Favorite star animation */
.ai-models-view .fill-current {
  animation: starPulse 0.3s ease-out;
}

@keyframes starPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Scrollbar styling for chat */
.ai-models-view .overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.ai-models-view .overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.ai-models-view .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.ai-models-view .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* Text truncation for model descriptions */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Enhanced focus states */
.ai-models-view input:focus,
.ai-models-view select:focus,
.ai-models-view textarea:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Dark mode enhancements */
.dark .ai-models-view .bg-gray-850 {
  background-color: rgb(17, 24, 39);
}

/* Responsive text scaling */
@media (max-width: 640px) {
  .ai-models-view h1 {
    font-size: 2rem;
  }
  
  .ai-models-view .text-3xl {
    font-size: 1.5rem;
  }
}
</style>
