import { useAuthStore } from '@/stores/auth'
import type { ApiRequestConfig, ApiError } from './types'
import router from '@/router'

/**
 * 统一的 API 请求封装
 */
export const api = {
	/**
	 * GET 请求
	 */
	async get<T>(url: string, config?: ApiRequestConfig): Promise<T> {
		return this.request<T>(url, { ...config, method: 'GET' })
	},

	/**
	 * POST 请求
	 */
	async post<T>(url: string, body?: any, config?: ApiRequestConfig): Promise<T> {
		return this.request<T>(url, {
			...config,
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				...config?.headers
			}
		})
	},

	/**
	 * PUT 请求
	 */
	async put<T>(url: string, body?: any, config?: ApiRequestConfig): Promise<T> {
		return this.request<T>(url, {
			...config,
			method: 'PUT',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				...config?.headers
			}
		})
	},

	/**
	 * DELETE 请求
	 */
	async delete<T>(url: string, config?: ApiRequestConfig): Promise<T> {
		return this.request<T>(url, { ...config, method: 'DELETE' })
	},

	/**
	 * 核心请求方法
	 */
	async request<T>(url: string, config: ApiRequestConfig = {}): Promise<T> {
		const authStore = useAuthStore()
		const headers: Record<string, string> = {
			...(config.headers as Record<string, string> ?? {})
		}

		// 自动添加 token
		if (!config.skipAuth && authStore.token) {
			headers['Authorization'] = `Bearer ${authStore.token}`
		}

		// 发起请求
		const response = await fetch(url, {
			...config,
			headers
		})

		// 解析响应
		const data = await response.json()

		// 检查业务状态码
		if (!data.success) {
			const error = new Error(data.error || '请求失败') as ApiError
			error.status = response.status

			// 统一错误处理（401/403）
			if (!config.skipErrorHandler) {
				await this.handleError(response.status)
			}

			throw error
		}

		return data.data
	},

	/**
	 * 处理认证错误
	 */
	async handleError(status: number) {
		if (status === 401 || status === 403) {
			const authStore = useAuthStore()
			authStore.logout()
			router.push('/login')
		}
	}
}
