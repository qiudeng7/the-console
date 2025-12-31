import { getDb } from './database/db'
import { TaskQueue } from './task-queue'

// 初始化队列
const db = getDb()
const queue = new TaskQueue(db, {
  batchSize: 10,
  flushInterval: 100
})

// Nitro 会自动处理路由，我们只需导出事件处理器
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const method = getMethod(event)

  // 健康检查
  if (url.pathname === '/health' && method === 'GET') {
    return { status: 'ok' }
  }

  // 队列状态查询
  if (url.pathname === '/queue/status' && method === 'GET') {
    const status = queue.getStatus()
    return { success: true, data: status }
  }

  // 接收任务
  if (url.pathname === '/queue/job' && method === 'POST') {
    try {
      const body = await readBody(event)
      const { type, data } = body

      // 添加到队列并等待结果
      const result = await queue.add(type, data)
      return { success: true, data: result }
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }
  }

  // 404
  throw createError({
    statusCode: 404,
    message: 'Not Found'
  })
})

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，关闭队列...')
  await queue.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('收到 SIGINT 信号，关闭队列...')
  await queue.shutdown()
  process.exit(0)
})
