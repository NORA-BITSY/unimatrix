<template>
  <teleport to="body">
    <div class="notification-container fixed top-4 right-4 z-50 space-y-3">
      <transition-group name="notification" tag="div">
        <div
          v-for="notification in notificationStore.notifications"
          :key="notification.id"
          :class="[
            'notification-item',
            'max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto',
            'ring-1 ring-black ring-opacity-5 overflow-hidden',
            getNotificationStyles(notification.type)
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <!-- Icon -->
              <div class="flex-shrink-0">
                <component
                  :is="getNotificationIcon(notification.type)"
                  :class="[
                    'w-5 h-5',
                    getIconStyles(notification.type)
                  ]"
                />
              </div>

              <!-- Content -->
              <div class="ml-3 flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ notification.title }}
                  </p>
                  <button
                    @click="notificationStore.remove(notification.id)"
                    class="ml-4 inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  >
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </div>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ notification.message }}
                </p>

                <!-- Actions -->
                <div v-if="notification.actions && notification.actions.length > 0" class="mt-3 flex space-x-2">
                  <button
                    v-for="action in notification.actions"
                    :key="action.label"
                    @click="handleActionClick(action, notification.id)"
                    :class="[
                      'text-xs font-medium px-3 py-1.5 rounded-md transition-colors',
                      action.variant === 'primary'
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    ]"
                  >
                    {{ action.label }}
                  </button>
                </div>

                <!-- Timestamp -->
                <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {{ formatTime(notification.timestamp) }}
                </p>
              </div>
            </div>

            <!-- Progress bar for auto-dismiss -->
            <div
              v-if="!notification.persistent && notification.duration"
              class="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden"
            >
              <div
                class="progress-bar h-full bg-current rounded-full transition-all ease-linear"
                :class="getProgressBarStyles(notification.type)"
                :style="{
                  width: '100%',
                  animationDuration: `${notification.duration}ms`,
                  animationName: 'progress-countdown'
                }"
              ></div>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '../stores/notifications'
import type { Notification } from '../stores/notifications'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const notificationStore = useNotificationStore()

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'success':
      return CheckCircleIcon
    case 'warning':
      return ExclamationTriangleIcon
    case 'error':
      return XCircleIcon
    case 'info':
    default:
      return InformationCircleIcon
  }
}

function getNotificationStyles(type: Notification['type']) {
  switch (type) {
    case 'success':
      return 'border-l-4 border-green-500'
    case 'warning':
      return 'border-l-4 border-yellow-500'
    case 'error':
      return 'border-l-4 border-red-500'
    case 'info':
    default:
      return 'border-l-4 border-blue-500'
  }
}

function getIconStyles(type: Notification['type']) {
  switch (type) {
    case 'success':
      return 'text-green-500'
    case 'warning':
      return 'text-yellow-500'
    case 'error':
      return 'text-red-500'
    case 'info':
    default:
      return 'text-blue-500'
  }
}

function getProgressBarStyles(type: Notification['type']) {
  switch (type) {
    case 'success':
      return 'text-green-500'
    case 'warning':
      return 'text-yellow-500'
    case 'error':
      return 'text-red-500'
    case 'info':
    default:
      return 'text-blue-500'
  }
}

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

function handleActionClick(action: NonNullable<Notification['actions']>[0], notificationId: string) {
  try {
    action.action()
  } catch (error) {
    console.error('Error executing notification action:', error)
  } finally {
    // Remove notification after action
    notificationStore.remove(notificationId)
  }
}
</script>

<style scoped>
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
  max-height: 0;
  padding: 0;
  margin: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}

@keyframes progress-countdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.progress-bar {
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

/* Ensure container doesn't block pointer events */
.notification-container {
  pointer-events: none;
}

.notification-item {
  pointer-events: auto;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .notification-container {
    left: 1rem;
    right: 1rem;
    top: 1rem;
  }
  
  .notification-item {
    max-width: none;
    width: 100%;
  }
}

/* Dark mode enhancements */
.dark .notification-item {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

/* High contrast mode */
.high-contrast .notification-item {
  border: 2px solid currentColor;
}
</style>
