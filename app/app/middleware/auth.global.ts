import { useAuthStore } from '~~/app/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  // 跳过登录和注册 API
  if (to.path === '/api/login' || to.path === '/api/register') {
    return
  }

  // 跳过其他公开的 API 端点
  if (to.path.startsWith('/api/')) {
    // API 路由不使用 Nuxt 中间件，由服务端处理
    return
  }

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
