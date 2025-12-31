import { getDb } from '~~/server/database/db'
import { User, Task, K8sCluster, K8sNode } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'
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
    let insertId: number | undefined
    let tableNameSchema: any

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
        const userResult = await db.insert(User)
          .values({
            ...body,
            password: hashedPassword
          })
        insertId = (userResult as any).insertId
        tableNameSchema = User
        break

      case 'tasks':
        const taskResult = await db.insert(Task)
          .values(body)
        insertId = (taskResult as any).insertId
        tableNameSchema = Task
        break

      case 'k8s_clusters':
        const clusterResult = await db.insert(K8sCluster)
          .values(body)
        insertId = (clusterResult as any).insertId
        tableNameSchema = K8sCluster
        break

      case 'k8s_nodes':
        const nodeResult = await db.insert(K8sNode)
          .values(body)
        insertId = (nodeResult as any).insertId
        tableNameSchema = K8sNode
        break

      default:
        return {
          success: false,
          error: '无效的表名'
        }
    }

    // MySQL Drizzle 不支持 .returning()，需要重新查询获取插入的记录
    const insertedData = await db.select()
      .from(tableNameSchema)
      .where(eq(tableNameSchema.id, insertId!))

    return {
      success: true,
      data: insertedData[0]
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
