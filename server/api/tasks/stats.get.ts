import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/database/db'
import { Task } from '~~/server/database/schema'
import { getAdminUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  await getAdminUser(event)

  const db = getDb()

  // 获取所有未删除的任务
  const allTasks = await db
    .select()
    .from(Task)
    .where(eq(Task.deletedAt, ''))
    .all()

  // 按状态统计
  const byStatus: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
    cancelled: 0
  }

  // 按分类统计
  const byCategory: Record<string, number> = {}

  // 按执行人统计
  const byAssignee: Record<number, number> = {}

  allTasks.forEach(task => {
    // 状态统计
    if (task.status) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1
    }

    // 分类统计
    if (task.category) {
      byCategory[task.category] = (byCategory[task.category] || 0) + 1
    }

    // 执行人统计
    if (task.assignedToUserId) {
      byAssignee[task.assignedToUserId] = (byAssignee[task.assignedToUserId] || 0) + 1
    }
  })

  return {
    success: true,
    data: {
      byStatus,
      byCategory,
      byAssignee,
      total: allTasks.length
    }
  }
})
