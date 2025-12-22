import "dotenv/config"
import { defineConfig } from "drizzle-kit";
import { databaseDir } from "./config-dev"

/**
 * 生产环境数据库配置，使用cloudflare d1数据库
 * 
 * 命令:
 *      - 创建migrations: `pnpm makemigrations`
 *      - 迁移到生产环境d1数据库: `pnpm migrate:prod`
 *      - 创建新的d1数据库并添加到wrangler.jsonc:  `pnpm wrangler d1 create [database name] --update-config`
 * 
 * 基本使用:
 *      1. 使用上面的命令创建d1数据库
 *      2. 按照 .env.example 填写 THE_CONSOLE_CLOUDFLARE_ACCOUNT_ID、THE_CONSOLE_CLOUDFLARE_DATABASE_ID、THE_CONSOLE_CLOUDFLARE_TOKEN
 *      3. 使用上面的命令迁移数据库
 *      4. 就可以对d1数据库进行查询了。
 */


/**
 * 没事别改。
 * 参考 
 *      1. 一个使用drizzle的cloudflare项目 https://github.com/supermemoryai/cloudflare-saas-stack/blob/main/drizzle.config.ts
 *      2. drizzle官方的d1文档 https://orm.drizzle.team/docs/connect-cloudflare-d1
 * 
 * 踩坑:
 *      drizzle的cloudflare driver是通过cloudlfare的开发者API访问的
 *      但是cloudflare的 worker文档推荐是直接在env中访问绑定数据库，但是这种方法只能手写sql
 *      这会让人有点混淆，drizzle没有专门对worker的独有API提供driver，用的是更通用的HTTP API。
 */
export default defineConfig({
    dialect: "sqlite",
    schema: `${databaseDir}/schema.ts`,
    out: `${databaseDir}/migrations`,
    driver: 'd1-http',
    dbCredentials: {
        accountId: process.env.THE_CONSOLE_CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.THE_CONSOLE_CLOUDFLARE_DATABASE_ID!,
        token: process.env.THE_CONSOLE_CLOUDFLARE_TOKEN!,
    }
});