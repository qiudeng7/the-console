import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api'
import type { Task, TaskStats, TaskListParams, TaskListResponse } from '@/types/task'

export const useTaskStore = defineStore('task', () => {
	// 状态
	const tasks = ref<Task[]>([])
	const stats = ref<TaskStats | null>(null)
	const isLoading = ref(false)
	const total = ref(0)
	const page = ref(1)
	const pageSize = ref(10)

	// 获取任务列表
	async function fetchTasks(params?: TaskListParams) {
		isLoading.value = true
		try {
			const queryParams = new URLSearchParams()
			if (params?.page) queryParams.append('page', params.page.toString())
			if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
			if (params?.status) queryParams.append('status', params.status)
			if (params?.category) queryParams.append('category', params.category)
			if (params?.search) queryParams.append('search', params.search)

			const url = queryParams.toString() ? `/api/tasks?${queryParams.toString()}` : '/api/tasks'
			const result = await api.get<TaskListResponse>(url)
			tasks.value = result.tasks
			total.value = result.total
			page.value = result.page
			pageSize.value = result.pageSize
		} finally {
			isLoading.value = false
		}
	}

	// 创建任务
	async function createTask(data: Partial<Task>) {
		const result = await api.post<{ task: Task }>('/api/tasks', data)
		tasks.value.push(result.task)
		total.value++
		return result.task
	}

	// 更新任务
	async function updateTask(id: number, data: Partial<Task>) {
		const result = await api.put<{ task: Task }>(`/api/tasks/${id}`, data)
		const index = tasks.value.findIndex(t => t.id === id)
		if (index !== -1) {
			tasks.value[index] = result.task
		}
		return result.task
	}

	// 删除任务
	async function deleteTask(id: number) {
		await api.delete(`/api/tasks/${id}`)
		tasks.value = tasks.value.filter(t => t.id !== id)
		total.value--
	}

	// 获取统计数据（admin）
	async function fetchStats() {
		const result = await api.get<TaskStats>('/api/tasks/stats')
		stats.value = result
	}

	// 重置分页
	function resetPage() {
		page.value = 1
	}

	return {
		tasks,
		stats,
		isLoading,
		total,
		page,
		pageSize,
		fetchTasks,
		createTask,
		updateTask,
		deleteTask,
		fetchStats,
		resetPage
	}
})
