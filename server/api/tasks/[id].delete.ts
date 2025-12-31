import { eq } from 'drizzle-orm'
import { getDb } from '~/server/database/db'
import { Task } from '~/server/database/schema'
import { extractTokenFromHeader, verifyToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: '未认证'
    }
  }

  const config = useRuntimeConfig()
  const userId = verifyToken(token, config.jwtSecret)

  if (!userId) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: 'Token 无效或已过期'
    }
  }

  const taskId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(taskId)) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: '无效的任务 ID'
    }
  }

  const db = getDb()

  const existingTask = await db
    .select()
    .from(Task)
    .where(eq(Task.id, taskId))
    .get()

  if (!existingTask) {
    setResponseStatus(event, 404)
    return {
      success: false,
      error: '任务不存在'
    }
  }

  // 权限检查：只有创建者可以删除
  if (existingTask.createdByUserId !== userId) {
    setResponseStatus(event, 403)
    return {
      success: false,
      error: '无权限删除此任务'
    }
  }

  const now = new Date().toLocaleString()

  await db
    .update(Task)
    .set({
      deletedAt: now,
      updatedAt: now
    })
    .where(eq(Task.id, taskId))

  return {
    success: true,
    data: {
      message: '任务已删除'
    }
  }
})
