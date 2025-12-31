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

  const body = await readBody(event)
  const db = getDb()

  // 检查任务是否存在
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

  // 权限检查：只有创建者可以修改
  if (existingTask.createdByUserId !== userId) {
    setResponseStatus(event, 403)
    return {
      success: false,
      error: '无权限修改此任务'
    }
  }

  const now = new Date().toLocaleString()

  const updatedTask = await db
    .update(Task)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.tag !== undefined && { tag: body.tag }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.assignedToUserId !== undefined && { assignedToUserId: body.assignedToUserId }),
      updatedAt: now
    })
    .where(eq(Task.id, taskId))
    .returning()
    .get()

  return {
    success: true,
    data: {
      task: updatedTask
    }
  }
})
