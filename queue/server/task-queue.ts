/**
 * 任务队列 Job 类型定义
 *
 * @interface QueueJob
 * @description 队列中的任务单元，包含任务类型、数据、Promise 回调和重试信息
 */
export interface QueueJob {
  /** 任务类型：创建任务、更新任务、删除任务 */
  type: 'create-task' | 'update-task' | 'delete-task'
  /** 任务携带的数据（如 taskId、updates 等） */
  data: any
  /** Promise resolve 回调，任务成功时调用 */
  resolve: (value: any) => void
  /** Promise reject 回调，任务失败时调用 */
  reject: (error: Error) => void
  /** 当前重试次数 */
  attempts: number
  /** 最大重试次数（默认 3 次） */
  maxAttempts: number
}

/**
 * 任务队列管理类
 *
 * @class TaskQueue
 * @description 实现批量处理任务队列，支持乐观锁、自动重试、指数退避
 *
 * 核心特性：
 * - 批量处理：积累到 batchSize 或达到 flushInterval 时触发批量处理
 * - 定时刷新：使用定时器确保延迟任务不会等待太久
 * - 乐观锁：通过 version 字段检测并发修改冲突
 * - 自动重试：失败任务自动重试，版本冲突快速重试，其他错误指数退避
 *
 * @example
 * ```typescript
 * const queue = new TaskQueue(db, { batchSize: 10, flushInterval: 100 })
 * const result = await queue.add('create-task', { title: 'New Task' })
 * ```
 */
export class TaskQueue {
  /** 任务队列数组，存储待处理的 Job */
  private queue: QueueJob[] = []

  /** 处理状态标志，防止并发执行批量处理 */
  private processing = false

  /** 数据库连接实例（Drizzle ORM 实例） */
  private db: any

  /** 批量处理大小：队列积累到该数量时立即触发处理（默认 10） */
  private batchSize = 10

  /** 刷新间隔：定时触发批量处理的时间间隔（默认 100ms） */
  private flushInterval = 100 // ms

  /** 定时器句柄，用于周期性触发队列刷新 */
  private flushTimer?: ReturnType<typeof setInterval>

  /**
   * 构造函数
   *
   * @param db - Drizzle ORM 数据库实例
   * @param options - 配置选项
   * @param options.batchSize - 批量处理大小（默认 10）
   * @param options.flushInterval - 刷新间隔（默认 100ms）
   */
  constructor(db: any, options?: { batchSize?: number; flushInterval?: number }) {
    this.db = db
    if (options?.batchSize) this.batchSize = options.batchSize
    if (options?.flushInterval) this.flushInterval = options.flushInterval

    // 启动定时刷新
    this.startFlushTimer()
  }

  /**
   * 添加任务到队列
   *
   * @method add
   * @description 将新任务添加到队列，当队列积累到 batchSize 时立即触发批量处理
   * @param type - 任务类型（create-task、update-task、delete-task）
   * @param data - 任务数据
   * @returns Promise<T> 任务执行结果
   *
   * @example
   * ```typescript
   * const result = await queue.add('create-task', {
   *   title: 'Fix bug',
   *   createdByUserId: 1
   * })
   * ```
   */
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

  /**
   * 启动定时刷新
   *
   * @method startFlushTimer
   * @description 启动定时器，每 flushInterval 检查一次队列并处理待处理任务
   * @private
   */
  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush().catch(console.error)
      }
    }, this.flushInterval)
  }

  /**
   * 批量处理队列
   *
   * @method flush
   * @description 从队列中取出最多 batchSize 个任务，按类型分组后批量处理
   * @private
   *
   * 处理流程：
   * 1. 检查是否正在处理，避免并发执行
   * 2. 从队列头部取出最多 batchSize 个任务
   * 3. 按任务类型分组（create-task、update-task、delete-task）
   * 4. 依次调用对应的处理方法
   * 5. 失败时将任务放回队列头部
   */
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

  /**
   * 按类型分组
   *
   * @method groupJobsByType
   * @description 将任务数组按 type 字段分组，便于批量处理
   * @param jobs - 待分组的任务数组
   * @returns 按类型分组的任务对象
   * @private
   */
  private groupJobsByType(jobs: QueueJob[]): Record<string, QueueJob[]> {
    return jobs.reduce((acc, job) => {
      if (!acc[job.type]) acc[job.type] = []
      acc[job.type].push(job)
      return acc
    }, {} as Record<string, QueueJob[]>)
  }

  /**
   * 处理特定类型的任务
   *
   * @method processJobsByType
   * @description 根据任务类型分发到对应的处理方法
   * @param type - 任务类型
   * @param jobs - 该类型的所有任务
   * @throws 当遇到未知任务类型时抛出错误
   * @private
   */
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

  /**
   * 处理创建任务
   *
   * @method processCreateTasks
   * @description 批量创建任务，验证用户权限后插入数据库
   * @param jobs - create-task 类型的任务数组
   * @private
   *
   * 处理流程：
   * 1. 查询用户并验证权限（只有 admin 可以创建任务）
   * 2. 插入新任务，初始 version = 1
   * 3. 重新查询插入的任务（MySQL Drizzle 不支持 .returning()）
   * 4. 调用 job.resolve() 返回结果
   *
   * 错误处理：失败时调用 handleJobError 进行重试
   */
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

  /**
   * 处理更新任务（带乐观锁）
   *
   * @method processUpdateTasks
   * @description 批量更新任务，使用乐观锁机制防止并发冲突
   * @param jobs - update-task 类型的任务数组
   * @private
   *
   * 处理流程：
   * 1. 查询现有任务和版本号
   * 2. 验证权限（只有创建者可以修改）
   * 3. 使用 WHERE 条件同时匹配 id 和 version 进行更新
   * 4. 检查 affectedRows，如果为 0 说明版本冲突
   * 5. 更新成功后 version + 1
   *
   * 乐观锁机制：
   * - WHERE id = ? AND version = ?
   * - 如果版本不匹配，affectedRows = 0，触发 VERSION_CONFLICT 错误
   */
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

  /**
   * 处理删除任务（软删除，带乐观锁）
   *
   * @method processDeleteTasks
   * @description 批量软删除任务，使用乐观锁机制防止并发冲突
   * @param jobs - delete-task 类型的任务数组
   * @private
   *
   * 处理流程：
   * 1. 查询现有任务
   * 2. 验证权限（只有创建者可以删除）
   * 3. 使用乐观锁更新 deletedAt 字段（软删除）
   * 4. 检查 affectedRows 判断是否版本冲突
   *
   * 软删除：不物理删除记录，只设置 deletedAt 字段
   */
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

  /**
   * 错误处理（指数退避重试）
   *
   * @method handleJobError
   * @description 处理任务失败，根据错误类型决定重试策略
   * @param job - 失败的任务
   * @param error - 错误信息
   * @private
   *
   * 重试策略：
   *
   * 1. **版本冲突（VERSION_CONFLICT）**
   *    - 不使用指数退避，50ms 后快速重试
   *    - 最多重试 3 次
   *    - 超过重试次数后返回友好错误信息
   *
   * 2. **其他错误**
   *    - 使用指数退避：2^attempts * 100ms
   *    - 第 1 次：200ms，第 2 次：400ms，第 3 次：800ms
   *    - 超过重试次数后直接 reject
   *
   * @example
   * ```typescript
   * // 版本冲突：50ms 后重试
   * if (error.message === 'VERSION_CONFLICT') {
   *   setTimeout(() => this.queue.push(job), 50)
   * }
   *
   * // 其他错误：200ms 后重试
   * setTimeout(() => this.queue.push(job), 200)
   * ```
   */
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

  /**
   * 优雅关闭
   *
   * @method shutdown
   * @description 清理定时器并处理剩余所有任务
   * @returns Promise<void>
   *
   * 关闭流程：
   * 1. 清除定时器
   * 2. 循环调用 flush() 处理剩余任务
   * 3. 等待队列清空后返回
   *
   * @example
   * ```typescript
   * process.on('SIGTERM', async () => {
   *   await queue.shutdown()
   *   process.exit(0)
   * })
   * ```
   */
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

  /**
   * 获取队列状态
   *
   * @method getStatus
   * @description 返回队列当前状态（队列长度、处理状态）
   * @returns 队列状态对象
   *
   * @example
   * ```typescript
   * const status = queue.getStatus()
   * console.log(status.queueLength) // 5
   * console.log(status.processing)   // true
   * ```
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    }
  }
}
