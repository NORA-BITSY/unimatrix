import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNotificationStore } from './notifications'
import { useAuthStore } from './auth'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface WSMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export interface WSSubscription {
  topic: string
  callback: (data: any) => void
  once?: boolean
}

export const useWebSocketStore = defineStore('websocket', () => {
  // State
  const socket = ref<WebSocket | null>(null)
  const status = ref<ConnectionStatus>('disconnected')
  const error = ref<string | null>(null)
  const retryCount = ref(0)
  const subscriptions = ref<Map<string, WSSubscription[]>>(new Map())
  const messageQueue = ref<WSMessage[]>([])
  const reconnectTimer = ref<number | null>(null)

  // Configuration
  const maxRetries = 5
  const retryDelay = 1000 // Start with 1 second
  const maxRetryDelay = 30000 // Max 30 seconds
  const heartbeatInterval = 30000 // 30 seconds

  // Getters
  const isConnected = computed(() => status.value === 'connected')
  const isConnecting = computed(() => status.value === 'connecting')

  // Actions
  function connect(url?: string) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    const authStore = useAuthStore()
    if (!authStore.token) {
      console.log('Cannot connect WebSocket: No auth token')
      return
    }

    const wsUrl = url || `ws://localhost:3001/ws?token=${authStore.token}`
    
    status.value = 'connecting'
    error.value = null

    try {
      socket.value = new WebSocket(wsUrl)
      setupEventListeners()
    } catch (err: any) {
      console.error('WebSocket connection failed:', err)
      status.value = 'error'
      error.value = err.message
      scheduleReconnect()
    }
  }

  function disconnect() {
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }

    if (socket.value) {
      socket.value.close(1000, 'User initiated disconnect')
      socket.value = null
    }

    status.value = 'disconnected'
    error.value = null
    retryCount.value = 0
  }

  function send(message: Omit<WSMessage, 'timestamp'>) {
    const fullMessage: WSMessage = {
      ...message,
      timestamp: Date.now(),
      id: message.id || generateMessageId()
    }

    if (isConnected.value && socket.value) {
      try {
        socket.value.send(JSON.stringify(fullMessage))
        return true
      } catch (err: any) {
        console.error('Failed to send WebSocket message:', err)
        error.value = err.message
        return false
      }
    } else {
      // Queue message for when connection is restored
      messageQueue.value.push(fullMessage)
      console.log('WebSocket not connected, message queued')
      return false
    }
  }

  function subscribe(topic: string, callback: (data: any) => void, once = false) {
    if (!subscriptions.value.has(topic)) {
      subscriptions.value.set(topic, [])
    }

    const subscription: WSSubscription = { topic, callback, once }
    subscriptions.value.get(topic)!.push(subscription)

    // Send subscription message to server
    send({
      type: 'subscribe',
      data: { topic }
    })

    // Return unsubscribe function
    return () => unsubscribe(topic, callback)
  }

  function unsubscribe(topic: string, callback?: (data: any) => void) {
    const topicSubscriptions = subscriptions.value.get(topic)
    if (!topicSubscriptions) return

    if (callback) {
      // Remove specific callback
      const index = topicSubscriptions.findIndex(sub => sub.callback === callback)
      if (index > -1) {
        topicSubscriptions.splice(index, 1)
      }
    } else {
      // Remove all subscriptions for topic
      subscriptions.value.delete(topic)
    }

    // If no more subscriptions for this topic, tell server
    if (!topicSubscriptions || topicSubscriptions.length === 0) {
      send({
        type: 'unsubscribe',
        data: { topic }
      })
    }
  }

  function setupEventListeners() {
    if (!socket.value) return

    socket.value.onopen = () => {
      console.log('WebSocket connected')
      status.value = 'connected'
      error.value = null
      retryCount.value = 0

      // Send queued messages
      while (messageQueue.value.length > 0) {
        const message = messageQueue.value.shift()!
        socket.value!.send(JSON.stringify(message))
      }

      // Resubscribe to all topics
      for (const topic of subscriptions.value.keys()) {
        send({
          type: 'subscribe',
          data: { topic }
        })
      }

      // Start heartbeat
      startHeartbeat()

      const notificationStore = useNotificationStore()
      notificationStore.success('Connected', 'Real-time connection established')
    }

    socket.value.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    socket.value.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      status.value = 'disconnected'
      socket.value = null

      if (event.code !== 1000) { // Not a normal closure
        scheduleReconnect()
      }
    }

    socket.value.onerror = (event) => {
      console.error('WebSocket error:', event)
      status.value = 'error'
      error.value = 'Connection error'
    }
  }

  function handleMessage(message: WSMessage) {
    // Handle system messages
    if (message.type === 'pong') {
      return // Heartbeat response
    }

    if (message.type === 'error') {
      console.error('WebSocket server error:', message.data)
      error.value = message.data.message || 'Server error'
      return
    }

    // Handle subscribed messages
    const topicSubscriptions = subscriptions.value.get(message.type)
    if (topicSubscriptions) {
      topicSubscriptions.forEach((subscription, index) => {
        try {
          subscription.callback(message.data)
          
          // Remove one-time subscriptions
          if (subscription.once) {
            topicSubscriptions.splice(index, 1)
          }
        } catch (err) {
          console.error('Error in subscription callback:', err)
        }
      })
    }
  }

  function scheduleReconnect() {
    if (retryCount.value >= maxRetries) {
      console.error('Max reconnection attempts reached')
      status.value = 'error'
      error.value = 'Connection failed after multiple attempts'
      
      const notificationStore = useNotificationStore()
      notificationStore.error(
        'Connection Lost',
        'Unable to establish real-time connection. Please refresh the page.'
      )
      return
    }

    const delay = Math.min(retryDelay * Math.pow(2, retryCount.value), maxRetryDelay)
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${retryCount.value + 1}/${maxRetries})`)

    reconnectTimer.value = window.setTimeout(() => {
      retryCount.value++
      connect()
    }, delay)
  }

  function startHeartbeat() {
    const heartbeat = setInterval(() => {
      if (isConnected.value) {
        send({ type: 'ping', data: {} })
      } else {
        clearInterval(heartbeat)
      }
    }, heartbeatInterval)
  }

  function generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize connection when auth store is ready
  function initialize() {
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      connect()
    }
  }

  return {
    // State
    status,
    error,
    retryCount,

    // Getters
    isConnected,
    isConnecting,

    // Actions
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    initialize
  }
})
