import { vi } from 'vitest'
import { defineStore as piniaDefineStore } from 'pinia'
import { ref as vueRef, computed as vueComputed } from 'vue'

// Mock Nuxt auto-imports with real Vue functions
vi.stubGlobal('defineStore', piniaDefineStore)
vi.stubGlobal('ref', vueRef)
vi.stubGlobal('computed', vueComputed)
vi.stubGlobal('$fetch', vi.fn())

// Mock H3 functions
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('readBody', vi.fn((event: any) => event._requestBody || Promise.resolve({})))
vi.stubGlobal('getQuery', vi.fn((event: any) => event._query || {}))
vi.stubGlobal('getHeader', vi.fn((event: any, key: string) => event.headers?.[key] || null))
vi.stubGlobal('getRouterParam', vi.fn((event: any, key: string) => event.context?.params?.[key]))
vi.stubGlobal('setResponseStatus', vi.fn())
vi.stubGlobal('createError', (error: any) => ({ ...error, name: 'Error' }))

// Mock useRuntimeConfig
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    jwtSecret: 'test-secret',
    databasePath: ':memory:',
    public: {
      apiBase: '/api'
    }
  })
}))
