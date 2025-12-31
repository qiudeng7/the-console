import { getDb } from '~~/server/database/db'
import { User, Task, K8sCluster, K8sNode } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

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
  const id = parseInt(getRouterParam(event, 'id') || '')
  const body = await readBody(event)

  if (!tableName || !id) {
    throw createError({
      statusCode: 400,
      message: '参数错误'
    })
  }

  try {
    const db = getDb()

    // 根据表名更新数据
    switch (tableName) {
      case 'users':
        // 不允许更新密码和敏感字段
        const { password, deletedAt, ...userUpdateData } = body
        await db.update(User)
          .set(userUpdateData)
          .where(eq(User.id, id))
        break

      case 'tasks':
        const { createdAt, deletedAt, ...taskUpdateData } = body
        taskUpdateData.updatedAt = new Date().toLocaleString()
        await db.update(Task)
          .set(taskUpdateData)
          .where(eq(Task.id, id))
        break

      case 'k8s_clusters':
        const { createdAt, ...clusterUpdateData } = body
        await db.update(K8sCluster)
          .set(clusterUpdateData)
          .where(eq(K8sCluster.id, id))
        break

      case 'k8s_nodes':
        const { createdAt, ...nodeUpdateData } = body
        await db.update(K8sNode)
          .set(nodeUpdateData)
          .where(eq(K8sNode.id, id))
        break

      default:
        throw createError({
          statusCode: 400,
          message: '无效的表名'
        })
    }

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '更新失败'
    })
  }
})
