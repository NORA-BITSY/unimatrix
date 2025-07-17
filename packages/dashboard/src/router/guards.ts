import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore()
  
  // Set page title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - UniMatrix`
  }
  
  // Check if route requires authentication
  if (to.meta?.requiresAuth === false) {
    // Public route - redirect to dashboard if already authenticated
    if (authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
      next({ name: 'Dashboard' })
      return
    }
    next()
    return
  }
  
  // Protected route - check authentication
  if (!authStore.isAuthenticated) {
    // Store the intended destination
    sessionStorage.setItem('redirectAfterLogin', to.fullPath)
    next({ name: 'Login' })
    return
  }
  
  // Check if user has required permissions (if specified)
  if (to.meta?.requiredPermissions) {
    const hasPermissions = (to.meta.requiredPermissions as string[]).every(
      permission => authStore.user?.permissions?.includes(permission)
    )
    
    if (!hasPermissions) {
      // Redirect to unauthorized page or dashboard
      next({ name: 'Dashboard' })
      return
    }
  }
  
  next()
}
