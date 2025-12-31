import type { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Actions
  async function login(credentials: LoginRequest) {
    const { data, error } = await $fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: credentials
    }).catch((e) => {
      return { error: e.message || '登录失败' }
    })

    if (error) {
      throw new Error(error)
    }

    if (data) {
      user.value = data.user
      token.value = data.token
    }

    return data
  }

  async function register(credentials: RegisterRequest) {
    const { data, error } = await $fetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: credentials
    }).catch((e) => {
      return { error: e.message || '注册失败' }
    })

    if (error) {
      throw new Error(error)
    }

    if (data) {
      user.value = data.user
      token.value = data.token
    }

    return data
  }

  async function fetchMe() {
    if (!token.value) {
      return null
    }

    const { data, error } = await $fetch<{ user: AuthUser }>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    }).catch((e) => {
      return { error: e.message || '获取用户信息失败' }
    })

    if (error) {
      logout()
      throw new Error(error)
    }

    if (data) {
      user.value = data.user
    }

    return data?.user
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
  persist: {
    key: 'auth',
    storage: persistedState.localStorage,
    pick: ['token', 'user']
  }
})
