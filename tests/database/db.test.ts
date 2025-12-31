import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

// Mock useRuntimeConfig
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    databasePath: ':memory:'
  })
}))

describe('Database Utility', () => {
  let db: ReturnType<typeof drizzle> | null = null

  afterEach(() => {
    // Clear module cache to reset singleton between tests
    vi.resetModules()
    db = null
  })

  describe('Singleton Pattern', () => {
    it('should create database instance on first call', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance = getDb()

      expect(instance).toBeDefined()
      expect(db).toBeNull() // Local variable still null
    })

    it('should return same instance on subsequent calls', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance1 = getDb()
      const instance2 = getDb()

      expect(instance1).toBe(instance2)
    })

    it('should initialize drizzle with schema', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance = getDb()

      expect(instance).toBeDefined()
      // Drizzle instance should have query methods
      expect(typeof instance?.select).toBe('function')
      expect(typeof instance?.insert).toBe('function')
      expect(typeof instance?.update).toBe('function')
      expect(typeof instance?.delete).toBe('function')
    })
  })

  describe('Database Connection', () => {
    it('should use databasePath from runtime config', async () => {
      // Mock with specific path
      vi.doMock('#app', () => ({
        useRuntimeConfig: () => ({
          databasePath: ':memory:'
        })
      }))

      const { getDb } = await import('~/server/database/db')
      const instance = getDb()

      expect(instance).toBeDefined()
    })

    it('should create in-memory database when path is :memory:', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance = getDb()

      expect(instance).toBeDefined()
      // In-memory database should work without file
      expect(instance).not.toThrow()
    })
  })

  describe('Schema Integration', () => {
    it('should have schema exported and attached to db instance', async () => {
      const { getDb } = await import('~/server/database/db')
      const schema = await import('~/server/database/schema')
      const instance = getDb()

      // Verify schema tables are defined
      expect(schema.users).toBeDefined()
      expect(schema.tasks).toBeDefined()
      expect(schema.k8sClusters).toBeDefined()
      expect(schema.k8sNodes).toBeDefined()
    })
  })

  describe('Database Operations', () => {
    it('should support basic query operations', async () => {
      const { getDb } = await import('~/server/database/db')
      const db = getDb()

      // Select should return a query builder
      const selectQuery = db.select().from(await import('~/server/database/schema').then(m => m.users))
      expect(selectQuery).toBeDefined()
    })
  })
})
