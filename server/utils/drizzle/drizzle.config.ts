import { defineConfig } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

/**
 * 此处应填写相对package.json的相对路径
 * schema、migrations 应该放在这个目录下，不应该与utils放在一起。
 * 结尾不需要路径分隔符 `/`
 */
const databaseDir = "server/database"

export default defineConfig({
    dialect: "sqlite",
    schema: `${databaseDir}/schema.ts`,
    out: `${databaseDir}/migrations`,
    ...(process.env.NODE_ENV === "production" ? {
        driver: 'd1-http',
        dbCredentials: {
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
            token: process.env.CLOUDFLARE_TOKEN!,
        }
    } : {
        url: getLocalD1DB()
    })
});

/**
 * 获取开发环境wrangler创建的sqlite数据库地址。
 */
function getLocalD1DB() {
  try {
    const basePath = path.resolve(".wrangler");
    const dbFile = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .find((f) => f.endsWith(".sqlite"));

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}`);
    }

    const url = path.resolve(basePath, dbFile);
    return url;
  } catch (err) {
    console.log(`Error  ${err}`);
  }
}