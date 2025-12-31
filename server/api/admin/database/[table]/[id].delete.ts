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

  if (!tableName || !id) {
    throw createError({
      statusCode: 400,
      message: '参数错误'
    })
  }

  try {
    const db = getDb()

    // 根据表名删除数据
    switch (tableName) {
      case 'users':
        // 用户软删除
        await db.update(User)
          .set({ deletedAt: new Date().toLocaleString() })
          .where(eq(User.id, id))
        break

      case 'tasks':
        // 任务软删除
        await db.update(Task)
          .set({ deletedAt: new Date().toLocaleString() })
          .where(eq(Task.id, id))
        break

      case 'k8s_clusters':
        // K8s集群级联删除节点，然后删除集群
        await db.delete(K8sNode)
          .where(eq(K8sNode.clusterId, id))
        await db.delete(K8sCluster)
          .where(eq(K8sCluster.id, id))
        break

      case 'k8s_nodes':
        await db.delete(K8sNode)
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
      message: error.message || '删除失败'
    })
  }
})
