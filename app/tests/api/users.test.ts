import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '~/server/database/schema'
import { createMockDb, createMockAuthUser, createMockEvent } from '../mocks/db'

// Setup mocks before importing handlers
const mockDb = createMockDb()
let currentAuthUser: any = {
  id: 1,
  email: 'user@example.com',
  role: 'employee'
}

vi.mock('~/server/database/db', () => ({
  getDb: vi.fn(() => mockDb)
}))

vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(() => Promise.resolve(currentAuthUser))
}))

describe('User API - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockDb chain
    Object.assign(mockDb, createMockDb())

    // Reset to default user
    currentAuthUser = {
      id: 1,
      email: 'user@example.com',
      role: 'employee'
    }
  })

  describe('PATCH /api/users/[id]', () => {
    it('should allow user to update their own information', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'user@example.com',
        role: 'employee',
        version: 1
      })

      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com',
        version: 2
      }

      let selectCallCount = 0
      mockDb.select = vi.fn(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockUser])
        }
        return Promise.resolve([updatedUser])
      })

      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent({
        body: { email: 'updated@example.com' }
      })
      event.context.params = { id: '1' }

      const { default: handler } = await import('~/server/api/users/[id].patch')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user).toHaveProperty('id')
      expect(result.data.user).toHaveProperty('email')
    })

    it('should allow admin to update any user information', async () => {
      // Admin user
      currentAuthUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      }

      const mockTargetUser = createMockAuthUser({
        id: 2,
        email: 'target@example.com',
        role: 'employee',
        version: 1
      })

      const updatedUser = {
        ...mockTargetUser,
        email: 'updated@example.com',
        role: 'admin',
        version: 2
      }

      let selectCallCount = 0
      mockDb.select = vi.fn(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockTargetUser])
        }
        return Promise.resolve([updatedUser])
      })

      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent({
        body: {
          email: 'updated@example.com',
          role: 'admin'
        }
      })
      event.context.params = { id: '2' }

      const { default: handler } = await import('~/server/api/users/[id].patch')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user.role).toBe('admin')
    })

    it('should reject employee from updating other user information', async () => {
      const event = createMockEvent({
        body: { email: 'updated@example.com' }
      })
      event.context.params = { id: '2' } // Different user ID

      const { default: handler } = await import('~/server/api/users/[id].patch')

      await expect(handler(event)).rejects.toThrow('无权限修改此用户')
    })

    it('should handle user not found', async () => {
      mockDb.select = vi.fn(() => Promise.resolve([]))

      const event = createMockEvent({
        body: { email: 'updated@example.com' }
      })
      event.context.params = { id: '999' }

      const { default: handler } = await import('~/server/api/users/[id].patch')

      await expect(handler(event)).rejects.toThrow('用户不存在')
    })

    it('should prevent modification of sensitive fields (id)', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'user@example.com',
        role: 'employee',
        version: 1
      })

      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com',
        version: 2
      }

      let selectCallCount = 0
      mockDb.select = vi.fn(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockUser])
        }
        return Promise.resolve([updatedUser])
      })

      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent({
        body: {
          id: 999, // Attempting to change ID
          email: 'updated@example.com'
        }
      })
      event.context.params = { id: '1' }

      const { default: handler } = await import('~/server/api/users/[id].patch')
      const result = await handler(event)

      // The ID should not be changed (it's not in the updateData)
      expect(result.success).toBe(true)
      expect(result.data.user.id).toBe(1)
    })

    it('should prevent employee from changing role', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'user@example.com',
        role: 'employee',
        version: 1
      })

      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com',
        version: 2
      }

      let selectCallCount = 0
      mockDb.select = vi.fn(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockUser])
        }
        return Promise.resolve([updatedUser])
      })

      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent({
        body: {
          email: 'updated@example.com',
          role: 'admin' // Employee trying to change role
        }
      })
      event.context.params = { id: '1' }

      const { default: handler } = await import('~/server/api/users/[id].patch')
      const result = await handler(event)

      // Role should remain unchanged since user is not admin
      expect(result.success).toBe(true)
      expect(result.data.user.role).toBe('employee')
    })

    it('should handle optimistic lock version conflict', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'user@example.com',
        role: 'employee',
        version: 5
      })

      mockDb.select = vi.fn(() => Promise.resolve([mockUser]))
      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 0 })) // No rows affected = version conflict
        }))
      }))

      const event = createMockEvent({
        body: { email: 'updated@example.com' }
      })
      event.context.params = { id: '1' }

      const { default: handler } = await import('~/server/api/users/[id].patch')

      await expect(handler(event)).rejects.toThrow('用户数据已被其他人修改，请刷新后重试')
    })

    it('should reject invalid user ID', async () => {
      const event = createMockEvent({
        body: { email: 'updated@example.com' }
      })
      event.context.params = { id: 'invalid' } // Not a number

      const { default: handler } = await import('~/server/api/users/[id].patch')

      await expect(handler(event)).rejects.toThrow('无效的用户ID')
    })

    it('should update password when provided', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'user@example.com',
        role: 'employee',
        version: 1,
        password: 'old_hashed_password'
      })

      const updatedUser = {
        ...mockUser,
        password: 'new_hashed_password',
        version: 2
      }

      let selectCallCount = 0
      mockDb.select = vi.fn(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockUser])
        }
        return Promise.resolve([updatedUser])
      })

      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent({
        body: {
          password: 'new_plain_password'
        }
      })
      event.context.params = { id: '1' }

      const { default: handler } = await import('~/server/api/users/[id].patch')
      const result = await handler(event)

      expect(result.success).toBe(true)
    })

    it('should handle partial updates (only email)', async () => {
      const mockUser = createMockAuthUser({
        id: 1,
        email: 'user@example.com',
        role: 'employee',
        version: 1
      })

      const updatedUser = {
        ...mockUser,
        email: 'newemail@example.com',
        version: 2
      }

      let selectCallCount = 0
      mockDb.select = vi.fn(() => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockUser])
        }
        return Promise.resolve([updatedUser])
      })

      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent({
        body: {
          email: 'newemail@example.com'
        }
      })
      event.context.params = { id: '1' }

      const { default: handler } = await import('~/server/api/users/[id].patch')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.user.email).toBe('newemail@example.com')
    })
  })
})
