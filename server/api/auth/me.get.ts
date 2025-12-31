import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { User } from '~~/server/database/schema'
import { extractTokenFromHeader, verifyToken } from '~~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: '未提供认证令牌'
    }
  }

  const config = useRuntimeConfig()
  const userId = verifyToken(token, config.jwtSecret)

  if (!userId) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: '无效的认证令牌'
    }
  }

  const db = getDb()
  const user = await db
    .select({
      id: User.id,
      email: User.email,
      role: User.role,
      createdAt: User.createdAt
    })
    .from(User)
    .where(eq(User.id, userId))
    .get()

  if (!user) {
    setResponseStatus(event, 404)
    return {
      success: false,
      error: '用户不存在'
    }
  }

  return {
    success: true,
    data: { user }
  }
})
