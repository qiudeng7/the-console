import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, Task, K8sCluster, K8sNode } from '~/server/database/schema'
import { createMockDb, createMockAuthUser, createMockTask, createMockEvent } from '../mocks/db'

// Setup mocks before importing handlers
const mockDb = createMockDb()

vi.mock('~/server/database/db', () => ({
  getDb: vi.fn(() => mockDb)
}))

vi.mock('~/server/utils/auth', () => ({
  getAdminUser: vi.fn(() => Promise.resolve({
    id: 1,
    email: 'admin@example.com',
    role: 'admin'
  }))
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password: string, salt: number) => Promise.resolve('hashed_password'))
  }
}))

describe('Admin API - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockDb chain
    Object.assign(mockDb, createMockDb())
  })

  describe('GET /api/admin/database/[table]', () => {
    it('should fetch users table data successfully', async () => {
      const mockUsers: User[] = [
        createMockAuthUser({ id: 1, email: 'user1@example.com' }),
        createMockAuthUser({ id: 2, email: 'user2@example.com' })
      ]

      mockDb.select = vi.fn(() => Promise.resolve(mockUsers))

      const event = createMockEvent()
      event.context.params = { table: 'users' }

      const { default: handler } = await import('~/server/api/admin/database/[table].get')
      const result = await handler(event)

      expect(result).toEqual({
        success: true,
        data: mockUsers
      })
    })

    it('should fetch tasks table data successfully', async () => {
      const mockTasks: Task[] = [
        createMockTask({ id: 1, title: 'Task 1' }),
        createMockTask({ id: 2, title: 'Task 2' })
      ]

      mockDb.select = vi.fn(() => Promise.resolve(mockTasks))

      const event = createMockEvent()
      event.context.params = { table: 'tasks' }

      const { default: handler } = await import('~/server/api/admin/database/[table].get')
      const result = await handler(event)

      expect(result).toEqual({
        success: true,
        data: mockTasks
      })
    })

    it('should fetch k8s_clusters table data successfully', async () => {
      const mockClusters: K8sCluster[] = [
        { id: 1, name: 'cluster1', endpoint: 'https://cluster1.example.com', token: 'token1', createdAt: new Date(), updatedAt: new Date() }
      ]

      mockDb.select = vi.fn(() => Promise.resolve(mockClusters))

      const event = createMockEvent()
      event.context.params = { table: 'k8s_clusters' }

      const { default: handler } = await import('~/server/api/admin/database/[table].get')
      const result = await handler(event)

      expect(result).toEqual({
        success: true,
        data: mockClusters
      })
    })

    it('should fetch k8s_nodes table data successfully', async () => {
      const mockNodes: K8sNode[] = [
        { id: 1, clusterId: 1, name: 'node1', status: 'ready', createdAt: new Date(), updatedAt: new Date() }
      ]

      mockDb.select = vi.fn(() => Promise.resolve(mockNodes))

      const event = createMockEvent()
      event.context.params = { table: 'k8s_nodes' }

      const { default: handler } = await import('~/server/api/admin/database/[table].get')
      const result = await handler(event)

      expect(result).toEqual({
        success: true,
        data: mockNodes
      })
    })

    it('should reject invalid table name', async () => {
      const event = createMockEvent()
      event.context.params = { table: 'invalid_table' }

      const { default: handler } = await import('~/server/api/admin/database/[table].get')
      const result = await handler(event)

      expect(result).toEqual({
        success: false,
        error: '无效的表名'
      })
    })
  })

  describe('POST /api/admin/database/[table]', () => {
    it('should create new record in users table successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        role: 'employee'
      }

      const createdUser = { id: 3, ...newUser, password: 'hashed_password', version: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }

      mockDb.insert = vi.fn(() => ({
        values: vi.fn(() => ({ insertId: 3 }))
      }))
      mockDb.select = vi.fn(() => Promise.resolve([createdUser]))

      const event = createMockEvent({
        body: newUser
      })
      event.context.params = { table: 'users' }

      const { default: handler } = await import('~/server/api/admin/database/[table].post')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
    })

    it('should validate required fields for users (password required)', async () => {
      const invalidUser = {
        email: 'test@example.com'
        // missing password
      }

      const event = createMockEvent({
        body: invalidUser
      })
      event.context.params = { table: 'users' }

      const { default: handler } = await import('~/server/api/admin/database/[table].post')
      const result = await handler(event)

      expect(result).toEqual({
        success: false,
        error: '密码不能为空'
      })
    })

    it('should reject invalid table name', async () => {
      const event = createMockEvent({ body: {} })
      event.context.params = { table: 'invalid_table' }

      const { default: handler } = await import('~/server/api/admin/database/[table].post')
      const result = await handler(event)

      expect(result).toEqual({
        success: false,
        error: '无效的表名'
      })
    })
  })

  describe('PATCH /api/admin/database/[table]/[id]', () => {
    it('should update record successfully', async () => {
      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent({
        body: { email: 'updated@example.com' }
      })
      event.context.params = { table: 'users', id: '1' }

      const { default: handler } = await import('~/server/api/admin/database/[table]/[id].patch')
      const result = await handler(event)

      expect(result).toEqual({
        success: true
      })
    })

    it('should validate table name', async () => {
      const event = createMockEvent({ body: {} })
      event.context.params = { table: 'invalid_table', id: '1' }

      const { default: handler } = await import('~/server/api/admin/database/[table]/[id].patch')
      const result = await handler(event)

      expect(result).toEqual({
        success: false,
        error: '无效的表名'
      })
    })
  })

  describe('DELETE /api/admin/database/[table]/[id]', () => {
    it('should soft delete users record successfully', async () => {
      mockDb.update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
      }))

      const event = createMockEvent()
      event.context.params = { table: 'users', id: '1' }

      const { default: handler } = await import('~/server/api/admin/database/[table]/[id].delete')
      const result = await handler(event)

      expect(result).toEqual({
        success: true
      })
    })

    it('should hard delete k8s_clusters and cascade delete nodes', async () => {
      let deleteCallCount = 0
      mockDb.delete = vi.fn(() => {
        deleteCallCount++
        return {
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }
      })

      const event = createMockEvent()
      event.context.params = { table: 'k8s_clusters', id: '1' }

      const { default: handler } = await import('~/server/api/admin/database/[table]/[id].delete')
      const result = await handler(event)

      expect(result).toEqual({
        success: true
      })

      expect(deleteCallCount).toBe(2)
    })

    it('should validate table name', async () => {
      const event = createMockEvent()
      event.context.params = { table: 'invalid_table', id: '1' }

      const { default: handler } = await import('~/server/api/admin/database/[table]/[id].delete')
      const result = await handler(event)

      expect(result).toEqual({
        success: false,
        error: '无效的表名'
      })
    })
  })
})
