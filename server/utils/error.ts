/**
 * 统一的API响应格式
 */
export function successResponse<T>(data: T) {
  return {
    success: true,
    data
  }
}

/**
 * 统一的错误响应格式
 */
export function errorResponse(message: string) {
  return {
    success: false,
    error: message
  }
}
