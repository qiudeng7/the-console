import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterView.vue'),
      meta: { requiresGuest: true }
    },

    // 管理端路由
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
      children: [
        { path: '', redirect: 'dashboard' },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/pages/admin/DashboardView.vue')
        },
        {
          path: 'tasks',
          name: 'admin-tasks',
          component: () => import('@/pages/admin/TasksView.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/pages/admin/UsersView.vue')
        },
        {
          path: 'stats',
          name: 'admin-stats',
          component: () => import('@/pages/admin/StatsView.vue')
        }
      ]
    },

    // 员工端路由
    {
      path: '/employee',
      component: () => import('@/layouts/EmployeeLayout.vue'),
      meta: { requiresAuth: true, requiresRole: 'employee' },
      children: [
        { path: '', redirect: 'tasks' },
        {
          path: 'tasks',
          name: 'employee-tasks',
          component: () => import('@/pages/employee/TasksView.vue')
        }
      ]
    },

    // 兼容旧路由，根据角色重定向
    {
      path: '/dashboard',
      name: 'dashboard',
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 确保用户信息已加载
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.user?.role

  // 需要认证的页面
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // 已登录用户访问登录/注册页
  if (to.meta.requiresGuest && isAuthenticated) {
    next(userRole === 'admin' ? '/admin/dashboard' : '/employee/tasks')
    return
  }

  // 角色权限检查
  if (to.meta.requiresRole && userRole !== to.meta.requiresRole) {
    next(userRole === 'admin' ? '/admin/dashboard' : '/employee/tasks')
    return
  }

  // /dashboard 重定向逻辑
  if (to.path === '/dashboard') {
    next(userRole === 'admin' ? '/admin/dashboard' : '/employee/tasks')
    return
  }

  next()
})

export default router
