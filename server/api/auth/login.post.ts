import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { getDb } from '~~/server/database/db'
import { User } from '~~/server/database/schema'
import { generateToken } from '~~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  // 只支持 POST 请求
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return {
      success: false,
      error: '方法不允许'
    }
  }

  const body = await readBody(event)

  // 简单验证
  if (!body?.email || !body?.password) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: '邮箱和密码不能为空'
    }
  }

  const db = getDb()
  const config = useRuntimeConfig()

  // 查找用户
  const user = await db
    .select()
    .from(User)
    .where(eq(User.email, body.email))
    .get()

  if (!user) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: '邮箱或密码错误'
    }
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(body.password, user.password)
  if (!isPasswordValid) {
    setResponseStatus(event, 401)
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
})
