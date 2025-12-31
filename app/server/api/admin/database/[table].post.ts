import { getDb } from '~~/server/database/db'
import { User, Task, K8sCluster, K8sNode } from '~~/server/database/schema'
import { getAdminUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限
    await getAdminUser(event)

    const tableName = getRouterParam(event, 'table')
    const body = await readBody(event)

    if (!tableName) {
      return {
        success: false,
        error: '表名不能为空'
      }
    }

    const db = getDb()
    let result: any

    // 根据表名插入数据
    switch (tableName) {
      case 'users':
        // 用户需要密码哈希
        if (!body.password) {
          return {
            success: false,
            error: '密码不能为空'
          }
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
        return {
          success: false,
          error: '无效的表名'
        }
    }

    return {
      success: true,
      data: result[0]
    }
  } catch (error: any) {
    const tableName = getRouterParam(event, 'table')
    const body = await readBody(event).catch(() => ({}))
    console.error(`[POST /api/admin/database/${tableName}] Error:`, error)
    console.error('Request body:', body)

    return {
      success: false,
      error: error.message || '创建失败'
    }
  }
})
