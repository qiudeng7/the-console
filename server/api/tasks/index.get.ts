import { eq, and, like, or } from 'drizzle-orm'
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

  const query = getQuery(event)
  const page = parseInt((query.page as string) || '1')
  const pageSize = parseInt((query.pageSize as string) || '10')
  const status = query.status as string | undefined
  const category = query.category as string | undefined
  const search = query.search as string | undefined

  const conditions = [
    eq(Task.deletedAt, '')
  ]

  // 根据角色设置不同的查询条件
  if (currentUser.role === 'employee') {
    // 员工只能看到分配给自己的任务
    conditions.push(eq(Task.assignedToUserId, userId))
  } else {
    // admin 看到自己创建的任务
    conditions.push(eq(Task.createdByUserId, userId))
  }

  if (status) {
    conditions.push(eq(Task.status, status))
  }

  if (category) {
    conditions.push(eq(Task.category, category))
  }

  if (search) {
    conditions.push(
      or(
        like(Task.title, `%${search}%`),
        like(Task.description, `%${search}%`)
      )!
    )
  }

  const tasks = await db
    .select()
    .from(Task)
    .where(and(...conditions))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()

  // 获取总数（用于分页）
  const totalResult = await db
    .select({ count: Task.id })
    .from(Task)
    .where(and(...conditions))
    .all()

  const total = totalResult.length

  return {
    success: true,
    data: {
      tasks,
      total,
      page,
      pageSize
    }
  }
})
