import { getAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  const taskId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(taskId)) {
    throw createError({
      statusCode: 400,
      message: '无效的任务 ID'
    })
  }

  const body = await readBody(event)
  const queueServiceUrl = process.env.QUEUE_SERVICE_URL || 'http://localhost:4000'

  try {
    // 通过 HTTP 调用队列服务
    const response = await $fetch(`${queueServiceUrl}/api/queue/job`, {
      method: 'POST',
      body: {
        type: 'update-task',
        data: {
          taskId,
          userId: authUser.id,
          updates: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.category !== undefined && { category: body.category }),
            ...(body.tag !== undefined && { tag: body.tag }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.status !== undefined && { status: body.status }),
            ...(body.assignedToUserId !== undefined && { assignedToUserId: body.assignedToUserId })
          }
        }
      }
    })

    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '更新任务失败'
    })
  }
})
