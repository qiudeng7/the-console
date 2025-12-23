import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api'
import type { User } from '@/stores/auth'

export const useUserStore = defineStore('user', () => {
	// 状态
	const users = ref<User[]>([])
	const isLoading = ref(false)
	const total = ref(0)
	const page = ref(1)
	const pageSize = ref(10)

	// 获取用户列表
	async function fetchUsers(params?: { page?: number; pageSize?: number; role?: string; search?: string }) {
		isLoading.value = true
		try {
			const queryParams = new URLSearchParams()
			if (params?.page) queryParams.append('page', params.page.toString())
			if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
			if (params?.role) queryParams.append('role', params.role)
			if (params?.search) queryParams.append('search', params.search)

			const url = queryParams.toString() ? `/api/users?${queryParams.toString()}` : '/api/users'
			const result = await api.get<{ users: User[]; total: number; page: number; pageSize: number }>(url)
			users.value = result.users
			total.value = result.total
			page.value = result.page
			pageSize.value = result.pageSize
		} finally {
			isLoading.value = false
		}
	}

	// 创建用户
	async function createUser(data: { email: string; password: string; role?: 'admin' | 'employee' }) {
		const result = await api.post<{ user: User }>('/api/users', data)
		users.value.push(result.user)
		total.value++
		return result.user
	}

	// 更新用户角色
	async function updateUserRole(id: number, role: 'admin' | 'employee') {
		const result = await api.put<{ user: User }>(`/api/users/${id}`, { role })
		const index = users.value.findIndex((u) => u.id === id)
		if (index !== -1) {
			users.value[index] = result.user
		}
		return result.user
	}

	// 删除用户
	async function deleteUser(id: number) {
		await api.delete(`/api/users/${id}`)
		users.value = users.value.filter((u) => u.id !== id)
		total.value--
	}

	return {
		users,
		isLoading,
		total,
		page,
		pageSize,
		fetchUsers,
		createUser,
		updateUserRole,
		deleteUser
	}
})
