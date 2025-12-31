import { eq, and, like, or } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { Task, User } from '~~/server/database/schema'
import { getAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // 验证用户身份（会验证token和用户状态）
  const authUser = await getAuthUser(event)

  const db = getDb()

  // 获取当前用户信息
  const currentUser = await db
    .select()
    .from(User)
    .where(eq(User.id, authUser.id))
    .get()

  if (!currentUser) {
    throw createError({
      statusCode: 404,
      message: '用户不存在'
    })
  }

  // 检查用户状态（软删除）
  if (currentUser.deletedAt && currentUser.deletedAt !== '') {
    throw createError({
      statusCode: 403,
      message: '用户已被禁用'
    })
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
    conditions.push(eq(Task.assignedToUserId, authUser.id))
  } else {
    // admin 看到自己创建的任务
    conditions.push(eq(Task.createdByUserId, authUser.id))
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
