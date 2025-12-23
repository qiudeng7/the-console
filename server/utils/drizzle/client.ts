// TODO: 添加drizzle-zod
// TODO: serverless 查询优化 https://orm.drizzle.team/docs/perf-serverless
import 'dotenv/config'
import { drizzle } from "drizzle-orm/d1";


export function getDrizzleClient(cloudflareEnv: Env) {
    // @ts-ignore
    const d1Database: D1Database = cloudflareEnv.the_console
    return drizzle(d1Database)
}