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
    loading.value = true
    try {
      const response = await $fetch<TaskListResponse>('/api/tasks', {
        params
      }).catch((e: any) => {
        return { error: e.message || '获取任务列表失败' }
      })

      if ('error' in response) {
        throw new Error(response.error)
      }

      tasks.value = response.tasks
      total.value = response.total

      return response
    } finally {
      loading.value = false
    }
  }

  async function fetchTask(id: number) {
    loading.value = true
    try {
      const response = await $fetch<{ task: Task }>(`/api/tasks/${id}`).catch((e: any) => {
        return { error: e.message || '获取任务详情失败' }
      })

      if ('error' in response) {
        throw new Error(response.error)
      }

      currentTask.value = response.task

      return response.task
    } finally {
      loading.value = false
    }
  }

  async function createTask(taskData: Partial<Task>) {
    const authStore = useAuthStore()
    const response = await $fetch<{ task: Task }>('/api/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: taskData
    }).catch((e: any) => {
      return { error: e.message || '创建任务失败' }
    })

    if ('error' in response) {
      throw new Error(response.error)
    }

    tasks.value.unshift(response.task)

    return response.task
  }

  async function updateTask(id: number, taskData: Partial<Task>) {
    const authStore = useAuthStore()
    const response = await $fetch<{ task: Task }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: taskData
    }).catch((e: any) => {
      return { error: e.message || '更新任务失败' }
    })

    if ('error' in response) {
      throw new Error(response.error)
    }

    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = response.task
    }
    if (currentTask.value?.id === id) {
      currentTask.value = response.task
    }

    return response.task
  }

  async function deleteTask(id: number) {
    const authStore = useAuthStore()
    const response = await $fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }).catch((e: any) => {
      return { error: e.message || '删除任务失败' }
    })

    if ('error' in response) {
      throw new Error(response.error)
    }

    tasks.value = tasks.value.filter(t => t.id !== id)
    if (currentTask.value?.id === id) {
      currentTask.value = null
    }
  }

  async function fetchStats() {
    const authStore = useAuthStore()
    const response = await $fetch<{ stats: TaskStats }>('/api/tasks/stats', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }).catch((e: any) => {
      return { error: e.message || '获取统计数据失败' }
    })

    if ('error' in response) {
      throw new Error(response.error)
    }

    stats.value = response.stats

    return response.stats
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
