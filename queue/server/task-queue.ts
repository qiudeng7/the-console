// 任务队列 Job 类型定义
export interface QueueJob {
  type: 'create-task' | 'update-task' | 'delete-task'
  data: any
  resolve: (value: any) => void
  reject: (error: Error) => void
  attempts: number
  maxAttempts: number
}

export class TaskQueue {
  private queue: QueueJob[] = []
  private processing = false
  private db: any
  private batchSize = 10
  private flushInterval = 100 // ms
  private flushTimer?: NodeJS.Timeout

  constructor(db: any, options?: { batchSize?: number; flushInterval?: number }) {
    this.db = db
    if (options?.batchSize) this.batchSize = options.batchSize
    if (options?.flushInterval) this.flushInterval = options.flushInterval

    // 启动定时刷新
    this.startFlushTimer()
  }

  // 添加任务到队列
  async add<T>(type: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const job: QueueJob = {
        type,
        data,
        resolve,
        reject,
        attempts: 0,
        maxAttempts: 3
      }
      this.queue.push(job)

      // 如果队列积累到 batchSize，立即处理
      if (this.queue.length >= this.batchSize) {
        this.flush().catch(console.error)
      }
    })
  }

  // 启动定时刷新
  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush().catch(console.error)
      }
    }, this.flushInterval)
  }

  // 批量处理队列
  private async flush() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const jobs = this.queue.splice(0, this.batchSize)

    try {
      // 按类型分组批量处理
      const grouped = this.groupJobsByType(jobs)

      for (const [type, jobsOfThisType] of Object.entries(grouped)) {
        await this.processJobsByType(type, jobsOfThisType)
      }
    } catch (error) {
      console.error('队列处理失败:', error)
      // 失败的任务放回队列
      this.queue.unshift(...jobs)
    } finally {
      this.processing = false
    }
  }

  // 按类型分组
  private groupJobsByType(jobs: QueueJob[]): Record<string, QueueJob[]> {
    return jobs.reduce((acc, job) => {
      if (!acc[job.type]) acc[job.type] = []
      acc[job.type].push(job)
      return acc
    }, {} as Record<string, QueueJob[]>)
  }

  // 处理特定类型的任务
  private async processJobsByType(type: string, jobs: QueueJob[]) {
    switch (type) {
      case 'create-task':
        await this.processCreateTasks(jobs)
        break
      case 'update-task':
        await this.processUpdateTasks(jobs)
        break
      case 'delete-task':
        await this.processDeleteTasks(jobs)
        break
      default:
        throw new Error(`Unknown job type: ${type}`)
    }
  }

  // 处理创建任务
  private async processCreateTasks(jobs: QueueJob[]) {
    const { Task, User } = await import('./database/schema')
    const { eq } = await import('drizzle-orm')

    for (const job of jobs) {
      try {
        // 验证用户权限
        const users = await this.db
          .select()
          .from(User)
          .where(eq(User.id, job.data.createdByUserId))

        const user = users[0]
        if (!user || user.role === 'employee') {
          job.reject(new Error('用户无权限创建任务'))
          continue
        }

        // 创建任务（无需乐观锁，因为是新增）
        const insertResult = await this.db
          .insert(Task)
          .values({
            title: job.data.title,
            category: job.data.category,
            tag: job.data.tag,
            description: job.data.description,
            status: job.data.status || 'todo',
            createdByUserId: job.data.createdByUserId,
            assignedToUserId: job.data.assignedToUserId,
            version: 1,  // ← 初始版本号
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null
          })

        // MySQL Drizzle 不支持 .returning()，需要重新查询
        // insertResult 是数组，第一个元素包含 insertId
        const result = (insertResult as any)[0] || insertResult
        const insertId = result.insertId
        console.log('[TaskQueue] Insert ID:', insertId)

        const newTasks = await this.db
          .select()
          .from(Task)
          .where(eq(Task.id, insertId))

        console.log('[TaskQueue] Query result:', newTasks.length, 'tasks')

        const newTask = newTasks[0]
        if (!newTask) {
          throw new Error(`Task not found after insert. InsertId: ${insertId}`)
        }

        job.resolve({ taskId: newTask.id, task: newTask })
      } catch (error: any) {
        this.handleJobError(job, error)
      }
    }
  }

  // 处理更新任务（带乐观锁）
  private async processUpdateTasks(jobs: QueueJob[]) {
    const { Task } = await import('./database/schema')
    const { eq, and } = await import('drizzle-orm')

    for (const job of jobs) {
      try {
        // 读取当前任务和版本号
        const existingTasks = await this.db
          .select()
          .from(Task)
          .where(eq(Task.id, job.data.taskId))

        const existingTask = existingTasks[0]
        if (!existingTask) {
          job.reject(new Error('任务不存在'))
          continue
        }

        if (existingTask.createdByUserId !== job.data.userId) {
          job.reject(new Error('无权限修改此任务'))
          continue
        }

        // 使用乐观锁更新
        const result = await this.db
          .update(Task)
          .set({
            ...job.data.updates,
            version: existingTask.version + 1,  // ← 版本号 +1
            updatedAt: new Date()
          })
          .where(
            and(
              eq(Task.id, job.data.taskId),
              eq(Task.version, existingTask.version)  // ← 乐观锁检查
            )
          )

        // 检查是否更新成功（MySQL 使用 affectedRows）
        if (result.affectedRows === 0) {
          throw new Error('VERSION_CONFLICT')
        }

        // 返回更新后的任务
        const updatedTasks = await this.db
          .select()
          .from(Task)
          .where(eq(Task.id, job.data.taskId))

        const updatedTask = updatedTasks[0]
        job.resolve({ taskId: updatedTask.id, task: updatedTask })
      } catch (error: any) {
        this.handleJobError(job, error)
      }
    }
  }

  // 处理删除任务（软删除，带乐观锁）
  private async processDeleteTasks(jobs: QueueJob[]) {
    const { Task } = await import('./database/schema')
    const { eq, and } = await import('drizzle-orm')

    for (const job of jobs) {
      try {
        const existingTasks = await this.db
          .select()
          .from(Task)
          .where(eq(Task.id, job.data.taskId))

        const existingTask = existingTasks[0]
        if (!existingTask) {
          job.reject(new Error('任务不存在'))
          continue
        }

        if (existingTask.createdByUserId !== job.data.userId) {
          job.reject(new Error('无权限删除此任务'))
          continue
        }

        // 使用乐观锁软删除
        const result = await this.db
          .update(Task)
          .set({
            deletedAt: new Date(),
            version: existingTask.version + 1  // ← 版本号 +1
          })
          .where(
            and(
              eq(Task.id, job.data.taskId),
              eq(Task.version, existingTask.version)  // ← 乐观锁检查
            )
          )

        if (result.affectedRows === 0) {
          throw new Error('VERSION_CONFLICT')
        }

        job.resolve({ taskId: job.data.taskId, success: true })
      } catch (error: any) {
        this.handleJobError(job, error)
      }
    }
  }

  // 错误处理（指数退避重试）
  private handleJobError(job: QueueJob, error: any) {
    job.attempts++

    // 版本冲突特殊处理
    if (error.message === 'VERSION_CONFLICT') {
      // 版本冲突不需要指数退避，直接重试
      if (job.attempts < job.maxAttempts) {
        setTimeout(() => {
          this.queue.push(job)
        }, 50)  // 50ms 后重试

        console.log(`版本冲突，任务 ${job.type} 重试 ${job.attempts}/${job.maxAttempts}`)
      } else {
        console.error(`任务 ${job.type} 失败（版本冲突）:`, error.message)
        job.reject(new Error('任务已被其他用户修改，请刷新后重试'))
      }
      return
    }

    // 其他错误使用指数退避
    if (job.attempts < job.maxAttempts) {
      const delay = Math.pow(2, job.attempts) * 100
      setTimeout(() => {
        this.queue.push(job)
      }, delay)

      console.log(`任务 ${job.type} 重试 ${job.attempts}/${job.maxAttempts}，延迟 ${delay}ms`)
    } else {
      console.error(`任务 ${job.type} 失败:`, error.message)
      job.reject(error)
    }
  }

  // 优雅关闭
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    // 处理剩余任务
    while (this.queue.length > 0) {
      await this.flush()
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 获取队列状态
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    }
  }
}
