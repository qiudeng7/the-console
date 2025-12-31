import { vi } from 'vitest'
import { defineStore as piniaDefineStore } from 'pinia'
import { ref as vueRef, computed as vueComputed } from 'vue'

// Mock Nuxt auto-imports with real Vue functions
vi.stubGlobal('defineStore', piniaDefineStore)
vi.stubGlobal('ref', vueRef)
vi.stubGlobal('computed', vueComputed)
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
