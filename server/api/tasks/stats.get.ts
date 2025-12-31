import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { Task, User } from '~~/server/database/schema'
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

  const db = getDb()

  // 获取当前用户信息并检查权限
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

  // 权限检查：只有 admin 可以访问
  if (currentUser.role !== 'admin') {
    setResponseStatus(event, 403)
    return {
      success: false,
      error: '需要管理员权限'
    }
  }

  // 获取所有未删除的任务
  const allTasks = await db
    .select()
    .from(Task)
    .where(eq(Task.deletedAt, ''))
    .all()

  // 按状态统计
  const byStatus: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
    cancelled: 0
  }

  // 按分类统计
  const byCategory: Record<string, number> = {}

  // 按执行人统计
  const byAssignee: Record<number, number> = {}

  allTasks.forEach(task => {
    // 状态统计
    if (task.status) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1
    }

    // 分类统计
    if (task.category) {
      byCategory[task.category] = (byCategory[task.category] || 0) + 1
    }

    // 执行人统计
    if (task.assignedToUserId) {
      byAssignee[task.assignedToUserId] = (byAssignee[task.assignedToUserId] || 0) + 1
    }
  })

  return {
    success: true,
    data: {
      byStatus,
      byCategory,
      byAssignee,
      total: allTasks.length
    }
  }
})
