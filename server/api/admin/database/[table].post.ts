import { getDb } from '~~/server/database/db'
import { User, Task, K8sCluster, K8sNode } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未授权'
    })
  }

  const tableName = getRouterParam(event, 'table')
  const body = await readBody(event)

  if (!tableName) {
    throw createError({
      statusCode: 400,
      message: '表名不能为空'
    })
  }

  try {
    const db = getDb()
    let result: any

    // 根据表名插入数据
    switch (tableName) {
      case 'users':
        // 用户需要密码哈希
        if (!body.password) {
          throw createError({
            statusCode: 400,
            message: '密码不能为空'
          })
        }
        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.hash(body.password, 10)
        result = await db.insert(User)
          .values({
            ...body,
            password: hashedPassword
          })
          .returning()
        break

      case 'tasks':
        result = await db.insert(Task)
          .values(body)
          .returning()
        break

      case 'k8s_clusters':
        result = await db.insert(K8sCluster)
          .values(body)
          .returning()
        break

      case 'k8s_nodes':
        result = await db.insert(K8sNode)
          .values(body)
          .returning()
        break

      default:
        throw createError({
          statusCode: 400,
          message: '无效的表名'
        })
    }

    return result[0]
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '创建失败'
    })
  }
})
