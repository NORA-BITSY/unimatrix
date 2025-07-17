<template>
  <aside 
    :class="[
      'sidebar',
      'h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
      'transition-all duration-300 ease-in-out',
      themeStore.config.sidebarCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Logo and Brand -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">U</span>
        </div>
        <transition name="sidebar-text">
          <div v-if="!themeStore.config.sidebarCollapsed" class="ml-3">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">UniMatrix</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Enterprise Dashboard</p>
          </div>
        </transition>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        <li v-for="item in navigationItems" :key="item.name">
          <router-link
            :to="item.to"
            :class="[
              'nav-item',
              'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              $route.path === item.to
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300'
            ]"
          >
            <component 
              :is="item.icon" 
              :class="[
                'w-5 h-5',
                themeStore.config.sidebarCollapsed ? 'mx-auto' : 'mr-3'
              ]"
            />
            <transition name="sidebar-text">
              <span v-if="!themeStore.config.sidebarCollapsed">{{ item.name }}</span>
            </transition>
            <transition name="sidebar-text">
              <span 
                v-if="!themeStore.config.sidebarCollapsed && item.badge" 
                class="ml-auto px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full"
              >
                {{ item.badge }}
              </span>
            </transition>
          </router-link>
        </li>
      </ul>

      <!-- Collapse Toggle -->
      <div class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="themeStore.toggleSidebar()"
          class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeftIcon 
            :class="[
              'w-5 h-5 transition-transform',
              themeStore.config.sidebarCollapsed ? 'rotate-180' : ''
            ]"
          />
          <transition name="sidebar-text">
            <span v-if="!themeStore.config.sidebarCollapsed" class="ml-2">Collapse</span>
          </transition>
        </button>
      </div>
    </nav>

    <!-- User Menu -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <UserIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
        <transition name="sidebar-text">
          <div v-if="!themeStore.config.sidebarCollapsed" class="ml-3 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ authStore.user?.name || authStore.user?.email || 'User' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ authStore.user?.email }}
            </p>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import {
  HomeIcon,
  ChartBarIcon,
  CpuChipIcon,
  CubeIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const navigationItems = computed(() => [
  {
    name: 'Dashboard',
    to: '/',
    icon: HomeIcon
  },
  {
    name: 'Analytics',
    to: '/analytics',
    icon: ChartBarIcon
  },
  {
    name: 'AI Models',
    to: '/ai',
    icon: CpuChipIcon
  },
  {
    name: 'Blockchain',
    to: '/blockchain',
    icon: CubeIcon
  },
  {
    name: 'IoT Devices',
    to: '/iot',
    icon: CpuChipIcon
  },
  {
    name: 'Plugins',
    to: '/plugins',
    icon: PuzzlePieceIcon,
    badge: '3' // Example badge for available updates
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: Cog6ToothIcon
  }
])
</script>

<style scoped>
.sidebar-text-enter-active,
.sidebar-text-leave-active {
  transition: opacity 0.3s ease;
}

.sidebar-text-enter-from,
.sidebar-text-leave-to {
  opacity: 0;
}

.nav-item {
  position: relative;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(to bottom, var(--color-primary-600), var(--color-accent-600));
  border-radius: 0 2px 2px 0;
  transition: height 0.2s ease;
}

.nav-item.router-link-active::before {
  height: 20px;
}

/* Tooltip for collapsed sidebar */
.sidebar-collapsed .nav-item {
  position: relative;
}

.sidebar-collapsed .nav-item:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
  padding: 8px 12px;
  background: var(--color-gray-900);
  color: white;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  animation: tooltip-appear 0.2s ease-in-out forwards;
}

@keyframes tooltip-appear {
  to {
    opacity: 1;
  }
}
</style>
