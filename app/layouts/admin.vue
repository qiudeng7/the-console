<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~~/app/stores/auth'

definePageMeta({
  requiresAuth: true,
  requiresAdmin: true
})

const authStore = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

const navigation = [
  { name: '仪表盘', href: '/admin/dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { name: '任务管理', href: '/admin/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { name: '应用管理', href: '/admin/apps', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' }
]
</script>

<template>
  <div class="min-h-screen bg-gray-100">
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <!-- Logo -->
        <div class="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 class="text-xl font-bold text-gray-900">管理控制台</h1>
        </div>

        <!-- Navigation -->
        <nav class="mt-5 px-2">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1"
            active-class="bg-indigo-50 text-indigo-600"
            inactive-class="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            @click="sidebarOpen = false"
          >
            <svg
              class="mr-3 h-5 w-5"
              :class="[
                $route.path === item.href ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
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
        <div class="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ authStore.user?.email?.[0]?.toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700">{{ authStore.user?.email }}</p>
              <p class="text-xs text-gray-500">管理员</p>
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
        </div>
      </div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top bar -->
        <div class="bg-white shadow-sm lg:hidden">
          <div class="flex items-center justify-between h-16 px-4">
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 class="text-lg font-bold text-gray-900">管理控制台</h1>
            <div class="h-8 w-8"></div>
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
