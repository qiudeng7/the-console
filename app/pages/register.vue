<script setup lang="ts">
import type { RegisterRequest } from '~~/types'

definePageMeta({
  layout: false,
  requiresAuth: false
})

import { useAuthStore } from '~~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string
}

const formData = reactive<RegisterFormData>({
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''

  if (formData.password !== formData.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (formData.password.length < 6) {
    error.value = '密码长度至少为 6 位'
    return
  }

  loading.value = true

  try {
    await authStore.register({
      email: formData.email,
      password: formData.password
    })

    // 注册成功后跳转到对应角色的页面
    if (authStore.isAdmin) {
      await router.push('/admin')
    } else {
      await router.push('/employee')
    }
  } catch (e: any) {
    error.value = e.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          注册新账户
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          已有账户？
          <NuxtLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            立即登录
          </NuxtLink>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {{ error }}
        </div>

        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">邮箱地址</label>
            <input
              id="email"
              v-model="formData.email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="邮箱地址"
            >
          </div>
          <div>
            <label for="password" class="sr-only">密码</label>
            <input
              id="password"
              v-model="formData.password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="密码（至少 6 位）"
            >
          </div>
          <div>
            <label for="confirm-password" class="sr-only">确认密码</label>
            <input
              id="confirm-password"
              v-model="formData.confirmPassword"
              name="confirmPassword"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="确认密码"
            >
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">注册中...</span>
            <span v-else>注册</span>
          </button>
        </div>

        <div class="text-center text-xs text-gray-500">
          第一个注册的用户将自动成为管理员
        </div>
      </form>
    </div>
  </div>
</template>
