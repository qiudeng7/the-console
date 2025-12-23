import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface User {
	id: number
	email: string
}

export const useAuthStore = defineStore('auth', () => {
	// 状态
	const user = ref<User | null>(null)
	const token = ref<string>('')
	const isLoading = ref(false)

	// 计算属性
	const isAuthenticated = computed(() => !!user.value)

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
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			})

			const data = await response.json()

			if (!data.success) {
				throw new Error(data.error || '注册失败')
			}

			user.value = data.data.user
			token.value = data.data.token
			saveToLocalStorage(data.data.user, data.data.token)

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
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			})

			const data = await response.json()

			if (!data.success) {
				throw new Error(data.error || '登录失败')
			}

			user.value = data.data.user
			token.value = data.data.token
			saveToLocalStorage(data.data.user, data.data.token)

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
			const response = await fetch('/api/auth/me', {
				headers: {
					'Authorization': `Bearer ${token.value}`
				}
			})

			const data = await response.json()

			if (data.success) {
				user.value = data.data.user
				saveToLocalStorage(data.data.user, token.value)
			} else {
				// token 无效，清除状态
				logout()
			}
		} catch (error) {
			// 请求失败，清除状态
			logout()
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
		isLoading,
		init,
		register,
		login,
		logout,
		fetchUser
	}
})
