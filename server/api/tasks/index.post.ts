import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { Task, User } from '~~/server/database/schema'
import { getAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // 验证用户身份
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

  // 权限检查：员工不能创建任务
  if (currentUser.role === 'employee') {
    throw createError({
      statusCode: 403,
      message: '员工不能创建任务'
    })
  }

  const body = await readBody(event)

  if (!body?.title) {
    throw createError({
      statusCode: 400,
      message: '任务标题不能为空'
    })
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
      createdByUserId: authUser.id,
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
