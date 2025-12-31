import type { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '~~/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Actions
  async function login(credentials: LoginRequest) {
    const response = await $fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: credentials
    }).catch((e: any) => {
      return { error: e.message || '登录失败' }
    })

    if ('error' in response) {
      throw new Error(response.error)
    }

    user.value = response.user
    token.value = response.token

    return response
  }

  async function register(credentials: RegisterRequest) {
    const response = await $fetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: credentials
    }).catch((e: any) => {
      return { error: e.message || '注册失败' }
    })

    if ('error' in response) {
      throw new Error(response.error)
    }

    user.value = response.user
    token.value = response.token

    return response
  }

  async function fetchMe() {
    if (!token.value) {
      return null
    }

    const response = await $fetch<{ user: AuthUser }>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    }).catch((e: any) => {
      return { error: e.message || '获取用户信息失败' }
    })

    if ('error' in response) {
      logout()
      throw new Error(response.error)
    }

    user.value = response.user

    return response.user
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    fetchMe,
    logout
  }
})
