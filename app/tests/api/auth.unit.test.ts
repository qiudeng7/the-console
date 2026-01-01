import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '~/server/database/schema'
import { createMockDb, createMockAuthUser, createMockEvent } from '../mocks/db'

// Setup mocks before importing handlers
const mockDb = createMockDb()
const mockGenerateToken = vi.fn(() => 'mock-jwt-token')
const mockVerifyAuth = vi.fn()

vi.mock('~/server/database/db', () => ({
  getDb: vi.fn(() => mockDb)
}))

vi.mock('~/server/utils/jwt', () => ({
  generateToken: mockGenerateToken,
  verifyToken: vi.fn(() => 1)
}))

vi.mock('~/server/utils/auth', () => ({
  verifyAuth: mockVerifyAuth,
  getAuthUser: vi.fn(),
  getAdminUser: vi.fn()
}))

describe('Auth API Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockDb chain
    Object.assign(mockDb, createMockDb())
  })

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'newuser@example.com',
        role: 'employee'
      })

      // Mock sequence for multiple select calls
      let callCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve([])
        }
        if (callCount === 2) {
          return Promise.resolve([])
        }
        if (callCount === 3) {
          return Promise.resolve([mockUser])
        }
        return Promise.resolve([])
      })

      mockDb.insert = vi.fn(() => ({
        values: vi.fn(() => Promise.resolve({ insertId: 1 }))
      }))

      const event = createMockEvent({
        body: {
          email: 'newuser@example.com',
          password: 'password123'
        }
      })

      const { default: handler } = await import('~/server/api/auth/register.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user.email).toBe('newuser@example.com')
      expect(result.data.token).toBe('mock-jwt-token')
      expect(mockGenerateToken).toHaveBeenCalled()
    })

    it('应该拒绝重复的邮箱', async () => {
      const mockUser = createMockAuthUser({
        email: 'existing@example.com'
      })

      mockDb.select = vi.fn(() => Promise.resolve([mockUser]))

      const event = createMockEvent({
        body: {
          email: 'existing@example.com',
          password: 'password123'
        }
      })

      const { default: handler } = await import('~/server/api/auth/register.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('邮箱已被注册')
    })

    it('应该验证必填字段', async () => {
      const event = createMockEvent({
        body: {
          email: '',
          password: ''
        }
      })

      const { default: handler } = await import('~/server/api/auth/register.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('邮箱和密码不能为空')
    })

    it('第一个用户应该自动成为 admin', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'first@example.com',
        role: 'admin'
      })

      let callCount = 0
      mockDb.select = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve([])
        }
        if (callCount === 2) {
          return Promise.resolve([])
        }
        return Promise.resolve([mockUser])
      })

      mockDb.insert = vi.fn(() => ({
        values: vi.fn(() => Promise.resolve({ insertId: 1 }))
      }))

      const event = createMockEvent({
        body: {
          email: 'first@example.com',
          password: 'password123'
        }
      })

      const { default: handler } = await import('~/server/api/auth/register.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user.role).toBe('admin')
    })

    it('后续用户应该默认为 employee', async () => {
      const existingUser = createMockAuthUser({
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      })

      const mockUser = createMockAuthUser({
        id: 2,
        email: 'employee@example.com',
        role: 'employee'
      })

      let callCount = 0
      mockDb.select = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve([])
        }
        if (callCount === 2) {
          return Promise.resolve([existingUser])
        }
        return Promise.resolve([mockUser])
      })

      mockDb.insert = vi.fn(() => ({
        values: vi.fn(() => Promise.resolve({ insertId: 2 }))
      }))

      const event = createMockEvent({
        body: {
          email: 'employee@example.com',
          password: 'password123'
        }
      })

      const { default: handler } = await import('~/server/api/auth/register.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user.role).toBe('employee')
    })
  })

  describe('POST /api/auth/login', () => {
    it('应该使用有效凭据登录成功', async () => {
      const mockUser = createMockAuthUser({
        email: 'test@example.com',
        password: 'password123'
      })

      mockDb.select = vi.fn(() => Promise.resolve([mockUser]))

      const event = createMockEvent({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      const { default: handler } = await import('~/server/api/auth/login.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user.email).toBe('test@example.com')
      expect(result.data.token).toBe('mock-jwt-token')
      expect(mockGenerateToken).toHaveBeenCalled()
    })

    it('应该拒绝无效的邮箱', async () => {
      mockDb.select = vi.fn(() => Promise.resolve([]))

      const event = createMockEvent({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      })

      const { default: handler } = await import('~/server/api/auth/login.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('邮箱或密码错误')
    })

    it('应该拒绝无效的密码', async () => {
      const mockUser = createMockAuthUser({
        email: 'test@example.com',
        password: 'correctpassword'
      })

      mockDb.select = vi.fn(() => Promise.resolve([mockUser]))

      const event = createMockEvent({
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      })

      const { default: handler } = await import('~/server/api/auth/login.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('邮箱或密码错误')
    })

    it('应该验证必填字段', async () => {
      const event = createMockEvent({
        body: {
          email: '',
          password: ''
        }
      })

      const { default: handler } = await import('~/server/api/auth/login.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('邮箱和密码不能为空')
    })

    it('应该返回 JWT token', async () => {
      const mockUser = createMockAuthUser({
        email: 'test@example.com',
        password: 'password123'
      })

      mockDb.select = vi.fn(() => Promise.resolve([mockUser]))

      const event = createMockEvent({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      const { default: handler } = await import('~/server/api/auth/login.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.token).toBe('mock-jwt-token')
    })
  })

  describe('GET /api/auth/me', () => {
    it('应该使用有效 token 返回用户信息', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      })

      mockDb.select = vi.fn(() => Promise.resolve([mockUser]))
      mockVerifyAuth.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      })

      const event = createMockEvent({
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const { default: handler } = await import('~/server/api/auth/me.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user.email).toBe('test@example.com')
      expect(result.data.user.role).toBe('admin')
    })

    it('应该拒绝没有 token 的请求', async () => {
      const event = createMockEvent({
        headers: {}
      })

      const { default: handler } = await import('~/server/api/auth/me.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('未提供认证令牌')
    })

    it('应该拒绝无效的 token', async () => {
      mockVerifyAuth.mockRejectedValue(new Error('无效的令牌'))

      const event = createMockEvent({
        headers: {
          authorization: 'Bearer invalid-token'
        }
      })

      const { default: handler } = await import('~/server/api/auth/me.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('无效的令牌')
    })
  })
})
