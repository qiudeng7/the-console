import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

let pool: mysql.Pool | null = null
let db: ReturnType<typeof drizzle> | null = null

/**
 * Get database instance
 * @returns Drizzle database instance
 */
export function getDb() {
  if (!db) {
    const connectionUrl = process.env.DATABASE_URL || 'mysql://root:root_password@localhost:3306/the_console'

    pool = mysql.createPool(connectionUrl, {
      connectionLimit: 10,
      enableKeepAlive: true
    })
    db = drizzle(pool, { schema, mode: 'default' })
  }
  return db!
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
    db = null
  }
}

/**
 * Reset database instance (for testing purposes)
 */
export function resetDb() {
  if (pool) {
    pool.end()
    pool = null
    db = null
  }
}
