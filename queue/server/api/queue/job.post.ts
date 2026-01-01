import { queue } from '../health.get'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Queue API] Received request')
    const body = await readBody(event)
    console.log('[Queue API] Request body:', JSON.stringify(body))
    const { type, data } = body

    console.log('[Queue API] Adding to queue, type:', type)
    // 添加到队列并等待结果
    const result = await queue.add(type, data)
    console.log('[Queue API] Queue result:', JSON.stringify(result))
    return { success: true, data: result }
  } catch (error: any) {
    console.error('[Queue API] Error:', error)
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
