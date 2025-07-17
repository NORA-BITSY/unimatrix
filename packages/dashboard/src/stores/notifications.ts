import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  persistent?: boolean
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }>
  timestamp: Date
}

export const useNotificationStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([])
  
  // Actions
  function add(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const id = generateId()
    const newNotification: Notification = {
      id,
      timestamp: new Date(),
      duration: 5000, // 5 seconds default
      ...notification
    }

    notifications.value.push(newNotification)

    // Auto-remove after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        remove(id)
      }, newNotification.duration)
    }

    return id
  }

  function remove(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clear() {
    notifications.value = []
  }

  function success(title: string, message: string, options?: Partial<Notification>) {
    return add({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  function error(title: string, message: string, options?: Partial<Notification>) {
    return add({
      type: 'error',
      title,
      message,
      persistent: true, // Errors are persistent by default
      ...options
    })
  }

  function warning(title: string, message: string, options?: Partial<Notification>) {
    return add({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  function info(title: string, message: string, options?: Partial<Notification>) {
    return add({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  // Helper function to generate unique IDs
  function generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    notifications,
    add,
    remove,
    clear,
    success,
    error,
    warning,
    info
  }
})
