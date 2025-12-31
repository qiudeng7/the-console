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

  // 检查邮箱是否已存在
  const existingUser = await db
    .select()
    .from(User)
    .where(eq(User.email, body.email))
    .get()

  if (existingUser) {
    setResponseStatus(event, 409)
    return {
      success: false,
      error: '邮箱已被注册'
    }
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(body.password, 10)

  // 插入新用户
  const newUser = await db
    .insert(User)
    .values({
      email: body.email,
      password: hashedPassword,
      role: 'employee' // 默认为员工
    })
    .returning()
    .get()

  // 第一个注册的用户设为管理员
  if (newUser.id === 1) {
    await db
      .update(User)
      .set({ role: 'admin' })
      .where(eq(User.id, newUser.id))
    newUser.role = 'admin'
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
})
