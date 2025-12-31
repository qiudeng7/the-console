import type { Config } from 'drizzle-kit'

export default {
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './database.sqlite'
  }
} satisfies Config
