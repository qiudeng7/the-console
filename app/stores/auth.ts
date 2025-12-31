import type { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '~~/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Actions
  async function login(credentials: LoginRequest) {
    const response = await $fetch<{ success: boolean; data?: AuthResponse; error?: string }>('/api/auth/login', {
      method: 'POST',
      body: credentials
    }).catch((e: any) => {
      return { success: false, error: e.message || '登录失败' } as const
    })

    if (!response.success || response.error) {
      throw new Error(response.error || '登录失败')
    }

    if (!response.data) throw new Error('Invalid response')

    user.value = response.data.user
    token.value = response.data.token

    return response.data
  }

  async function register(credentials: RegisterRequest) {
    const response = await $fetch<{ success: boolean; data?: AuthResponse; error?: string }>('/api/auth/register', {
      method: 'POST',
      body: credentials
    }).catch((e: any) => {
      return { success: false, error: e.message || '注册失败' } as const
    })

    if (!response.success || response.error) {
      throw new Error(response.error || '注册失败')
    }

    if (!response.data) throw new Error('Invalid response')

    user.value = response.data.user
    token.value = response.data.token

    return response.data
  }

  async function fetchMe() {
    if (!token.value) {
      return null
    }

    const response = await $fetch<{ success: boolean; data?: { user: AuthUser }; error?: string }>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    }).catch((e: any) => {
      return { success: false, error: e.message || '获取用户信息失败' } as const
    })

    if (!response.success || response.error) {
      logout()
      throw new Error(response.error || '获取用户信息失败')
    }

    if (!response.data) throw new Error('Invalid response')

    user.value = response.data.user

    return response.data.user
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
}, {
  persist: true
})
