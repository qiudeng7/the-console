import type { Task, TaskListParams, TaskListResponse, TaskStats } from '~~/types'
import { useAuthStore } from './auth'

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const stats = ref<TaskStats | null>(null)
  const loading = ref(false)
  const total = ref(0)

  // Actions
  async function fetchTasks(params: TaskListParams = {}) {
    const authStore = useAuthStore()
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: TaskListResponse; error?: string }>('/api/tasks', {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        },
        params
      })

      if (!response.success || response.error) {
        throw new Error(response.error || '获取任务列表失败')
      }

      if (!response.data) throw new Error('Invalid response')

      tasks.value = response.data.tasks
      total.value = response.data.total

      return response.data
    } catch (error: any) {
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTask(id: number) {
    const authStore = useAuthStore()
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data?: { task: Task }; error?: string }>(`/api/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      })

      if (!response.success || response.error) {
        throw new Error(response.error || '获取任务详情失败')
      }

      if (!response.data) throw new Error('Invalid response')

      currentTask.value = response.data.task

      return response.data.task
    } catch (error: any) {
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createTask(taskData: Partial<Task>) {
    const authStore = useAuthStore()
    try {
      const response = await $fetch<{ success: boolean; data?: { task: Task }; error?: string }>('/api/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        },
        body: taskData
      })

      if (!response.success || response.error) {
        throw new Error(response.error || '创建任务失败')
      }

      if (!response.data) throw new Error('Invalid response')

      tasks.value.unshift(response.data.task)

      return response.data.task
    } catch (error: any) {
      throw error
    }
  }

  async function updateTask(id: number, taskData: Partial<Task>) {
    const authStore = useAuthStore()
    try {
      const response = await $fetch<{ success: boolean; data?: { task: Task }; error?: string }>(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        },
        body: taskData
      })

      if (!response.success || response.error) {
        throw new Error(response.error || '更新任务失败')
      }

      if (!response.data) throw new Error('Invalid response')

      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = response.data.task
      }
      if (currentTask.value?.id === id) {
        currentTask.value = response.data.task
      }

      return response.data.task
    } catch (error: any) {
      // 错误消息已经被插件处理过了，直接重新抛出
      throw error
    }
  }

  async function deleteTask(id: number) {
    const authStore = useAuthStore()
    try {
      const response = await $fetch<{ success: boolean; error?: string }>(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      })

      if (!response.success || response.error) {
        throw new Error(response.error || '删除任务失败')
      }

      tasks.value = tasks.value.filter(t => t.id !== id)
      if (currentTask.value?.id === id) {
        currentTask.value = null
      }
    } catch (error: any) {
      throw error
    }
  }

  async function fetchStats() {
    const authStore = useAuthStore()
    try {
      const response = await $fetch<{ success: boolean; data?: TaskStats; error?: string }>('/api/tasks/stats', {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      })

      if (!response.success || response.error) {
        throw new Error(response.error || '获取统计数据失败')
      }

      if (!response.data) throw new Error('Invalid response')

      stats.value = response.data

      return response.data
    } catch (error: any) {
      throw error
    }
  }

  return {
    tasks,
    currentTask,
    stats,
    loading,
    total,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    fetchStats
  }
})
