import { vi } from 'vitest'

// Create hoisted variables first
const { MockTaskQueue, mockDbInstance } = vi.hoisted(() => {
  class MockTaskQueue {
    add = vi.fn(() => Promise.resolve({ jobId: 'mock-job-id' }))
    getStatus = vi.fn(() => ({ queueLength: 0, processing: false }))
    shutdown = vi.fn(() => Promise.resolve())

    constructor(db: any, options?: any) {
      // Mock constructor
    }
  }

  const dbChain: any = {
    select: vi.fn(() => dbChain),
    insert: vi.fn(() => dbChain),
    update: vi.fn(() => dbChain),
    delete: vi.fn(() => dbChain),
    from: vi.fn(() => dbChain),
    where: vi.fn(() => dbChain),
    values: vi.fn(() => dbChain),
    set: vi.fn(() => dbChain),
    limit: vi.fn(() => Promise.resolve([])),
    offset: vi.fn(() => Promise.resolve([])),
    execute: vi.fn(() => Promise.resolve([]))
  }

  return { MockTaskQueue, mockDbInstance: dbChain }
})

// Mock TaskQueue
vi.mock('~/server/task-queue', () => ({
  TaskQueue: MockTaskQueue
}))

// Mock database
vi.mock('~/server/database/db', () => ({
  getDb: vi.fn(() => mockDbInstance),
  closeDb: vi.fn()
}))

// Mock Nuxt runtime config
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    databaseUrl: 'mysql://test:test@localhost:3306/test_db'
  })
}))

// Export mocks for use in tests
export const mockTaskQueueClass = MockTaskQueue
export const mockDb = mockDbInstance

