<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
    >
      <div class="text-center">
        <div class="spinner w-8 h-8 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading UniMatrix...</p>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <Sidebar v-if="isAuthenticated" />
      
      <!-- Main content area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <Header v-if="isAuthenticated" />
        
        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <router-view v-slot="{ Component, route }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>

    <!-- Notifications -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useWebSocketStore } from './stores/websocket'
import { useThemeStore } from './stores/theme'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import NotificationContainer from './components/NotificationContainer.vue'

const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const themeStore = useThemeStore()

const isLoading = computed(() => authStore.isLoading)
const isAuthenticated = computed(() => authStore.isAuthenticated)

onMounted(async () => {
  // Initialize theme
  themeStore.initialize()
  
  // Initialize auth
  await authStore.initialize()
  
  // Connect WebSocket if authenticated
  if (isAuthenticated.value) {
    wsStore.connect()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
