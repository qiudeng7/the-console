import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let sqlite: Database.Database | null = null

/**
 * Get database instance
 * @param databasePath - Optional database path (for testing or custom paths)
 * @returns Drizzle database instance
 */
export function getDb(databasePath?: string) {
  if (!db) {
    // Use provided path, runtime config, or fallback to env/default
    const path = databasePath ||
      (typeof useRuntimeConfig === 'function' ? useRuntimeConfig().databasePath : undefined) ||
      process.env.DATABASE_PATH ||
      './database.sqlite'

    sqlite = new Database(path)
    db = drizzle(sqlite, { schema })
  }
  return db
}

/**
 * Reset database instance (for testing purposes)
 */
export function resetDb() {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    db = null
  }
}
