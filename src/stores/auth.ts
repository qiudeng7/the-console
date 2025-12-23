import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api'

export interface User {
	id: number
	email: string
	role: 'admin' | 'employee'
}

export const useAuthStore = defineStore('auth', () => {
	// 状态
	const user = ref<User | null>(null)
	const token = ref<string>('')
	const isLoading = ref(false)

	// 计算属性
	const isAuthenticated = computed(() => !!user.value)
	const isAdmin = computed(() => user.value?.role === 'admin')
	const isEmployee = computed(() => user.value?.role === 'employee')

	// 初始化：从 localStorage 恢复状态
	function init() {
		const savedToken = localStorage.getItem('token')
		const savedUser = localStorage.getItem('user')
		if (savedToken && savedUser) {
			token.value = savedToken
			user.value = JSON.parse(savedUser)
		}
	}

	// 保存到 localStorage
	function saveToLocalStorage(userValue: User, tokenValue: string) {
		localStorage.setItem('token', tokenValue)
		localStorage.setItem('user', JSON.stringify(userValue))
	}

	// 清除 localStorage
	function clearLocalStorage() {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
	}

	// 注册
	async function register(email: string, password: string) {
		isLoading.value = true
		try {
			const { user: registerUser, token: userToken } = await api.post<{ user: User; token: string }>(
				'/api/auth/register',
				{ email, password },
				{ skipErrorHandler: true }
			)

			user.value = registerUser
			token.value = userToken
			saveToLocalStorage(registerUser, userToken)

			return { success: true }
		} catch (error: any) {
			return { success: false, error: error.message }
		} finally {
			isLoading.value = false
		}
	}

	// 登录
	async function login(email: string, password: string) {
		isLoading.value = true
		try {
			const { user: loginUser, token: userToken } = await api.post<{ user: User; token: string }>(
				'/api/auth/login',
				{ email, password },
				{ skipErrorHandler: true }
			)

			user.value = loginUser
			token.value = userToken
			saveToLocalStorage(loginUser, userToken)

			return { success: true }
		} catch (error: any) {
			return { success: false, error: error.message }
		} finally {
			isLoading.value = false
		}
	}

	// 获取当前用户
	async function fetchUser() {
		if (!token.value) return

		isLoading.value = true
		try {
			const { user: fetchedUser } = await api.get<{ user: User }>('/api/auth/me')
			user.value = fetchedUser
			saveToLocalStorage(fetchedUser, token.value)
		} catch (error) {
			// 401 会自动触发 logout，这里不需要再处理
		} finally {
			isLoading.value = false
		}
	}

	// 退出登录
	function logout() {
		user.value = null
		token.value = ''
		clearLocalStorage()
	}

	return {
		user,
		token,
		isAuthenticated,
		isAdmin,
		isEmployee,
		isLoading,
		init,
		register,
		login,
		logout,
		fetchUser
	}
})
