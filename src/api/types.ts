/**
 * API 响应类型定义（与后端响应格式匹配）
 */

export interface ApiSuccessResponse<T> {
	time: string
	success: true
	data: T
}

export interface ApiErrorResponse {
	time: string
	success: false
	error: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * API 请求配置
 */
export interface ApiRequestConfig extends RequestInit {
	/** 跳过自动添加 token */
	skipAuth?: boolean
	/** 跳过默认错误处理（401/403 自动登出） */
	skipErrorHandler?: boolean
}

/**
 * API 错误类
 */
export class ApiError extends Error {
	status: number

	constructor(message: string, status: number) {
		super(message)
		this.name = 'ApiError'
		this.status = status
	}
}
