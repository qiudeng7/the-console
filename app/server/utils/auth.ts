import { getDb } from '~~/server/database/db'
import { User } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface AuthUser {
  id: number
  email: string
  role: string
}

/**
 * 验证JWT token并返回用户信息
 */
export async function verifyAuth(token: string): Promise<AuthUser> {
  if (!token) {
    throw new Error('未提供认证令牌')
  }

  try {
    // 验证JWT token
    const jwtSecret = useRuntimeConfig().jwtSecret
    const decoded = jwt.verify(token, jwtSecret) as any

    if (!decoded?.userId) {
      throw new Error('无效的令牌格式')
    }

    // 从数据库获取用户信息
    const db = getDb()
    const users = await db
      .select({
        id: User.id,
        email: User.email,
        role: User.role,
        deletedAt: User.deletedAt
      })
      .from(User)
      .where(eq(User.id, decoded.userId))

    const user = users[0]
    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查用户状态（软删除）
    if (user.deletedAt !== null) {
      throw new Error('用户已被禁用')
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role
    }
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('无效的令牌')
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('令牌已过期，请重新登录')
    }
    throw error
  }
}

/**
 * 验证管理员权限
 */
export async function verifyAdmin(token: string): Promise<AuthUser> {
  const user = await verifyAuth(token)

  if (user.role !== 'admin') {
    throw new Error('需要管理员权限')
  }

  return user
}

/**
 * 从请求头中提取并验证token
 */
export async function getAuthUser(event: H3Event): Promise<AuthUser> {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    throw new Error('未提供认证令牌')
  }

  return verifyAuth(token)
}

/**
 * 从请求头中提取并验证管理员权限
 */
export async function getAdminUser(event: H3Event): Promise<AuthUser> {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    throw new Error('未提供认证令牌')
  }

  return verifyAdmin(token)
}
