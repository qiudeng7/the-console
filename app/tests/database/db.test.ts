import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

describe('Database Utility', () => {
  let db: ReturnType<typeof drizzle> | null = null

  beforeEach(async () => {
    // Reset database instance before each test
    const { resetDb } = await import('~/server/database/db')
    resetDb()
  })

  afterEach(() => {
    // Clean up
    const sqlite = (db as any)?._.session?.sqlite
    sqlite?.close()
    db = null
  })

  describe('Singleton Pattern', () => {
    it('should create database instance on first call', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance = getDb(':memory:')

      expect(instance).toBeDefined()
      expect(db).toBeNull() // Local variable still null
    })

    it('should return same instance on subsequent calls', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance1 = getDb(':memory:')
      const instance2 = getDb(':memory:')

      expect(instance1).toBe(instance2)
    })

    it('should initialize drizzle with schema', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance = getDb(':memory:')

      expect(instance).toBeDefined()
      // Drizzle instance should have query methods
      expect(typeof instance?.select).toBe('function')
      expect(typeof instance?.insert).toBe('function')
      expect(typeof instance?.update).toBe('function')
      expect(typeof instance?.delete).toBe('function')
    })
  })

  describe('Database Connection', () => {
    it('should use provided databasePath parameter', async () => {
      const { getDb } = await import('~/server/database/db')
      const instance = getDb(':memory:')

      expect(instance).toBeDefined()
    })

    it('should create in-memory database when path is :memory:', async () => {
      const { getDb } = await import('~/server/database/db')

      // Should not throw when creating in-memory database
      expect(() => getDb(':memory:')).not.toThrow()
    })
  })

  describe('Schema Integration', () => {
    it('should have schema exported and attached to db instance', async () => {
      const { getDb } = await import('~/server/database/db')
      const schema = await import('~/server/database/schema')
      const instance = getDb(':memory:')

      // Verify schema tables are defined
      expect(schema.User).toBeDefined()
      expect(schema.Task).toBeDefined()
      expect(schema.K8sCluster).toBeDefined()
      expect(schema.K8sNode).toBeDefined()
    })
  })

  describe('Database Operations', () => {
    it('should support basic query operations', async () => {
      const { getDb } = await import('~/server/database/db')
      const { User } = await import('~/server/database/schema')
      db = getDb(':memory:')

      // Select should return a query builder
      const selectQuery = db.select().from(User)
      expect(selectQuery).toBeDefined()
    })
  })
})
