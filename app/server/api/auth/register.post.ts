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

    // 检查邮箱是否已存在
    const existingUsers = await db
      .select()
      .from(User)
      .where(eq(User.email, body.email))
    const existingUser = existingUsers[0]

    if (existingUser) {
      return {
        success: false,
        error: '邮箱已被注册'
      }
    }

    // 检查是否是第一个用户
    const allUsers = await db
      .select()
      .from(User)

    const isFirstUser = allUsers.length === 0

    // 插入新用户（明文密码）
    const insertResult = await db
      .insert(User)
      .values({
        email: body.email,
        password: body.password,
        role: isFirstUser ? 'admin' : 'employee', // 第一个用户为管理员
        version: 1 // 初始版本号（乐观锁）
      })

    // MySQL Drizzle 不支持 .returning()，需要重新查询获取插入的记录
    const insertId = (insertResult as any).insertId
    const newUsers = await db
      .select()
      .from(User)
      .where(eq(User.id, insertId))
    const newUser = newUsers[0]

    if (!newUser) {
      return {
        success: false,
        error: '注册失败'
      }
    }

    // 生成 JWT token
    const token = generateToken(newUser.id, config.jwtSecret)

    return {
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token
      }
    }
  } catch (error: any) {
    console.error('[POST /api/auth/register] Error:', error)
    return {
      success: false,
      error: error.message || '注册失败'
    }
  }
})
