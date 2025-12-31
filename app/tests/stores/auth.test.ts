import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/app/stores/auth'

// Mock $fetch
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBase: '/api'
    }
  })
}))

global.$fetch = vi.fn()

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.isAdmin).toBe(false)
    })
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'admin',
            createdAt: '2025/12/31 00:00:00'
          },
          token: 'mock-jwt-token'
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const store = useAuthStore()
      const result = await store.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(store.user).toEqual(mockResponse.data.user)
      expect(store.token).toBe('mock-jwt-token')
      expect(store.isAuthenticated).toBe(true)
      expect(store.isAdmin).toBe(true)
    })

    it('should throw error with invalid credentials', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('邮箱或密码错误'))

      const store = useAuthStore()
      await expect(store.login({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('邮箱或密码错误')
    })
  })

  describe('Register', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'new@example.com',
            role: 'admin',
            createdAt: '2025/12/31 00:00:00'
          },
          token: 'mock-jwt-token'
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const store = useAuthStore()
      const result = await store.register({
        email: 'new@example.com',
        password: 'password123'
      })

      expect(store.user).toEqual(mockResponse.data.user)
      expect(store.token).toBe('mock-jwt-token')
      expect(store.isAuthenticated).toBe(true)
    })

    it('should handle registration errors', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('邮箱已被注册'))

      const store = useAuthStore()
      await expect(store.register({
        email: 'existing@example.com',
        password: 'password123'
      })).rejects.toThrow('邮箱已被注册')
    })
  })

  describe('Fetch Me', () => {
    it('should fetch current user info', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'employee',
            createdAt: '2025/12/31 00:00:00'
          }
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const store = useAuthStore()
      store.token = 'valid-token'

      const result = await store.fetchMe()

      expect(result).toEqual(mockResponse.data.user)
      expect(store.user).toEqual(mockResponse.data.user)
    })

    it('should logout on token invalid', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('无效的认证令牌'))

      const store = useAuthStore()
      store.token = 'invalid-token'
      store.user = {
        id: 1,
        email: 'test@example.com',
        role: 'employee',
        createdAt: '2025/12/31 00:00:00'
      }

      await expect(store.fetchMe()).rejects.toThrow()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
    })
  })

  describe('Logout', () => {
    it('should clear user and token', () => {
      const store = useAuthStore()
      store.user = {
        id: 1,
        email: 'test@example.com',
        role: 'admin',
        createdAt: '2025/12/31 00:00:00'
      }
      store.token = 'some-token'

      store.logout()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('isAdmin should return true for admin role', () => {
      const store = useAuthStore()
      store.user = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        createdAt: '2025/12/31 00:00:00'
      }

      expect(store.isAdmin).toBe(true)
    })

    it('isAdmin should return false for employee role', () => {
      const store = useAuthStore()
      store.user = {
        id: 2,
        email: 'employee@example.com',
        role: 'employee',
        createdAt: '2025/12/31 00:00:00'
      }

      expect(store.isAdmin).toBe(false)
    })

    it('isAuthenticated should return true only when both user and token exist', () => {
      const store = useAuthStore()

      // Neither user nor token
      expect(store.isAuthenticated).toBe(false)

      // Only token
      store.token = 'token'
      expect(store.isAuthenticated).toBe(false)

      // Only user
      store.token = null
      store.user = {
        id: 1,
        email: 'test@example.com',
        role: 'employee',
        createdAt: '2025/12/31 00:00:00'
      }
      expect(store.isAuthenticated).toBe(false)

      // Both user and token
      store.token = 'token'
      expect(store.isAuthenticated).toBe(true)
    })
  })
})
