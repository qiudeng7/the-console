import { getDb } from '~~/server/database/db'
import { User, Task, K8sCluster, K8sNode } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'
import { getAdminUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限
    await getAdminUser(event)

    const tableName = getRouterParam(event, 'table')
    const id = parseInt(getRouterParam(event, 'id') || '')
    const body = await readBody(event)

    if (!tableName || !id) {
      return {
        success: false,
        error: '参数错误'
      }
    }

    const db = getDb()

    // 根据表名更新数据
    switch (tableName) {
      case 'users': {
        // 不允许更新密码和敏感字段
        const { password, deletedAt: _, ...userUpdateData } = body
        await db.update(User)
          .set(userUpdateData)
          .where(eq(User.id, id))
        break
      }

      case 'tasks': {
        const { createdAt: _, deletedAt: __, ...taskUpdateData } = body
        taskUpdateData.updatedAt = new Date().toLocaleString()
        await db.update(Task)
          .set(taskUpdateData)
          .where(eq(Task.id, id))
        break
      }

      case 'k8s_clusters': {
        const { createdAt: _, ...clusterUpdateData } = body
        await db.update(K8sCluster)
          .set(clusterUpdateData)
          .where(eq(K8sCluster.id, id))
        break
      }

      case 'k8s_nodes': {
        const { createdAt: _, ...nodeUpdateData } = body
        await db.update(K8sNode)
          .set(nodeUpdateData)
          .where(eq(K8sNode.id, id))
        break
      }

      default:
        return {
          success: false,
          error: '无效的表名'
        }
    }

    return {
      success: true
    }
  } catch (error: any) {
    const tableName = getRouterParam(event, 'table')
    const id = getRouterParam(event, 'id')
    const body = await readBody(event).catch(() => ({}))
    console.error(`[PATCH /api/admin/database/${tableName}/${id}] Error:`, error)
    console.error('Error stack:', error.stack)
    console.error('Request body:', body)

    return {
      success: false,
      error: error.message || '更新失败'
    }
  }
})
