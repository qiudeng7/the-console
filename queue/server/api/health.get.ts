import { getDb } from '../../database/db'
import { TaskQueue } from '../../task-queue'

// 初始化队列（单例）
const db = getDb()
const queue = new TaskQueue(db, {
  batchSize: 10,
  flushInterval: 100
})

// 导出队列实例供其他路由使用
export { queue }

export default defineEventHandler(async (event) => {
  return { status: 'ok' }
})
