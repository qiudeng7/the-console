import { eq, and } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { User } from '~~/server/database/schema'
import { getAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)
  const userId = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(userId)) {
    throw createError({
      statusCode: 400,
      message: '无效的用户ID'
    })
  }

  // 权限检查：只有管理员或用户本人可以修改
  const isAdmin = authUser.role === 'admin'
  if (userId !== authUser.id && !isAdmin) {
    throw createError({
      statusCode: 403,
      message: '无权限修改此用户'
    })
  }

  const body = await readBody(event)
  const db = getDb()

  // 1. 读取当前用户和版本号
  const currentUsers = await db
    .select()
    .from(User)
    .where(eq(User.id, userId))

  const currentUser = currentUsers[0]
  if (!currentUser) {
    throw createError({
      statusCode: 404,
      message: '用户不存在'
    })
  }

  // 2. 准备更新数据
  const updateData: Record<string, any> = {
    updatedAt: new Date()
  }

  if (body.email !== undefined) updateData.email = body.email
  if (body.password !== undefined) updateData.password = body.password
  if (body.role !== undefined && isAdmin) {
    // 只有管理员可以修改角色
    updateData.role = body.role
  }

  // 3. 使用乐观锁更新
  const result = await db
    .update(User)
    .set({
      ...updateData,
      version: currentUser.version + 1 // 版本号 +1
    })
    .where(
      and(
        eq(User.id, userId),
        eq(User.version, currentUser.version) // 乐观锁检查
      )
    )

  // 4. 检查是否更新成功（MySQL 使用 affectedRows）
  if ((result as any).affectedRows === 0) {
    throw createError({
      statusCode: 409,
      message: '用户数据已被其他人修改，请刷新后重试'
    })
  }

  // 5. 返回更新后的用户
  const updatedUsers = await db
    .select()
    .from(User)
    .where(eq(User.id, userId))

  const updatedUser = updatedUsers[0]

  return {
    success: true,
    data: {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        version: updatedUser.version,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    }
  }
})
