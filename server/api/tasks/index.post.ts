import { eq } from 'drizzle-orm'
import { getDb } from '~/server/database/db'
import { Task, User } from '~/server/database/schema'
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

  const db = getDb()

  // 获取当前用户信息
  const currentUser = await db
    .select()
    .from(User)
    .where(eq(User.id, userId))
    .get()

  if (!currentUser) {
    setResponseStatus(event, 404)
    return {
      success: false,
      error: '用户不存在'
    }
  }

  // 权限检查：员工不能创建任务
  if (currentUser.role === 'employee') {
    setResponseStatus(event, 403)
    return {
      success: false,
      error: '员工不能创建任务'
    }
  }

  const body = await readBody(event)

  if (!body?.title) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: '任务标题不能为空'
    }
  }

  const now = new Date().toLocaleString()

  const newTask = await db
    .insert(Task)
    .values({
      title: body.title,
      category: body.category || null,
      tag: body.tag || null,
      description: body.description || null,
      status: body.status || 'todo',
      createdByUserId: userId,
      assignedToUserId: body.assignedToUserId || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: ''
    })
    .returning()
    .get()

  return {
    success: true,
    data: {
      task: newTask
    }
  }
})
