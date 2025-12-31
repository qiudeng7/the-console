import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '~/stores/task'
import { useAuthStore } from '~/stores/auth'
import type { Task, TaskStats } from '~/types'

// Mock $fetch
global.$fetch = vi.fn()

describe('Task Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      const store = useTaskStore()
      expect(store.tasks).toEqual([])
      expect(store.currentTask).toBeNull()
      expect(store.stats).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.total).toBe(0)
    })
  })

  describe('Fetch Tasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Test Task',
          category: 'Testing',
          description: 'Test description',
          status: 'todo',
          createdBy: 1,
          createdAt: '2025/12/31 00:00:00',
          updatedAt: '2025/12/31 00:00:00'
        }
      ]

      const mockResponse = {
        data: {
          tasks: mockTasks,
          total: 1
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const store = useTaskStore()
      const result = await store.fetchTasks()

      expect(store.tasks).toEqual(mockTasks)
      expect(store.total).toBe(1)
      expect(store.loading).toBe(false)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle fetch tasks error', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('获取任务列表失败'))

      const store = useTaskStore()
      await expect(store.fetchTasks()).rejects.toThrow('获取任务列表失败')
      expect(store.loading).toBe(false)
    })

    it('should pass query parameters to API', async () => {
      const mockResponse = {
        data: {
          tasks: [],
          total: 0
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const store = useTaskStore()
      await store.fetchTasks({ status: 'todo', page: 1, pageSize: 10, search: 'test' })

      expect($fetch).toHaveBeenCalledWith('/api/tasks', {
        params: { status: 'todo', page: 1, pageSize: 10, search: 'test' }
      })
    })

    it('should set loading to true during fetch', async () => {
      const mockResponse = {
        data: {
          tasks: [],
          total: 0
        }
      }

      vi.mocked($fetch).mockImplementationOnce(() => {
        const store = useTaskStore()
        expect(store.loading).toBe(true)
        return Promise.resolve(mockResponse as any)
      })

      const store = useTaskStore()
      await store.fetchTasks()
      expect(store.loading).toBe(false)
    })
  })

  describe('Fetch Task', () => {
    it('should fetch single task successfully', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Test Task',
        category: 'Testing',
        description: 'Test description',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const mockResponse = {
        data: {
          task: mockTask
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const store = useTaskStore()
      const result = await store.fetchTask(1)

      expect(store.currentTask).toEqual(mockTask)
      expect(result).toEqual(mockTask)
      expect(store.loading).toBe(false)
    })

    it('should handle fetch task error', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('获取任务详情失败'))

      const store = useTaskStore()
      await expect(store.fetchTask(999)).rejects.toThrow('获取任务详情失败')
      expect(store.loading).toBe(false)
    })
  })

  describe('Create Task', () => {
    it('should create task successfully', async () => {
      const newTask: Partial<Task> = {
        title: 'New Task',
        category: 'Testing',
        description: 'New task description',
        status: 'todo'
      }

      const mockCreatedTask: Task = {
        id: 1,
        ...newTask,
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      } as Task

      const mockResponse = {
        data: {
          task: mockCreatedTask
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      // Mock auth store
      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      const result = await store.createTask(newTask)

      expect(store.tasks[0]).toEqual(mockCreatedTask)
      expect(result).toEqual(mockCreatedTask)
      expect($fetch).toHaveBeenCalledWith('/api/tasks', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token'
        },
        body: newTask
      })
    })

    it('should handle create task error', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('创建任务失败'))

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      await expect(store.createTask({ title: 'Test' })).rejects.toThrow('创建任务失败')
    })

    it('should add new task to beginning of tasks array', async () => {
      const existingTask: Task = {
        id: 1,
        title: 'Existing Task',
        category: 'Testing',
        description: 'Existing',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const newTask: Task = {
        id: 2,
        title: 'New Task',
        category: 'Testing',
        description: 'New',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      store.tasks = [existingTask]

      const mockResponse = { data: { task: newTask } }
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      store.tasks = [existingTask]
      await store.createTask({ title: 'New Task', category: 'Testing', description: 'New' })

      expect(store.tasks[0]).toEqual(newTask)
      expect(store.tasks[1]).toEqual(existingTask)
    })
  })

  describe('Update Task', () => {
    it('should update task successfully', async () => {
      const originalTask: Task = {
        id: 1,
        title: 'Original Title',
        category: 'Testing',
        description: 'Original',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const updatedTask: Task = {
        ...originalTask,
        title: 'Updated Title',
        status: 'in_progress'
      }

      const mockResponse = { data: { task: updatedTask } }
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      store.tasks = [originalTask]
      store.currentTask = originalTask

      const result = await store.updateTask(1, { title: 'Updated Title', status: 'in_progress' })

      expect(store.tasks[0]).toEqual(updatedTask)
      expect(store.currentTask).toEqual(updatedTask)
      expect(result).toEqual(updatedTask)
    })

    it('should handle update task error', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('更新任务失败'))

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      await expect(store.updateTask(1, { title: 'Updated' })).rejects.toThrow('更新任务失败')
    })

    it('should update task in tasks array by id', async () => {
      const task1: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Testing',
        description: 'First',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const task2: Task = {
        id: 2,
        title: 'Task 2',
        category: 'Testing',
        description: 'Second',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const updatedTask2: Task = {
        ...task2,
        title: 'Updated Task 2'
      }

      const mockResponse = { data: { task: updatedTask2 } }
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      store.tasks = [task1, task2]

      await store.updateTask(2, { title: 'Updated Task 2' })

      expect(store.tasks[0]).toEqual(task1)
      expect(store.tasks[1]).toEqual(updatedTask2)
    })

    it('should not update tasks array if task id not found', async () => {
      const originalTask: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Testing',
        description: 'Test',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const mockResponse = { data: { task: originalTask } }
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      store.tasks = [originalTask]

      await store.updateTask(999, { title: 'Updated' })

      expect(store.tasks[0]).toEqual(originalTask)
    })
  })

  describe('Delete Task', () => {
    it('should delete task successfully', async () => {
      const task1: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Testing',
        description: 'First',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const task2: Task = {
        id: 2,
        title: 'Task 2',
        category: 'Testing',
        description: 'Second',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const mockResponse = {}
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      store.tasks = [task1, task2]

      await store.deleteTask(1)

      expect(store.tasks).toEqual([task2])
      expect($fetch).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer test-token'
        }
      })
    })

    it('should handle delete task error', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('删除任务失败'))

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      await expect(store.deleteTask(1)).rejects.toThrow('删除任务失败')
    })

    it('should clear currentTask if deleted task matches', async () => {
      const task: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Testing',
        description: 'Test',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const mockResponse = {}
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      store.tasks = [task]
      store.currentTask = task

      await store.deleteTask(1)

      expect(store.currentTask).toBeNull()
      expect(store.tasks).toEqual([])
    })

    it('should not clear currentTask if deleted task id does not match', async () => {
      const task1: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Testing',
        description: 'First',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const task2: Task = {
        id: 2,
        title: 'Task 2',
        category: 'Testing',
        description: 'Second',
        status: 'todo',
        createdBy: 1,
        createdAt: '2025/12/31 00:00:00',
        updatedAt: '2025/12/31 00:00:00'
      }

      const mockResponse = {}
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      store.tasks = [task1, task2]
      store.currentTask = task2

      await store.deleteTask(1)

      expect(store.currentTask).toEqual(task2)
      expect(store.tasks).toEqual([task2])
    })
  })

  describe('Fetch Stats', () => {
    it('should fetch stats successfully', async () => {
      const mockStats: TaskStats = {
        total: 10,
        todo: 3,
        inProgress: 4,
        completed: 3,
        byCategory: {
          Testing: 5,
          Development: 3,
          Research: 2
        }
      }

      const mockResponse = {
        data: {
          stats: mockStats
        }
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      const result = await store.fetchStats()

      expect(store.stats).toEqual(mockStats)
      expect(result).toEqual(mockStats)
    })

    it('should handle fetch stats error', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('获取统计数据失败'))

      const authStore = useAuthStore()
      authStore.token = 'test-token'

      const store = useTaskStore()
      await expect(store.fetchStats()).rejects.toThrow('获取统计数据失败')
    })

    it('should include authorization header', async () => {
      const mockStats: TaskStats = {
        total: 0,
        todo: 0,
        inProgress: 0,
        completed: 0,
        byCategory: {}
      }

      const mockResponse = { data: { stats: mockStats } }
      vi.mocked($fetch).mockResolvedValueOnce(mockResponse as any)

      const authStore = useAuthStore()
      authStore.token = 'secret-token'

      const store = useTaskStore()
      await store.fetchStats()

      expect($fetch).toHaveBeenCalledWith('/api/tasks/stats', {
        headers: {
          Authorization: 'Bearer secret-token'
        }
      })
    })
  })
})
