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

    if (!tableName || !id) {
      return {
        success: false,
        error: '参数错误'
      }
    }

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
    console.error(`[DELETE /api/admin/database/${tableName}/${id}] Error:`, error)
    console.error('Error stack:', error.stack)

    return {
      success: false,
      error: error.message || '删除失败'
    }
  }
})
