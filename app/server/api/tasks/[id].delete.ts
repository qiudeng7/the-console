import { getAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const authUser = await getAuthUser(event)
    const taskId = parseInt(getRouterParam(event, 'id') || '')

    if (isNaN(taskId)) {
      throw createError({
        statusCode: 400,
        message: '无效的任务ID'
      })
    }

    const queueServiceUrl = process.env.QUEUE_SERVICE_URL || 'http://localhost:4000'

    // 通过 HTTP 调用队列服务
    const response = await $fetch(`${queueServiceUrl}/queue/job`, {
      method: 'POST',
      body: {
        type: 'delete-task',
        data: {
          taskId,
          userId: authUser.id
        }
      }
    })

    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '删除任务失败'
    })
  }
})
