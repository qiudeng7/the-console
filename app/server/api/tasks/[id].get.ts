import { eq, and } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { Task } from '~~/server/database/schema'
import { extractTokenFromHeader, verifyToken } from '~~/server/utils/jwt'

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

  const task = await db
    .select()
    .from(Task)
    .where(and(
      eq(Task.id, taskId),
      eq(Task.deletedAt, '')
    ))
    .get()

  if (!task) {
    setResponseStatus(event, 404)
    return {
      success: false,
      error: '任务不存在'
    }
  }

  return {
    success: true,
    data: {
      task
    }
  }
})
