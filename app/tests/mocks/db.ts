import { vi } from 'vitest'
import type { User, Task, K8sCluster, K8sNode } from '~/server/database/schema'

/**
 * 创建 mock 数据库实例
 * @param data - 包含 users、tasks 等数据的对象
 */
export function createMockDb(data: {
  users?: User[]
  tasks?: Task[]
  clusters?: K8sCluster[]
  nodes?: K8sNode[]
} = {}) {
  const mockChain = {
    select: vi.fn(() => mockChain),
    insert: vi.fn(() => mockChain),
    update: vi.fn(() => mockChain),
    delete: vi.fn(() => mockChain),
    from: vi.fn(() => mockChain),
    where: vi.fn(() => mockChain),
    values: vi.fn(() => mockChain),
    set: vi.fn(() => mockChain),
    limit: vi.fn(() => Promise.resolve(data.tasks || data.users || data.clusters || data.nodes || [])),
    offset: vi.fn(() => Promise.resolve(data.tasks || data.users || data.clusters || data.nodes || [])),
    execute: vi.fn(() => Promise.resolve(data.tasks || data.users || data.clusters || data.nodes || [])),
    then: vi.fn((cb: any) => {
      const result = data.tasks || data.users || data.clusters || data.nodes || []
      return Promise.resolve(cb(result))
    })
  }

  return mockChain
}

/**
 * 创建 mock 认证用户
 */
export function createMockAuthUser(overrides: Partial<User> = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // bcrypt hash
    role: 'admin',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }
}

/**
 * 创建 mock 任务数据
 */
export function createMockTask(overrides: Partial<Task> = {}) {
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

/**
 * 创建 mock H3Event
 */
export function createMockEvent({ body = {}, query = {}, headers = {} }: any = {}) {
  return {
    node: { req: {}, res: {} },
    context: {},
    _requestBody: body,
    _query: query,
    headers
  } as any
}

/**
 * Mock getDb 函数
 */
export function mockGetDb(data: { users?: User[], tasks?: Task[] } = {}) {
  const mockDb = createMockDb(data)

  vi.mock('~/server/database/db', () => ({
    getDb: vi.fn(() => mockDb),
    resetDb: vi.fn()
  }))

  return mockDb
}

/**
 * Mock getAuthUser 函数
 */
export function mockGetAuthUser(user: Partial<User> = {}) {
  const mockUser = createMockAuthUser(user)

  vi.mock('~/server/utils/auth', () => ({
    getAuthUser: vi.fn(() => Promise.resolve(mockUser))
  }))

  return mockUser
}
