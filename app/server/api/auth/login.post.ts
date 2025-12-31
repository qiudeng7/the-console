import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { User } from '~~/server/database/schema'
import { generateToken } from '~~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 简单验证
    if (!body?.email || !body?.password) {
      return {
        success: false,
        error: '邮箱和密码不能为空'
      }
    }

    const db = getDb()
    const config = useRuntimeConfig()

    // 查找用户
    const users = await db
      .select()
      .from(User)
      .where(eq(User.email, body.email))
    const user = users[0]

    if (!user) {
      return {
        success: false,
        error: '邮箱或密码错误'
      }
    }

    // 检查用户状态（软删除）
    if (user.deletedAt && user.deletedAt !== '') {
      return {
        success: false,
        error: '用户已被禁用'
      }
    }

    // 验证密码（明文比较）
    if (body.password !== user.password) {
      return {
        success: false,
        error: '邮箱或密码错误'
      }
    }

    // 生成 JWT token
    const token = generateToken(user.id, config.jwtSecret)

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    }
  } catch (error: any) {
    console.error('[POST /api/auth/login] Error:', error)
    return {
      success: false,
      error: error.message || '登录失败'
    }
  }
})
