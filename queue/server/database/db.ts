import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

let pool: mysql.Pool | null = null
let db: any = null

export function getDb() {
  if (!db) {
    const connectionUrl = process.env.DATABASE_URL || 'mysql://root:root_password@localhost:3306/the_console'

    pool = mysql.createPool({
      uri: connectionUrl,
      connectionLimit: 10,
      enableKeepAlive: true
    })
    db = drizzle(pool)
  }
  return db!
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
    db = null
  }
}
