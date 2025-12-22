import { defineConfig } from "drizzle-kit";

/**  
 * 此处应填写相对package.json的相对路径
 * sqlite数据库、schema、migrations应该放在这个目录下，不应该与utils放在一起。
 * 结尾不需要路径分隔符 `/`
*/
const databaseDir = "server/database"


/**
 * 没事别改。
 */
export const devDataBaseFileConnectionURL = `file:${databaseDir}/dev-sqlite3.db`
export default defineConfig({
    dialect: "sqlite",
    schema: `${databaseDir}/schema.ts`,
    out: `${databaseDir}/migrations`,
    dbCredentials: {
        url: devDataBaseFileConnectionURL,
    },
});

// {
//     driver: "d1-http",
//         dbCredentials: {
//         accountId: process.env.THE_CONSOLE_CLOUDFLARE_ACCOUNT_ID,
//             databaseId: "be153bd7-f82e-4f55-921b-cae4377ce9b5",
//                 token: process.env.THE_CONSOLE_CLOUDFLARE_API_TOKEN,
//         },
// }