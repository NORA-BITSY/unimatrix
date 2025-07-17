<template>
  <div class="analytics-view p-6 space-y-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Analytics Dashboard
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Comprehensive analytics and performance metrics
      </p>
    </div>

    <!-- Time Range Selector -->
    <div class="mb-8">
      <div class="flex flex-wrap gap-3">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          @click="selectedTimeRange = range.value"
          :class="[
            'px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200',
            selectedTimeRange === range.value
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md'
          ]"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="metric in keyMetrics"
        :key="metric.label"
        class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {{ metric.label }}
            </p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {{ metric.value }}
            </p>
            <div class="flex items-center">
              <span
                :class="[
                  'text-sm font-medium flex items-center px-2 py-1 rounded-full',
                  metric.change > 0 ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20' : 
                  metric.change < 0 ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20' : 
                  'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
                ]"
              >
                <component
                  :is="metric.change > 0 ? ArrowUpIcon : metric.change < 0 ? ArrowDownIcon : MinusIcon"
                  class="w-3 h-3 mr-1"
                />
                {{ Math.abs(metric.change) }}%
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                vs {{ selectedTimeRange }}
              </span>
            </div>
          </div>
          <div
            :class="[
              'w-14 h-14 rounded-xl flex items-center justify-center ml-4',
              metric.color
            ]"
          >
            <component :is="metric.icon" class="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Traffic Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Traffic Overview
          </h3>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Live Data</span>
          </div>
        </div>
        <div class="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div class="text-center">
            <ChartBarIcon class="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p class="text-gray-600 dark:text-gray-400 font-medium">Interactive Chart</p>
            <p class="text-sm text-gray-500 dark:text-gray-500">Chart.js integration ready</p>
          </div>
        </div>
      </div>

      <!-- Performance Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h3>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Optimal</span>
          </div>
        </div>
        <div class="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div class="text-center">
            <ChartBarIcon class="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p class="text-gray-600 dark:text-gray-400 font-medium">Performance Dashboard</p>
            <p class="text-sm text-gray-500 dark:text-gray-500">Real-time monitoring active</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Analytics Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Detailed Analytics
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Metric
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Current
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Previous
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Change
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="row in analyticsData" :key="row.metric">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ row.metric }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ row.current }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ row.previous }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    row.change > 0
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : row.change < 0
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  ]"
                >
                  {{ row.change > 0 ? '+' : '' }}{{ row.change }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/vue/24/outline'

// Time range options
const timeRanges = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' }
]

const selectedTimeRange = ref('24h')

// Key metrics
const keyMetrics = ref([
  {
    label: 'Total Visitors',
    value: '24,567',
    change: 12.5,
    color: 'bg-blue-500',
    icon: UsersIcon
  },
  {
    label: 'Page Views',
    value: '89,342',
    change: 8.2,
    color: 'bg-green-500',
    icon: ChartBarIcon
  },
  {
    label: 'Avg Session Time',
    value: '4m 32s',
    change: -2.1,
    color: 'bg-purple-500',
    icon: ClockIcon
  },
  {
    label: 'Bounce Rate',
    value: '34.2%',
    change: -5.8,
    color: 'bg-orange-500',
    icon: ExclamationTriangleIcon
  }
])

// Analytics data for table
const analyticsData = ref([
  { metric: 'Unique Visitors', current: '18,542', previous: '16,421', change: 12.9 },
  { metric: 'Page Views', current: '89,342', previous: '82,156', change: 8.7 },
  { metric: 'Sessions', current: '24,567', previous: '21,890', change: 12.2 },
  { metric: 'New Users', current: '8,945', previous: '7,654', change: 16.9 },
  { metric: 'Returning Users', current: '15,622', previous: '14,236', change: 9.7 }
])

onMounted(() => {
  // Load analytics data when component mounts
  // This would typically fetch real data from the API
  console.log('Analytics view mounted, loading data...')
})
</script>

<style scoped>
/* Custom animations for metric cards */
.analytics-view .bg-white {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.analytics-view .bg-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.dark .analytics-view .bg-white:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
</style>
