import { vi } from 'vitest'

/**
 * 创建 mock TaskQueue 实例
 * @param overrides - 覆盖默认 mock 行为
 */
export function createMockQueue(overrides: {
  add?: any
  getStatus?: any
  shutdown?: any
} = {}) {
  return {
    add: overrides.add || vi.fn(() => Promise.resolve({ jobId: 'mock-job-id' })),
    getStatus: overrides.getStatus || vi.fn(() => ({ queueLength: 0, processing: false })),
    shutdown: overrides.shutdown || vi.fn(() => Promise.resolve()),
  }
}

/**
 * 创建 mock H3Event
 * @param options - 事件配置选项
 */
export function createMockEvent({
  body = {},
  query = {},
  headers = {}
}: {
  body?: any
  query?: any
  headers?: Record<string, string>
} = {}) {
  return {
    node: { req: {}, res: {} },
    context: {},
    _requestBody: body,
    _query: query,
    headers
  } as any
}

/**
 * Mock TaskQueue 模块
 * @param mockQueue - mock queue 实例
 */
export function mockTaskQueue(mockQueue: any) {
  vi.mock('~/server/task-queue', () => ({
    TaskQueue: vi.fn(() => mockQueue)
  }))
}
