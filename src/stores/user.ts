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
			const result = await api.get<{ users: User[]; total: number; page: number; pageSize: number }>(
				'/api/users',
				params || {}
			)
			users.value = result.users
			total.value = result.total
			page.value = result.page
			pageSize.value = result.pageSize
		} finally {
			isLoading.value = false
		}
	}

	return {
		users,
		isLoading,
		total,
		page,
		pageSize,
		fetchUsers
	}
})
