import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!db) {
    const databasePath = useRuntimeConfig().databasePath
    const sqlite = new Database(databasePath)
    db = drizzle(sqlite, { schema })
  }
  return db
}
