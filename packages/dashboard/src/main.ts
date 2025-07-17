import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import { routes } from './router/routes'
import { authGuard } from './router/guards'

// Import styles
import './assets/styles/main.css'

// Create Vue app
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Global auth guard
router.beforeEach(authGuard)

// Use plugins
app.use(pinia)
app.use(router)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)
  // In production, send to error reporting service
}

// Mount app
app.mount('#app')
