import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' }
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: 'Login' }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { requiresAuth: false, title: 'Register' }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../views/AnalyticsView.vue'),
    meta: { requiresAuth: true, title: 'Analytics' }
  },
  {
    path: '/ai',
    name: 'AI',
    component: () => import('../views/AiModelsView.vue'),
    meta: { requiresAuth: true, title: 'AI Models' }
  },
  {
    path: '/blockchain',
    name: 'Blockchain',
    component: () => import('../views/BlockchainView.vue'),
    meta: { requiresAuth: true, title: 'Blockchain' }
  },
  {
    path: '/iot',
    name: 'IoT',
    component: () => import('../views/IoTView.vue'),
    meta: { requiresAuth: true, title: 'IoT Devices' }
  },
  {
    path: '/plugins',
    name: 'Plugins',
    component: () => import('../views/PluginsView.vue'),
    meta: { requiresAuth: true, title: 'Plugin Manager' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true, title: 'Settings' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Profile' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/error/NotFoundView.vue'),
    meta: { requiresAuth: false, title: 'Page Not Found' }
  }
]
