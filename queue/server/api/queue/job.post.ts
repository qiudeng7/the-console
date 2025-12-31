import { queue } from '../health.get'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { type, data } = body

    // 添加到队列并等待结果
    const result = await queue.add(type, data)
    return { success: true, data: result }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
