<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~~/app/stores/auth'
import { EMPLOYEE_TASK_TYPES } from '~~/app/config/employee-task-types'

definePageMeta({
  requiresAuth: true
})

const authStore = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

const colorMode = useColorMode()

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// 构建导航配置：通用入口 + 任务类型入口
const navigation = [
  {
    name: '所有任务',
    href: '/employee/tasks',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16'
  },
  ...EMPLOYEE_TASK_TYPES.map(type => ({
    name: type.name,
    href: type.route,
    icon: type.icon
  }))
]
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 z-40 lg:hidden"
    >
      <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
    </div>

    <div class="flex h-screen">
      <!-- Sidebar -->
      <div
        :class="[
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <!-- Logo -->
        <div class="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">员工工作台</h1>
        </div>

        <!-- Navigation -->
        <nav class="mt-5 px-2">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1"
            active-class="bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300"
            inactive-class="text-gray-600 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            @click="sidebarOpen = false"
          >
            <svg
              class="mr-3 h-5 w-5"
              :class="[
                $route.path === item.href ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-300 dark:group-hover:text-gray-100'
              ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            {{ item.name }}
          </NuxtLink>
        </nav>

        <!-- User info -->
        <div class="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ authStore.user?.email?.[0]?.toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ authStore.user?.email }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">员工</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="mt-3 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
          <!-- Dark mode toggle -->
          <button
            @click="toggleColorMode"
            class="mt-2 w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title="切换颜色模式"
          >
            <svg v-if="colorMode.value === 'dark'" class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            {{ colorMode.value === 'dark' ? '浅色模式' : '深色模式' }}
          </button>
        </div>
      </div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top bar -->
        <div class="bg-white dark:bg-gray-800 shadow-sm lg:hidden">
          <div class="flex items-center justify-between h-16 px-4">
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">员工工作台</h1>
            <button
              @click="toggleColorMode"
              class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              title="切换颜色模式"
            >
              <svg v-if="colorMode.value === 'dark'" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-6">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
