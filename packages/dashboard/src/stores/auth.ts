import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { authApi } from '../services/api'
import { useNotificationStore } from './notifications'
import type { User, LoginCredentials, RegisterData } from '@shared/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  async function initialize() {
    if (!token.value) return

    isLoading.value = true
    try {
      // Verify token and get user data
      const response = await authApi.me()
      if (response.success) {
        user.value = response.data
      } else {
        // Token is invalid, clear it
        logout()
      }
    } catch (err) {
      console.error('Auth initialization failed:', err)
      logout()
    } finally {
      isLoading.value = false
    }
  }

  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null

    try {
      // Development fallback for demo credentials
      if (credentials.email === 'admin@unimatrix.dev' && credentials.password === 'admin123') {
        // Mock successful login for development
        const mockUser: User = {
          id: 'demo-user-id',
          email: 'admin@unimatrix.dev',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const mockToken = 'demo-jwt-token-' + Date.now()
        const mockRefreshToken = 'demo-refresh-token-' + Date.now()

        // Store tokens
        token.value = mockToken
        refreshToken.value = mockRefreshToken
        user.value = mockUser

        // Persist to localStorage
        localStorage.setItem('token', mockToken)
        localStorage.setItem('refreshToken', mockRefreshToken)

        const notificationStore = useNotificationStore()
        notificationStore.add({
          type: 'success',
          title: 'Welcome back!',
          message: `Logged in as ${mockUser.email} (Demo Mode)`
        })

        return { success: true, redirectPath: '/' }
      }

      const response = await authApi.login(credentials)
      
      if (response.success && response.data) {
        // Store tokens
        token.value = response.data.tokens.accessToken
        refreshToken.value = response.data.tokens.refreshToken
        user.value = response.data.user

        // Persist to localStorage
        localStorage.setItem('token', response.data.tokens.accessToken)
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken)

        // Redirect to intended page or dashboard
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/'
        sessionStorage.removeItem('redirectAfterLogin')
        
        const notificationStore = useNotificationStore()
        notificationStore.add({
          type: 'success',
          title: 'Welcome back!',
          message: `Logged in as ${user.value.email}`
        })

        return { success: true, redirectPath }
      } else {
        error.value = response.error || 'Login failed'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      // Fallback to demo mode if API is unavailable
      if (credentials.email === 'admin@unimatrix.dev' && credentials.password === 'admin123') {
        const mockUser: User = {
          id: 'demo-user-id',
          email: 'admin@unimatrix.dev',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const mockToken = 'demo-jwt-token-' + Date.now()
        const mockRefreshToken = 'demo-refresh-token-' + Date.now()

        token.value = mockToken
        refreshToken.value = mockRefreshToken
        user.value = mockUser

        localStorage.setItem('token', mockToken)
        localStorage.setItem('refreshToken', mockRefreshToken)

        const notificationStore = useNotificationStore()
        notificationStore.add({
          type: 'warning',
          title: 'Demo Mode',
          message: 'Backend unavailable - using demo mode'
        })

        return { success: true, redirectPath: '/' }
      }

      error.value = err.response?.data?.error || err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function register(userData: RegisterData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.register(userData)
      
      if (response.success) {
        // Auto-login after registration
        return await login({
          email: userData.email,
          password: userData.password
        })
      } else {
        error.value = response.error || 'Registration failed'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (err) {
      console.error('Logout API call failed:', err)
    } finally {
      // Clear local state regardless of API call result
      user.value = null
      token.value = null
      refreshToken.value = null
      error.value = null

      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')

      const notificationStore = useNotificationStore()
      notificationStore.add({
        type: 'info',
        title: 'Logged out',
        message: 'You have been logged out successfully'
      })
    }
  }

  async function refreshTokens() {
    if (!refreshToken.value) {
      logout()
      return false
    }

    try {
      const response = await authApi.refreshToken(refreshToken.value)
      
      if (response.success && response.data) {
        token.value = response.data.accessToken
        localStorage.setItem('token', response.data.accessToken)

        return true
      } else {
        logout()
        return false
      }
    } catch (err) {
      console.error('Token refresh failed:', err)
      logout()
      return false
    }
  }

  async function updateProfile(profileData: Partial<User>) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.updateProfile(profileData)
      
      if (response.success) {
        user.value = { ...user.value!, ...response.data }
        
        const notificationStore = useNotificationStore()
        notificationStore.add({
          type: 'success',
          title: 'Profile updated',
          message: 'Your profile has been updated successfully'
        })

        return { success: true }
      } else {
        error.value = response.error || 'Profile update failed'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Profile update failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Getters
    isAuthenticated,

    // Actions
    initialize,
    login,
    register,
    logout,
    refreshTokens,
    updateProfile
  }
})
