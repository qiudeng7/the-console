import { useAuthStore } from '~~/app/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Check if the route requires authentication
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true

  console.log('[Auth Middleware] Route:', to.path, 'requiresAuth:', requiresAuth, 'requiresAdmin:', requiresAdmin)
  console.log('[Auth Middleware] isAuthenticated:', authStore.isAuthenticated, 'isAdmin:', authStore.isAdmin)

  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('[Auth Middleware] Redirecting to login')
    // Redirect to login page
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (requiresAdmin && !authStore.isAdmin) {
    console.log('[Auth Middleware] Redirecting to unauthorized')
    // Redirect to unauthorized page
    return navigateTo('/unauthorized')
  }

  console.log('[Auth Middleware] Access granted')
})
