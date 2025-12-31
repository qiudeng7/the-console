import { getDb } from '~~/server/database/db'
import { User, Task, K8sCluster, K8sNode } from '~~/server/database/schema'
import { eq, isNull } from 'drizzle-orm'
import { getAdminUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限（会验证token有效性、用户状态和角色）
    await getAdminUser(event)

    const tableName = getRouterParam(event, 'table')

    if (!tableName) {
      return {
        success: false,
        error: '表名不能为空'
      }
    }

    const db = getDb()
    let data: any[] = []

    // 根据表名查询数据（排除软删除的记录）
    switch (tableName) {
      case 'users':
        data = await db.select().from(User)
        .where(isNull(User.deletedAt))
        break

      case 'tasks':
        data = await db.select().from(Task)
        .where(isNull(Task.deletedAt))
        break

      case 'k8s_clusters':
        data = await db.select().from(K8sCluster)
        break

      case 'k8s_nodes':
        data = await db.select().from(K8sNode)
        break

      default:
        return {
          success: false,
          error: '无效的表名'
        }
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error(`[GET /api/admin/database/${getRouterParam(event, 'table')}] Error:`, error)
    return {
      success: false,
      error: error.message || '获取数据失败'
    }
  }
})
