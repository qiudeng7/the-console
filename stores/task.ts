import type { Task, TaskListParams, TaskListResponse, TaskStats } from '~/types'

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
      const { data, error } = await $fetch<TaskListResponse>('/api/tasks', {
        params
      }).catch((e) => {
        return { error: e.message || '获取任务列表失败' }
      })

      if (error) {
        throw new Error(error)
      }

      if (data) {
        tasks.value = data.tasks
        total.value = data.total
      }

      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchTask(id: number) {
    loading.value = true
    try {
      const { data, error } = await $fetch<{ task: Task }>(`/api/tasks/${id}`).catch((e) => {
        return { error: e.message || '获取任务详情失败' }
      })

      if (error) {
        throw new Error(error)
      }

      if (data) {
        currentTask.value = data.task
      }

      return data?.task
    } finally {
      loading.value = false
    }
  }

  async function createTask(taskData: Partial<Task>) {
    const authStore = useAuthStore()
    const { data, error } = await $fetch<{ task: Task }>('/api/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: taskData
    }).catch((e) => {
      return { error: e.message || '创建任务失败' }
    })

    if (error) {
      throw new Error(error)
    }

    if (data) {
      tasks.value.unshift(data.task)
    }

    return data?.task
  }

  async function updateTask(id: number, taskData: Partial<Task>) {
    const authStore = useAuthStore()
    const { data, error } = await $fetch<{ task: Task }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: taskData
    }).catch((e) => {
      return { error: e.message || '更新任务失败' }
    })

    if (error) {
      throw new Error(error)
    }

    if (data) {
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = data.task
      }
      if (currentTask.value?.id === id) {
        currentTask.value = data.task
      }
    }

    return data?.task
  }

  async function deleteTask(id: number) {
    const authStore = useAuthStore()
    const { error } = await $fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }).catch((e) => {
      return { error: e.message || '删除任务失败' }
    })

    if (error) {
      throw new Error(error)
    }

    tasks.value = tasks.value.filter(t => t.id !== id)
    if (currentTask.value?.id === id) {
      currentTask.value = null
    }
  }

  async function fetchStats() {
    const authStore = useAuthStore()
    const { data, error } = await $fetch<{ stats: TaskStats }>('/api/tasks/stats', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }).catch((e) => {
      return { error: e.message || '获取统计数据失败' }
    })

    if (error) {
      throw new Error(error)
    }

    if (data) {
      stats.value = data.stats
    }

    return data?.stats
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
