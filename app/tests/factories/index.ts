import type { User, Task, K8sCluster, K8sNode } from '~/server/database/schema'

/**
 * 构建用户数据
 */
export function buildUser(overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  const timestamp = Date.now()
  return {
    email: `user-${timestamp}@test.com`,
    password: 'test123',
    role: 'admin',
    version: 1,
    deletedAt: null,
    ...overrides
  }
}

/**
 * 构建任务数据
 */
export function buildTask(overrides: Partial<Task> = {}): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: 'Test Task',
    category: 'Testing',
    tag: 'test',
    description: 'Test task description',
    status: 'todo',
    createdByUserId: 1,
    assignedToUserId: 1,
    version: 1,
    deletedAt: null,
    ...overrides
  }
}

/**
 * 构建完整用户数据（包含 id）
 */
export function buildUserWithId(overrides: Partial<User> = {}): User {
  const timestamp = Date.now()
  return {
    id: 1,
    email: `user-${timestamp}@test.com`,
    password: 'test123',
    role: 'admin',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }
}

/**
 * 构建完整任务数据（包含 id）
 */
export function buildTaskWithId(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: 'Test Task',
    category: 'Testing',
    tag: 'test',
    description: 'Test task description',
    status: 'todo',
    createdByUserId: 1,
    assignedToUserId: 1,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }
}
