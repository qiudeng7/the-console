export interface QueueJob {
  type: 'create-task' | 'update-task' | 'delete-task'
  data: Record<string, unknown>
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  attempts: number
  maxAttempts: number
}

/**
 * 任务队列管理类 - 支持批量处理、乐观锁、自动重试
 */
export class TaskQueue {
  private queue: QueueJob[] = []
  private processing = false
  private flushTimer?: ReturnType<typeof setInterval>

  constructor(
    private db: any,
    private batchSize = 10,
    private flushInterval = 100
  ) {
    this.startFlushTimer()
  }

  /** 添加任务并异步处理 */
  async add<T>(type: QueueJob['type'], data: Record<string, unknown>): Promise<T> {
    console.log('[TaskQueue] Processing job:', type, data.taskId || data.title)

    return new Promise((resolve, reject) => {
      const job: QueueJob = { type, data, resolve, reject, attempts: 0, maxAttempts: 3 }

      // 异步处理任务，确保不阻塞
      this.processJobAsync(job).then(result => {
        resolve(result as T)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /** 异步处理单个任务 */
  private async processJobAsync(job: QueueJob): Promise<unknown> {
    console.log('[TaskQueue] Starting job processing, type:', job.type)
    try {
      await this.processJobsByType(job.type, [job])
      console.log('[TaskQueue] Job completed successfully')
      // 返回result，如果resolve被调用的话
      return { success: true }
    } catch (error) {
      console.error('[TaskQueue] Job processing failed:', error)
      this.handleJobError(job, error)
      throw error
    }
  }

  /** 启动定时刷新 */
  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) this.flush().catch(console.error)
    }, this.flushInterval)
  }

  /** 批量处理队列 */
  private async flush() {
    if (this.processing) {
      console.log('[TaskQueue] Already processing, skipping flush')
      return
    }

    if (this.queue.length === 0) {
      console.log('[TaskQueue] Queue is empty, skipping flush')
      return
    }

    console.log('[TaskQueue] Flushing queue, size:', this.queue.length)
    this.processing = true
    const jobs = this.queue.splice(0, this.batchSize)
    console.log('[TaskQueue] Spliced', jobs.length, 'jobs from queue, remaining:', this.queue.length)

    try {
      const grouped = this.groupJobsByType(jobs)
      console.log('[TaskQueue] Grouped jobs:', Object.keys(grouped))
      for (const [type, jobsOfThisType] of Object.entries(grouped)) {
        console.log('[TaskQueue] Processing type:', type, 'count:', jobsOfThisType.length)
        await this.processJobsByType(type, jobsOfThisType)
        console.log('[TaskQueue] Finished processing type:', type)
      }
    } catch (error) {
      console.error('队列处理失败:', error)
      this.queue.unshift(...jobs)
    } finally {
      this.processing = false
      console.log('[TaskQueue] Flush complete, processing = false')

      // 如果还有任务，继续处理
      if (this.queue.length > 0) {
        console.log('[TaskQueue] More jobs in queue, triggering another flush')
        setTimeout(() => {
          this.flush().catch(console.error)
        }, 0)
      }
    }
  }

  /** 按类型分组任务 */
  private groupJobsByType(jobs: QueueJob[]): Record<string, QueueJob[]> {
    return jobs.reduce((acc, job) => {
      if (!acc[job.type]) acc[job.type] = []
      acc[job.type].push(job)
      return acc
    }, {} as Record<string, QueueJob[]>)
  }

  /** 根据类型分发处理 */
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

  /** 处理创建任务 */
  private async processCreateTasks(jobs: QueueJob[]) {
    const { Task, User } = await import('./database/schema')
    const { eq } = await import('drizzle-orm')

    for (const job of jobs) {
      try {
        const users = await this.db.select().from(User).where(eq(User.id, job.data.createdByUserId as number))
        const user = users[0]

        if (!user || user.role === 'employee') {
          job.reject(new Error('用户无权限创建任务'))
          continue
        }

        const insertResult = await this.db.insert(Task).values({
          title: job.data.title as string,
          category: job.data.category as string | null,
          tag: job.data.tag as string | null,
          description: job.data.description as string | null,
          status: (job.data.status as string) || 'todo',
          createdByUserId: job.data.createdByUserId as number,
          assignedToUserId: job.data.assignedToUserId as number | null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null
        })

        const result = (insertResult as any)[0] || insertResult
        const insertId = result.insertId

        const newTasks = await this.db.select().from(Task).where(eq(Task.id, insertId))
        const newTask = newTasks[0]

        if (!newTask) {
          throw new Error(`Task not found after insert. InsertId: ${insertId}`)
        }

        job.resolve({ taskId: newTask.id, task: newTask })
      } catch (error: unknown) {
        this.handleJobError(job, error)
      }
    }
  }

  /** 处理更新任务（带乐观锁） */
  private async processUpdateTasks(jobs: QueueJob[]) {
    console.log('[TaskQueue] processUpdateTasks called')
    const { Task } = await import('./database/schema')
    const { eq, and } = await import('drizzle-orm')

    for (const job of jobs) {
      console.log('[TaskQueue] Processing job, taskId:', job.data.taskId)
      try {
        console.log('[TaskQueue] Getting task with permission check')
        const existingTask = await this.getTaskWithPermissionCheck(job, Task, eq)
        if (!existingTask) {
          console.log('[TaskQueue] No existing task or permission denied')
          continue
        }

        console.log('[TaskQueue] Updating task in database')
        const result = await this.db
          .update(Task)
          .set({
            ...(job.data.updates as Record<string, unknown>),
            version: existingTask.version + 1,
            updatedAt: new Date()
          })
          .where(and(eq(Task.id, job.data.taskId as number), eq(Task.version, existingTask.version)))

        console.log('[TaskQueue] Update result, affectedRows:', result.affectedRows)

        if (result.affectedRows === 0) {
          throw new Error('VERSION_CONFLICT')
        }

        console.log('[TaskQueue] Fetching updated task')
        const updatedTasks = await this.db.select().from(Task).where(eq(Task.id, job.data.taskId as number))
        console.log('[TaskQueue] Resolving job')
        job.resolve({ taskId: updatedTasks[0].id, task: updatedTasks[0] })
        console.log('[TaskQueue] Job resolved')
      } catch (error: unknown) {
        console.error('[TaskQueue] Error processing job:', error)
        this.handleJobError(job, error)
      }
    }
  }

  /** 处理删除任务（软删除，带乐观锁） */
  private async processDeleteTasks(jobs: QueueJob[]) {
    const { Task } = await import('./database/schema')
    const { eq, and } = await import('drizzle-orm')

    for (const job of jobs) {
      try {
        const existingTask = await this.getTaskWithPermissionCheck(job, Task, eq)
        if (!existingTask) continue

        const result = await this.db
          .update(Task)
          .set({ deletedAt: new Date(), version: existingTask.version + 1 })
          .where(and(eq(Task.id, job.data.taskId as number), eq(Task.version, existingTask.version)))

        if (result.affectedRows === 0) {
          throw new Error('VERSION_CONFLICT')
        }

        job.resolve({ taskId: job.data.taskId as number, success: true })
      } catch (error: unknown) {
        this.handleJobError(job, error)
      }
    }
  }

  /** 获取任务并检查权限 */
  private async getTaskWithPermissionCheck(job: QueueJob, Task: any, eq: any) {
    const existingTasks = await this.db.select().from(Task).where(eq(Task.id, job.data.taskId as number))
    const existingTask = existingTasks[0]

    if (!existingTask) {
      job.reject(new Error('任务不存在'))
      return null
    }

    // 允许创建者或被分配的员工修改任务
    const hasPermission = existingTask.createdByUserId === job.data.userId ||
                         existingTask.assignedToUserId === job.data.userId

    if (!hasPermission) {
      job.reject(new Error('无权限修改此任务'))
      return null
    }

    return existingTask
  }

  /** 错误处理（指数退避重试） */
  private handleJobError(job: QueueJob, error: unknown) {
    job.attempts++
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage === 'VERSION_CONFLICT') {
      if (job.attempts < job.maxAttempts) {
        setTimeout(() => this.queue.push(job), 50)
        console.log(`版本冲突，任务 ${job.type} 重试 ${job.attempts}/${job.maxAttempts}`)
      } else {
        job.reject(new Error('任务已被其他用户修改，请刷新后重试'))
      }
      return
    }

    if (job.attempts < job.maxAttempts) {
      const delay = Math.pow(2, job.attempts) * 100
      setTimeout(() => this.queue.push(job), delay)
      console.log(`任务 ${job.type} 重试 ${job.attempts}/${job.maxAttempts}，延迟 ${delay}ms`)
    } else {
      job.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /** 优雅关闭 */
  async shutdown() {
    if (this.flushTimer) clearInterval(this.flushTimer)

    while (this.queue.length > 0) {
      await this.flush()
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /** 获取队列状态 */
  getStatus() {
    return { queueLength: this.queue.length, processing: this.processing }
  }
}
