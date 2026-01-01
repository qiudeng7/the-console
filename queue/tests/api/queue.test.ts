import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockEvent } from '../mocks/queue'
import { mockTaskQueueClass, mockDb } from '../setup'

describe('Queue API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('应该返回健康状态 { status: "ok" }', async () => {
      const event = createMockEvent()

      const { default: handler } = await import('~/server/api/health.get.ts')
      const result = await handler(event)

      expect(result).toEqual({ status: 'ok' })
    })

    it('应该初始化队列实例（单例模式）', async () => {
      const event = createMockEvent()

      const { default: handler, queue } = await import('~/server/api/health.get.ts')

      await handler(event)

      expect(queue).toBeDefined()
      expect(queue.getStatus).toBeDefined()
    })

    it('多次调用应该返回相同的队列实例', async () => {
      const event = createMockEvent()

      const { queue: queue1 } = await import('~/server/api/health.get.ts')
      const { queue: queue2 } = await import('~/server/api/health.get.ts')

      expect(queue1).toBe(queue2)
    })
  })

  describe('POST /api/queue/job', () => {
    it('应该成功添加 create-task 任务到队列', async () => {
      const event = createMockEvent({
        body: {
          type: 'create-task',
          data: {
            title: 'New Task',
            category: 'Development',
            description: 'Task description',
            createdByUserId: 1,
            assignedToUserId: 1
          }
        }
      })

      const { default: handler } = await import('~/server/api/queue/job.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ jobId: 'mock-job-id' })
    })

    it('应该成功添加 update-task 任务到队列', async () => {
      const event = createMockEvent({
        body: {
          type: 'update-task',
          data: {
            taskId: 1,
            userId: 1,
            updates: { title: 'Updated Task', status: 'in_progress' }
          }
        }
      })

      const { default: handler } = await import('~/server/api/queue/job.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ jobId: 'mock-job-id' })
    })

    it('应该成功添加 delete-task 任务到队列', async () => {
      const event = createMockEvent({
        body: {
          type: 'delete-task',
          data: {
            taskId: 1,
            userId: 1
          }
        }
      })

      const { default: handler } = await import('~/server/api/queue/job.post.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ jobId: 'mock-job-id' })
    })

    it('应该支持所有有效的任务类型', async () => {
      const validTypes = ['create-task', 'update-task', 'delete-task']

      for (const type of validTypes) {
        const event = createMockEvent({
          body: { type, data: { test: 'data' } }
        })

        const { default: handler } = await import('~/server/api/queue/job.post.ts')
        const result = await handler(event)

        expect(result.success).toBe(true)
      }
    })

    it('应该处理队列错误并返回 500', async () => {
      const { queue } = await import('~/server/api/health.get.ts')
      queue.add.mockRejectedValueOnce(new Error('Queue processing failed'))

      const event = createMockEvent({
        body: {
          type: 'create-task',
          data: { title: 'Test' }
        }
      })

      const { default: handler } = await import('~/server/api/queue/job.post.ts')

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 500,
        message: 'Queue processing failed'
      })
    })
  })

  describe('GET /api/queue/status', () => {
    it('应该返回队列状态信息', async () => {
      const { queue } = await import('~/server/api/health.get.ts')
      queue.getStatus.mockReturnValueOnce({ queueLength: 5, processing: true })

      const event = createMockEvent()

      const { default: handler } = await import('~/server/api/queue/status.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.queueLength).toBe(5)
      expect(result.data.processing).toBe(true)
    })

    it('应该返回空队列的状态', async () => {
      const { queue } = await import('~/server/api/health.get.ts')
      queue.getStatus.mockReturnValueOnce({ queueLength: 0, processing: false })

      const event = createMockEvent()

      const { default: handler } = await import('~/server/api/queue/status.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.queueLength).toBe(0)
      expect(result.data.processing).toBe(false)
    })

    it('应该返回正在处理的状态', async () => {
      const { queue } = await import('~/server/api/health.get.ts')
      queue.getStatus.mockReturnValueOnce({ queueLength: 10, processing: true })

      const event = createMockEvent()

      const { default: handler } = await import('~/server/api/queue/status.get.ts')
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(result.data.queueLength).toBe(10)
      expect(result.data.processing).toBe(true)
    })

    it('应该多次调用获取最新状态', async () => {
      const { queue } = await import('~/server/api/health.get.ts')

      queue.getStatus.mockReturnValueOnce({ queueLength: 3, processing: false })
      const event1 = createMockEvent()
      const { default: handler } = await import('~/server/api/queue/status.get.ts')
      const result1 = await handler(event1)
      expect(result1.data.queueLength).toBe(3)

      queue.getStatus.mockReturnValueOnce({ queueLength: 7, processing: true })
      const event2 = createMockEvent()
      const result2 = await handler(event2)
      expect(result2.data.queueLength).toBe(7)
      expect(result2.data.processing).toBe(true)
    })
  })

  describe('队列错误处理集成测试', () => {
    it('应该正确处理版本冲突错误', async () => {
      const { queue } = await import('~/server/api/health.get.ts')
      queue.add.mockRejectedValueOnce(new Error('VERSION_CONFLICT'))

      const event = createMockEvent({
        body: {
          type: 'update-task',
          data: { taskId: 1, userId: 1, updates: { title: 'Updated' } }
        }
      })

      const { default: handler } = await import('~/server/api/queue/job.post.ts')

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 500,
        message: 'VERSION_CONFLICT'
      })
    })

    it('应该正确处理权限错误', async () => {
      const { queue } = await import('~/server/api/health.get.ts')
      queue.add.mockRejectedValueOnce(new Error('用户无权限创建任务'))

      const event = createMockEvent({
        body: {
          type: 'create-task',
          data: { title: 'Test', createdByUserId: 2 }
        }
      })

      const { default: handler } = await import('~/server/api/queue/job.post.ts')

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 500,
        message: '用户无权限创建任务'
      })
    })

    it('应该正确处理任务不存在错误', async () => {
      const { queue } = await import('~/server/api/health.get.ts')
      queue.add.mockRejectedValueOnce(new Error('任务不存在'))

      const event = createMockEvent({
        body: {
          type: 'update-task',
          data: { taskId: 999, userId: 1, updates: {} }
        }
      })

      const { default: handler } = await import('~/server/api/queue/job.post.ts')

      await expect(handler(event)).rejects.toMatchObject({
        statusCode: 500,
        message: '任务不存在'
      })
    })
  })
})
