import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { Task } from '~~/server/database/schema'
import { getAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const authUser = await getAuthUser(event)
    const taskId = parseInt(getRouterParam(event, 'id') || '')

    if (isNaN(taskId)) {
      return {
        success: false,
        error: '无效的任务ID'
      }
    }

    const db = getDb()
    const task = await db
      .select()
      .from(Task)
      .where(eq(Task.id, taskId))
      .get()

    if (!task) {
      return {
        success: false,
        error: '任务不存在'
      }
    }

    // 只允许任务创建者或管理员删除
    const isAdmin = authUser.role === 'admin'

    if (task.createdByUserId !== authUser.id && !isAdmin) {
      return {
        success: false,
        error: '无权限删除此任务'
      }
    }

    // 软删除
    await db.update(Task)
      .set({ deletedAt: new Date().toLocaleString() })
      .where(eq(Task.id, taskId))

    return {
      success: true
    }
  } catch (error: any) {
    console.error('[DELETE /api/tasks/:id] Error:', error)
    return {
      success: false,
      error: error.message || '删除任务失败'
    }
  }
})
