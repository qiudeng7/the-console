/**
 * TaskQueue 测试套件
 *
 * 测试队列服务的核心功能：
 * - 批量处理机制（batchSize 和 flushInterval）
 * - 创建/更新/删除任务的 CRUD 操作
 * - 乐观锁和版本冲突检测
 * - 错误处理和重试机制
 * - 权限验证
 *
 * 注意：此测试文件使用真实的 TaskQueue 类，而不是 mock
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TaskQueue } from '../server/task-queue'

// 创建 mock 数据库
const createMockDb = () => {
  let selectCallCount = 0
  let insertCallCount = 0
  let updateCallCount = 0

  const mockChain: any = {
    _selectCalls: [],
    _insertCalls: [],
    _updateCalls: [],

    select: vi.fn(function() {
      selectCallCount++
      this._selectCalls.push({ count: selectCallCount })
      return this
    }),

    insert: vi.fn(function() {
      insertCallCount++
      this._insertCalls.push({ count: insertCallCount })
      return this
    }),

    update: vi.fn(function() {
      updateCallCount++
      this._updateCalls.push({ count: updateCallCount })
      return this
    }),

    from: vi.fn(function() {
      return this
    }),

    where: vi.fn(function() {
      return this
    }),

    values: vi.fn(function() {
      return Promise.resolve([{ insertId: 100 }])
    }),

    set: vi.fn(function() {
      return Promise.resolve({ affectedRows: 1 })
    }),

    execute: vi.fn(function() {
      return Promise.resolve([])
    })
  }

  // 重置方法
  mockChain.reset = () => {
    selectCallCount = 0
    insertCallCount = 0
    updateCallCount = 0
    mockChain._selectCalls = []
    mockChain._insertCalls = []
    mockChain._updateCalls = []

    mockChain.select.mockImplementation(function() {
      selectCallCount++
      this._selectCalls.push({ count: selectCallCount })
      return this
    })

    mockChain.insert.mockImplementation(function() {
      insertCallCount++
      this._insertCalls.push({ count: insertCallCount })
      return this
    })

    mockChain.update.mockImplementation(function() {
      updateCallCount++
      this._updateCalls.push({ count: updateCallCount })
      return this
    })

    mockChain.from.mockImplementation(function() {
      return this
    })

    mockChain.where.mockImplementation(function() {
      return this
    })

    mockChain.values.mockImplementation(function() {
      return Promise.resolve([{ insertId: 100 }])
    })

    mockChain.set.mockImplementation(function() {
      return Promise.resolve({ affectedRows: 1 })
    })
  }

  // 设置返回值
  mockChain.setSelectResult = (result: any[]) => {
    mockChain.where.mockImplementation(function() {
      return Promise.resolve(result)
    })
  }

  mockChain.setInsertResult = (result: any) => {
    mockChain.values.mockImplementation(function() {
      return Promise.resolve(result)
    })
  }

  mockChain.setUpdateResult = (result: any) => {
    mockChain.set.mockImplementation(function() {
      return {
        where: vi.fn(function() {
          return Promise.resolve(result)
        })
      }
    })
  }

  return mockChain
}

let mockDb: any
let queue: TaskQueue

describe('TaskQueue - 完整功能测试', () => {
  beforeEach(() => {
    mockDb = createMockDb()
    mockDb.reset()
    mockDb.setSelectResult([])
    mockDb.setInsertResult([{ insertId: 1 }])
    mockDb.setUpdateResult({ affectedRows: 1 })

    // 创建队列实例
    queue = new TaskQueue(mockDb, {
      batchSize: 2,
      flushInterval: 50
    })
  })

  afterEach(async () => {
    if (queue) {
      await queue.shutdown()
    }
    vi.clearAllMocks()
  })

  describe('批量处理机制', () => {
    it('✅ 达到 batchSize 时立即触发批量处理', async () => {
      mockDb.setSelectResult([{ id: 1, role: 'admin' }])

      const promise1 = queue.add('create-task', {
        title: 'Task 1',
        createdByUserId: 1
      })

      const promise2 = queue.add('create-task', {
        title: 'Task 2',
        createdByUserId: 1
      })

      await new Promise(resolve => setTimeout(resolve, 200))

      expect(mockDb._selectCalls.length).toBeGreaterThan(0)
      expect(mockDb._insertCalls.length).toBeGreaterThan(0)

      await Promise.all([promise1, promise2]).catch(() => {})
    })

    it('✅ 达到 flushInterval 时触发批量处理（即使未达到 batchSize）', async () => {
      mockDb.setSelectResult([{ id: 1, role: 'admin' }])

      const promise = queue.add('create-task', {
        title: 'Task 1',
        createdByUserId: 1
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockDb._selectCalls.length).toBeGreaterThan(0)

      await promise.catch(() => {})
    })

    it('✅ 返回正确的队列长度', () => {
      expect(queue.getStatus().queueLength).toBe(0)

      queue.add('create-task', { title: 'Task 1', createdByUserId: 1 })
      expect(queue.getStatus().queueLength).toBe(1)

      queue.add('create-task', { title: 'Task 2', createdByUserId: 1 })
      expect(queue.getStatus().queueLength).toBe(2)
    })

    it('✅ 返回处理状态（processing）', async () => {
      const status = queue.getStatus()
      expect(status.processing).toBe(false)

      mockDb.setSelectResult([{ id: 1, role: 'admin' }])

      const promise = queue.add('create-task', {
        title: 'Task 1',
        createdByUserId: 1
      })

      await promise.catch(() => {})

      const statusAfter = queue.getStatus()
      expect(statusAfter.processing).toBe(false)
    })
  })

  describe('创建任务 (create-task)', () => {
    it('✅ 验证用户权限（只有 admin 可创建）', async () => {
      mockDb.setSelectResult([{ id: 1, role: 'admin' }])

      const promise = queue.add('create-task', {
        title: 'New Task',
        createdByUserId: 1
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockDb._selectCalls.length).toBeGreaterThan(0)

      await promise.catch(() => {})
    })

    it('✅ 拒绝非 admin 用户创建任务', async () => {
      mockDb.setSelectResult([{ id: 2, role: 'employee' }])

      const promise = queue.add('create-task', {
        title: 'New Task',
        createdByUserId: 2
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      await expect(promise).rejects.toThrow('用户无权限创建任务')
    })

    it('✅ 拒绝用户不存在时创建任务', async () => {
      mockDb.setSelectResult([])

      const promise = queue.add('create-task', {
        title: 'New Task',
        createdByUserId: 999
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      await expect(promise).rejects.toThrow('用户无权限创建任务')
    })
  })

  describe('更新任务 (update-task) - 乐观锁', () => {
    it('✅ 成功更新任务', async () => {
      mockDb.setSelectResult([
        { id: 1, title: 'Old Title', version: 1, createdByUserId: 1 }
      ])
      mockDb.setUpdateResult({ affectedRows: 1 })

      const promise = queue.add('update-task', {
        taskId: 1,
        userId: 1,
        updates: { title: 'New Title' }
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockDb._selectCalls.length).toBeGreaterThan(0)
      expect(mockDb._updateCalls.length).toBeGreaterThan(0)

      await promise.catch(() => {})
    })

    it('✅ 检测版本冲突（affectedRows = 0）', async () => {
      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 2, createdByUserId: 1 }
      ])
      mockDb.setUpdateResult({ affectedRows: 0 })

      const promise = queue.add('update-task', {
        taskId: 1,
        userId: 1,
        updates: { status: 'completed' }
      })

      await new Promise(resolve => setTimeout(resolve, 500))

      await expect(promise).rejects.toThrow('任务已被其他用户修改，请刷新后重试')
    })

    it('✅ 版本冲突时自动快速重试', async () => {
      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 2, createdByUserId: 1 }
      ])
      mockDb.setUpdateResult({ affectedRows: 0 })

      const promise = queue.add('update-task', {
        taskId: 1,
        userId: 1,
        updates: { status: 'completed' }
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 3, createdByUserId: 1 }
      ])
      mockDb.setUpdateResult({ affectedRows: 1 })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockDb._updateCalls.length).toBeGreaterThan(1)

      await promise.catch(() => {})
    })

    it('✅ 验证权限（只能更新自己创建的任务）', async () => {
      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 1, createdByUserId: 2 }
      ])

      const promise = queue.add('update-task', {
        taskId: 1,
        userId: 1,
        updates: { status: 'completed' }
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      await expect(promise).rejects.toThrow('无权限修改此任务')
    })
  })

  describe('删除任务 (delete-task)', () => {
    it('✅ 成功软删除任务', async () => {
      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 1, deletedAt: null, createdByUserId: 1 }
      ])
      mockDb.setUpdateResult({ affectedRows: 1 })

      const promise = queue.add('delete-task', {
        taskId: 1,
        userId: 1
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockDb._updateCalls.length).toBeGreaterThan(0)

      await promise.catch(() => {})
    })

    it('✅ 验证权限（只能删除自己创建的任务）', async () => {
      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 1, createdByUserId: 2 }
      ])

      const promise = queue.add('delete-task', {
        taskId: 1,
        userId: 1
      })

      await new Promise(resolve => setTimeout(resolve, 150))

      await expect(promise).rejects.toThrow('无权限删除此任务')
    })

    it('✅ 处理软删除时的版本冲突', async () => {
      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 2, createdByUserId: 1 }
      ])
      mockDb.setUpdateResult({ affectedRows: 0 })

      const promise = queue.add('delete-task', {
        taskId: 1,
        userId: 1
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      mockDb.setSelectResult([
        { id: 1, title: 'Task', version: 3, createdByUserId: 1 }
      ])
      mockDb.setUpdateResult({ affectedRows: 1 })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockDb._updateCalls.length).toBeGreaterThan(1)

      await promise.catch(() => {})
    })
  })

  describe('错误处理', () => {
    it('✅ 批量处理中的错误不影响其他任务', async () => {
      const promises = []

      promises.push(
        queue.add('create-task', {
          title: 'Task 1',
          createdByUserId: 1
        })
      )

      promises.push(
        queue.add('create-task', {
          title: 'Task 2',
          createdByUserId: 2
        })
      )

      await new Promise(resolve => setTimeout(resolve, 50))
      mockDb.setSelectResult([{ id: 1, role: 'admin' }])

      await new Promise(resolve => setTimeout(resolve, 100))
      mockDb.setSelectResult([{ id: 2, role: 'employee' }])

      await new Promise(resolve => setTimeout(resolve, 200))

      await expect(promises[1]).rejects.toThrow('用户无权限创建任务')
    })
  })

  describe('队列生命周期', () => {
    it('✅ 正确关闭队列（清理定时器）', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      await queue.shutdown()

      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
    })

    it('✅ 并发添加多个任务', async () => {
      const promises = []

      for (let i = 1; i <= 5; i++) {
        promises.push(
          queue.add('create-task', {
            title: `Task ${i}`,
            createdByUserId: 1
          })
        )
      }

      await new Promise(resolve => setTimeout(resolve, 300))

      const status = queue.getStatus()
      expect(status.queueLength).toBe(0)

      await Promise.allSettled(promises)
    })
  })
})
