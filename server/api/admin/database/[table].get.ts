import { getDb } from '~~/server/database/db'
import { User, Task, K8sCluster, K8sNode } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未授权'
    })
  }

  const tableName = getRouterParam(event, 'table')

  if (!tableName) {
    throw createError({
      statusCode: 400,
      message: '表名不能为空'
    })
  }

  try {
    const db = getDb()
    let data: any[] = []

    // 根据表名查询数据（排除软删除的记录）
    switch (tableName) {
      case 'users':
        data = await db.select({
          id: User.id,
          email: User.email,
          role: User.role,
          createdAt: User.createdAt
        }).from(User)
        .where(eq(User.deletedAt, ''))
        break

      case 'tasks':
        data = await db.select().from(Task)
        .where(eq(Task.deletedAt, ''))
        break

      case 'k8s_clusters':
        data = await db.select().from(K8sCluster)
        break

      case 'k8s_nodes':
        data = await db.select().from(K8sNode)
        break

      default:
        throw createError({
          statusCode: 400,
          message: '无效的表名'
        })
    }

    return data
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '获取数据失败'
    })
  }
})
