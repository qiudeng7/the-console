import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { User } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    // 从请求头中提取token
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return {
        success: false,
        error: '未提供认证令牌'
      }
    }

    // 验证token
    const { verifyAuth } = await import('~~/server/utils/auth')
    const authUser = await verifyAuth(token)

    const db = getDb()
    const users = await db
      .select({
        id: User.id,
        email: User.email,
        role: User.role,
        createdAt: User.createdAt
      })
      .from(User)
      .where(eq(User.id, authUser.id))
    const user = users[0]

    if (!user) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    return {
      success: true,
      data: { user }
    }
  } catch (error: any) {
    console.error('[GET /api/auth/me] Error:', error)
    // 返回实际错误信息而不是通用错误
    return {
      success: false,
      error: error.message || '获取用户信息失败'
    }
  }
})
