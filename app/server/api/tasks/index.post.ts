import { getAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // 验证用户身份
  const authUser = await getAuthUser(event)

  const body = await readBody(event)

  if (!body?.title) {
    throw createError({
      statusCode: 400,
      message: '任务标题不能为空'
    })
  }

  const queueServiceUrl = process.env.QUEUE_SERVICE_URL || 'http://localhost:4000'

  try {
    // 通过 HTTP 调用队列服务
    const response = await $fetch(`${queueServiceUrl}/api/queue/job`, {
      method: 'POST',
      body: {
        type: 'create-task',
        data: {
          title: body.title,
          category: body.category || null,
          tag: body.tag || null,
          description: body.description || null,
          status: body.status || 'todo',
          createdByUserId: authUser.id,
          assignedToUserId: body.assignedToUserId || null
        }
      }
    })

    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '创建任务失败'
    })
  }
})
