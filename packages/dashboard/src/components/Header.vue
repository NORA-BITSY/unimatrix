<template>
  <header class="header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
    <div class="flex items-center justify-between">
      <!-- Left Section -->
      <div class="flex items-center space-x-4">
        <!-- Mobile Menu Toggle -->
        <button
          @click="themeStore.toggleSidebar()"
          class="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>

        <!-- Breadcrumb -->
        <nav class="hidden md:flex" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2">
            <li v-for="(breadcrumb, index) in breadcrumbs" :key="index" class="flex items-center">
              <router-link
                v-if="breadcrumb.to"
                :to="breadcrumb.to"
                class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {{ breadcrumb.name }}
              </router-link>
              <span
                v-else
                class="text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ breadcrumb.name }}
              </span>
              <ChevronRightIcon
                v-if="index < breadcrumbs.length - 1"
                class="w-4 h-4 text-gray-400 mx-2"
              />
            </li>
          </ol>
        </nav>
      </div>

      <!-- Center Section - Search -->
      <div class="hidden md:flex flex-1 max-w-md mx-4">
        <div class="relative w-full">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
          </div>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            @input="handleSearch"
          />
          <!-- Search Results Dropdown -->
          <div
            v-if="searchResults.length > 0 && searchQuery"
            class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
          >
            <div class="max-h-64 overflow-y-auto">
              <div
                v-for="result in searchResults"
                :key="result.id"
                @click="selectSearchResult(result)"
                class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div class="flex items-center">
                  <component :is="result.icon" class="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ result.title }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ result.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex items-center space-x-3">
        <!-- Connection Status -->
        <div class="flex items-center space-x-2">
          <div
            :class="[
              'w-2 h-2 rounded-full',
              wsStore.isConnected ? 'bg-green-500' : 'bg-red-500'
            ]"
          ></div>
          <span class="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
            {{ wsStore.isConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>

        <!-- Notifications -->
        <div class="relative">
          <button
            @click="showNotifications = !showNotifications"
            class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 relative"
          >
            <BellIcon class="w-5 h-5" />
            <span
              v-if="unreadNotifications > 0"
              class="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full"
            >
              {{ unreadNotifications > 99 ? '99+' : unreadNotifications }}
            </span>
          </button>

          <!-- Notifications Dropdown -->
          <div
            v-if="showNotifications"
            v-click-outside="() => showNotifications = false"
            class="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
          >
            <div class="p-4 border-b border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                <button
                  @click="notificationStore.clear()"
                  class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div
                v-for="notification in notificationStore.notifications.slice(0, 5)"
                :key="notification.id"
                class="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div class="flex items-start">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full mt-2 mr-3',
                      {
                        'bg-green-500': notification.type === 'success',
                        'bg-red-500': notification.type === 'error',
                        'bg-yellow-500': notification.type === 'warning',
                        'bg-blue-500': notification.type === 'info'
                      }
                    ]"
                  ></div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ notification.title }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ notification.message }}
                    </p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {{ formatTime(notification.timestamp) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-2 border-t border-gray-200 dark:border-gray-600">
              <router-link
                to="/notifications"
                class="block w-full text-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 py-2"
              >
                View all notifications
              </router-link>
            </div>
          </div>
        </div>

        <!-- Theme Toggle -->
        <button
          @click="themeStore.toggleTheme()"
          class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <SunIcon v-if="themeStore.isDark" class="w-5 h-5" />
          <MoonIcon v-else class="w-5 h-5" />
        </button>

        <!-- User Menu -->
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center space-x-2 p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <UserIcon class="w-4 h-4" />
            </div>
            <ChevronDownIcon class="w-4 h-4" />
          </button>

          <!-- User Menu Dropdown -->
          <div
            v-if="showUserMenu"
            v-click-outside="() => showUserMenu = false"
            class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
          >
            <div class="p-3 border-b border-gray-200 dark:border-gray-600">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ authStore.user?.name || 'User' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ authStore.user?.email }}
              </p>
            </div>
            <div class="py-1">
              <router-link
                to="/profile"
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Profile
              </router-link>
              <router-link
                to="/settings"
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Settings
              </router-link>
              <button
                @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useWebSocketStore } from '../stores/websocket'
import { useNotificationStore } from '../stores/notifications'
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const wsStore = useWebSocketStore()
const notificationStore = useNotificationStore()

// Reactive state
const searchQuery = ref('')
const searchResults = ref<Array<{
  id: number
  title: string
  description: string
  icon: string
  to: string
}>>([])
const showNotifications = ref(false)
const showUserMenu = ref(false)
const searchDebounceTimer = ref<number | null>(null)

// Computed
const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const breadcrumbs: Array<{ name: string; to: string | null }> = [{ name: 'Dashboard', to: '/' }]
  
  let currentPath = ''
  pathSegments.forEach(segment => {
    currentPath += `/${segment}`
    const name = segment.charAt(0).toUpperCase() + segment.slice(1)
    
    if (currentPath === route.path) {
      breadcrumbs.push({ name, to: null })
    } else {
      breadcrumbs.push({ name, to: currentPath })
    }
  })
  
  return breadcrumbs
})

const unreadNotifications = computed(() => {
  return notificationStore.notifications.length
})

// Methods
function handleSearch() {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  
  searchDebounceTimer.value = window.setTimeout(() => {
    if (searchQuery.value.trim()) {
      performSearch(searchQuery.value)
    } else {
      searchResults.value = []
    }
  }, 300)
}

function performSearch(query: string) {
  // Mock search results - in real app, this would call an API
  const mockResults = [
    { id: 1, title: 'Analytics Dashboard', description: 'View system analytics', icon: 'ChartBarIcon', to: '/analytics' },
    { id: 2, title: 'AI Models', description: 'Manage AI models', icon: 'CpuChipIcon', to: '/ai' },
    { id: 3, title: 'Plugin Settings', description: 'Configure plugins', icon: 'PuzzlePieceIcon', to: '/plugins' },
    { id: 4, title: 'System Logs', description: 'View system logs', icon: 'DocumentTextIcon', to: '/logs' }
  ]
  
  searchResults.value = mockResults.filter(result =>
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description.toLowerCase().includes(query.toLowerCase())
  )
}

function selectSearchResult(result: any) {
  router.push(result.to)
  searchQuery.value = ''
  searchResults.value = []
}

function formatTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

// Close dropdowns when clicking outside
interface HTMLElementWithClickOutside extends HTMLElement {
  clickOutsideEvent?: (event: Event) => void
}

const vClickOutside = {
  beforeMount(el: HTMLElementWithClickOutside, binding: any) {
    el.clickOutsideEvent = function(event: Event) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: HTMLElementWithClickOutside) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(8px);
}
</style>
