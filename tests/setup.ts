import { vi } from 'vitest'
import { defineStore as piniaDefineStore } from 'pinia'

// Mock Nuxt auto-imports
vi.stubGlobal('defineStore', piniaDefineStore)
vi.stubGlobal('ref', (value: any) => ({ value }))
vi.stubGlobal('computed', (fn: any) => ({ deps: [], fn }))
vi.stubGlobal('$fetch', vi.fn())

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
