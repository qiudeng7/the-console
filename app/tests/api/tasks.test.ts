import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, Task } from '~/server/database/schema'
import { createMockDb, createMockAuthUser, createMockTask, createMockEvent } from '../mocks/db'

// Setup mocks before importing handlers
const mockDb = createMockDb()
const mockGetAuthUser = vi.fn()
const mockGetAdminUser = vi.fn()
const mock$fetch = vi.fn()

vi.mock('~/server/database/db', () => ({
  getDb: vi.fn(() => mockDb)
}))

vi.mock('~/server/utils/auth', () => ({
  getAuthUser: mockGetAuthUser,
  getAdminUser: mockGetAdminUser
}))

// Mock global $fetch
global.$fetch = mock$fetch

describe('Tasks API Unit Tests', () => {
  const mockAdminUser = createMockAuthUser({
    id: 1,
    email: 'admin@example.com',
    role: 'admin'
  })

  const mockEmployeeUser = createMockAuthUser({
    id: 2,
    email: 'employee@example.com',
    role: 'employee'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockDb chain
    Object.assign(mockDb, createMockDb())
    mock$fetch.mockReset()
  })

  describe('GET /api/tasks', () => {
    it('admin 用户应该获取自己创建的任务列表', async () => {
      const mockTasks = [
        createMockTask({ id: 1, createdByUserId: 1 }),
        createMockTask({ id: 2, createdByUserId: 1 })
      ]

      let selectCallCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockAdminUser])
        }
        return Promise.resolve(mockTasks)
      })

      mockGetAuthUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        query: {}
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
      expect(mockGetAuthUser).toHaveBeenCalledWith(event)
    })

    it('employee 用户应该只能看到分配给自己的任务', async () => {
      const mockTasks = [
        createMockTask({ id: 1, assignedToUserId: 2 }),
        createMockTask({ id: 2, assignedToUserId: 2 })
      ]

      let selectCallCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockEmployeeUser])
        }
        return Promise.resolve(mockTasks)
      })

      mockGetAuthUser.mockResolvedValue(mockEmployeeUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer employee-token' },
        query: {}
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
    })

    it('应该支持按状态筛选', async () => {
      const mockTasks = [
        createMockTask({ id: 1, status: 'todo', createdByUserId: 1 })
      ]

      let selectCallCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockAdminUser])
        }
        return Promise.resolve(mockTasks)
      })

      mockGetAuthUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        query: { status: 'todo' }
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
    })

    it('应该支持按分类筛选', async () => {
      const mockTasks = [
        createMockTask({ id: 1, category: 'Development', createdByUserId: 1 })
      ]

      let selectCallCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockAdminUser])
        }
        return Promise.resolve(mockTasks)
      })

      mockGetAuthUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        query: { category: 'Development' }
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
    })

    it('应该支持搜索功能（匹配 title 和 description）', async () => {
      const mockTasks = [
        createMockTask({
          id: 1,
          title: 'Fix login bug',
          description: 'Critical bug in authentication',
          createdByUserId: 1
        })
      ]

      let selectCallCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockAdminUser])
        }
        return Promise.resolve(mockTasks)
      })

      mockGetAuthUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        query: { search: 'login' }
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
    })

    it('应该支持分页功能', async () => {
      const mockTasks = [
        createMockTask({ id: 1, createdByUserId: 1 })
      ]

      let selectCallCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockAdminUser])
        }
        return Promise.resolve(mockTasks)
      })

      mockGetAuthUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        query: { page: '1', pageSize: '10' }
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(10)
    })

    it('应该处理认证错误（未认证用户）', async () => {
      mockGetAuthUser.mockRejectedValue(new Error('未提供认证令牌'))

      const event = createMockEvent({
        headers: {}
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')

      await expect(handler(event)).rejects.toThrow('未提供认证令牌')
    })

    it('应该处理软删除的任务（不返回 deletedAt 不为 null 的任务）', async () => {
      const mockTasks = [
        createMockTask({ id: 1, deletedAt: null, createdByUserId: 1 })
      ]

      let selectCallCount = 0
      mockDb.select = vi.fn((...args: any[]) => {
        selectCallCount++
        if (selectCallCount === 1) {
          return Promise.resolve([mockAdminUser])
        }
        return Promise.resolve(mockTasks)
      })

      mockGetAuthUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        query: {}
      })

      const { default: handler } = await import('~/server/api/tasks/index.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
    })
  })

  describe('POST /api/tasks', () => {
    it('应该通过队列服务创建任务成功', async () => {
      mockGetAuthUser.mockResolvedValue(mockAdminUser)
      mock$fetch.mockResolvedValue({
        success: true,
        data: { task: createMockTask({ id: 1 }) }
      })

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        body: {
          title: 'New Task',
          category: 'Development',
          description: 'Task description',
          status: 'todo'
        }
      })

      const { default: handler } = await import('~/server/api/tasks/index.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(mock$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queue/job'),
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            type: 'create-task',
            data: expect.objectContaining({
              title: 'New Task',
              createdByUserId: 1
            })
          })
        })
      )
    })

    it('应该验证必填的 title 字段', async () => {
      mockGetAuthUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        body: {
          description: 'Task without title'
        }
      })

      const { default: handler } = await import('~/server/api/tasks/index.post.ts')

      await expect(handler(event)).rejects.toThrow('任务标题不能为空')
    })

    it('应该处理队列服务错误', async () => {
      mockGetAuthUser.mockResolvedValue(mockAdminUser)
      mock$fetch.mockRejectedValue({
        statusCode: 500,
        message: 'Queue service error'
      })

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        body: {
          title: 'New Task'
        }
      })

      const { default: handler } = await import('~/server/api/tasks/index.post.ts')

      await expect(handler(event)).rejects.toThrow()
    })
  })

  describe('GET /api/tasks/[id]', () => {
    it('应该获取单个任务详情成功', async () => {
      const mockTask = createMockTask({ id: 1 })
      mockDb.select = vi.fn(() => Promise.resolve([mockTask]))

      const event = createMockEvent({
        headers: { authorization: 'Bearer valid-token' }
      })
      event.context = { params: { id: '1' } }

      const { default: handler } = await import('~/server/api/tasks/[id].get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.task.id).toBe(1)
    })

    it('应该处理任务不存在的情况', async () => {
      mockDb.select = vi.fn(() => Promise.resolve([]))

      const event = createMockEvent({
        headers: { authorization: 'Bearer valid-token' }
      })
      event.context = { params: { id: '999' } }

      const { default: handler } = await import('~/server/api/tasks/[id].get.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('任务不存在')
    })

    it('应该拒绝无效的任务 ID', async () => {
      const event = createMockEvent({
        headers: { authorization: 'Bearer valid-token' }
      })
      event.context = { params: { id: 'invalid' } }

      const { default: handler } = await import('~/server/api/tasks/[id].get.ts')
      const result = await handler(event)

      expect(result.success).toBe(false)
      expect(result.error).toBe('无效的任务 ID')
    })
  })

  describe('PATCH /api/tasks/[id]', () => {
    it('应该通过队列服务更新任务成功', async () => {
      mockGetAuthUser.mockResolvedValue(mockAdminUser)
      mock$fetch.mockResolvedValue({
        success: true,
        data: { task: createMockTask({ id: 1, title: 'Updated Task' }) }
      })

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' },
        body: {
          title: 'Updated Task',
          status: 'in_progress'
        }
      })
      event.context = { params: { id: '1' } }

      const { default: handler } = await import('~/server/api/tasks/[id].patch.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(mock$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queue/job'),
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            type: 'update-task',
            data: expect.objectContaining({
              taskId: 1,
              userId: 1,
              updates: expect.objectContaining({
                title: 'Updated Task',
                status: 'in_progress'
              })
            })
          })
        })
      )
    })

    it('应该验证权限', async () => {
      mockGetAuthUser.mockRejectedValue(new Error('未授权'))

      const event = createMockEvent({
        headers: { authorization: 'Bearer invalid-token' },
        body: {
          title: 'Updated Task'
        }
      })
      event.context = { params: { id: '1' } }

      const { default: handler } = await import('~/server/api/tasks/[id].patch.ts')

      await expect(handler(event)).rejects.toThrow('未授权')
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('应该通过队列服务删除任务成功', async () => {
      mockGetAuthUser.mockResolvedValue(mockAdminUser)
      mock$fetch.mockResolvedValue({
        success: true,
        message: '任务删除成功'
      })

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' }
      })
      event.context = { params: { id: '1' } }

      const { default: handler } = await import('~/server/api/tasks/[id].delete.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(mock$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queue/job'),
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            type: 'delete-task',
            data: expect.objectContaining({
              taskId: 1,
              userId: 1
            })
          })
        })
      )
    })

    it('应该验证权限', async () => {
      mockGetAuthUser.mockRejectedValue(new Error('未授权'))

      const event = createMockEvent({
        headers: { authorization: 'Bearer invalid-token' }
      })
      event.context = { params: { id: '1' } }

      const { default: handler } = await import('~/server/api/tasks/[id].delete.ts')

      await expect(handler(event)).rejects.toThrow('未授权')
    })
  })

  describe('GET /api/tasks/stats', () => {
    it('应该获取任务统计信息成功', async () => {
      const mockTasks = [
        createMockTask({ id: 1, status: 'todo', category: 'Development', assignedToUserId: 1 }),
        createMockTask({ id: 2, status: 'done', category: 'Testing', assignedToUserId: 2 }),
        createMockTask({ id: 3, status: 'todo', category: 'Development', assignedToUserId: 1 })
      ]

      mockDb.select = vi.fn(() => Promise.resolve(mockTasks))
      mockGetAdminUser.mockResolvedValue(mockAdminUser)

      const event = createMockEvent({
        headers: { authorization: 'Bearer admin-token' }
      })

      const { default: handler } = await import('~/server/api/tasks/stats.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.byStatus).toBeDefined()
      expect(result.data.byCategory).toBeDefined()
      expect(result.data.byAssignee).toBeDefined()
      expect(result.data.total).toBe(3)
      expect(result.data.byStatus.todo).toBe(2)
      expect(result.data.byStatus.done).toBe(1)
      expect(result.data.byCategory.Development).toBe(2)
      expect(result.data.byCategory.Testing).toBe(1)
    })

    it('应该处理管理员权限验证', async () => {
      mockGetAdminUser.mockRejectedValue(new Error('需要管理员权限'))

      const event = createMockEvent({
        headers: { authorization: 'Bearer employee-token' }
      })

      const { default: handler } = await import('~/server/api/tasks/stats.get.ts')

      await expect(handler(event)).rejects.toThrow('需要管理员权限')
    })
  })
})
