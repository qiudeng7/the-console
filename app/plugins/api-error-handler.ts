export default defineNuxtPlugin(() => {
  // 拦截 $fetch 错误，提取真实的错误消息
  const originalFetch = globalThis.$fetch

  globalThis.$fetch = async function<T>(request: RequestInfo, options?: RequestInit): Promise<T> {
    try {
      return await originalFetch<T>(request, options)
    } catch (error: any) {
      // 如果是 FetchError，尝试解析响应体
      if (error.name === 'FetchError' && error.response) {
        try {
          const clonedResponse = error.response.clone()
          const data = await clonedResponse.json()

          // 提取真实的错误消息
          const message = data?.message || data?.error || error.message || '请求失败'

          // 抛出一个包含真实错误消息的 Error
          throw new Error(message)
        } catch (parseError) {
          // 如果解析失败，使用原始错误
          throw new Error(error.message || '请求失败')
        }
      }

      // 对于其他类型的错误，直接抛出
      throw error
    }
  } as any
})
