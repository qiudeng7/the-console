// TODO: 添加drizzle-zod
// TODO: serverless 查询优化 https://orm.drizzle.team/docs/perf-serverless
import { drizzle } from "drizzle-orm/d1";


/**
 * drizzleClient 基本使用参考 https://orm.drizzle.team/docs/data-querying
 * 
 * 环境变量 `THE_CONSOLE_CLOUDFLARE_D1_BINDING_NAME` 要填写wrangler.jsonc中的 d1_databases[*].binding
 * 
 * 这里要用双重断言没研究明白为什么，但是这个用法是符合官方预期的，因为官方示例也作了一些类型操作直接把 string 断言成 D1Database
 * 参考 https://orm.drizzle.team/docs/connect-cloudflare-d1#step-2---initialize-the-driver-and-make-a-query
 */
export const db = drizzle(process.env.THE_CONSOLE_CLOUDFLARE_D1_BINDING_NAME! as unknown as D1Database);
