import { useAuthStore } from '~~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Check if the route requires authentication
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login page
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (requiresAdmin && !authStore.isAdmin) {
    // Redirect to unauthorized page
    return navigateTo('/unauthorized')
  }
})
