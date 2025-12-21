import { defineMyHandler } from "./defineMyHandler";

/**
 * 定义路由模块的默认导出
 */
export interface RouteModule {
    default: ReturnType<typeof defineMyHandler>;
}


/**
 * 使用 Vite 的 import.meta.glob，我们将会在运行时得到如下映射对象： { 构建时的位置: 运行时的实际函数 }
 * 从而可以在运行时动态导入构建时的模块，一个实际的例子是：
 * {
 *   './api/[id].ts': [Function: ./api/[id].ts],
 *   './api/hello.ts': [Function: ./api/hello.ts],
 *   './api/users/[id].ts': [Function: ./api/users/[id].ts]
 * }
 */
const apiModules = import.meta.glob<RouteModule>('./api/**/*.ts');

/**
 * 构建路由数组，将 Vite glob 收集的文件路径转换为运行时可用的路由配置
 *
 *
 * 路径转换示例：
 * - './api/[id].ts' → '/api/:id' (动态参数路由)
 * - './api/hello.ts' → '/api/hello' (静态路由)
 * - './api/users/[id].ts' → '/api/users/:id' (嵌套动态路由)
 * - './api/users/index.ts' → '/api/users' (索引路由)
 *
 * 构建结果示例：
 * [
 *   { path: '/api/users/:id', handler: () => import('./api/users/[id].ts') },
 *   { path: '/api/hello', handler: () => import('./api/hello.ts') },
 *   { path: '/api/:id', handler: () => import('./api/[id].ts') }
 * ]
 */
export function buildRoutes() {
    const routes: Array<{
        path: string;
        handler: () => Promise<RouteModule>;
    }> = [];

    for (const [filePath, moduleLoader] of Object.entries(apiModules)) {
        // 直接在这里处理路径转换
        const routePath = filePath
            .replace(/^\.\//, '')            // 移除开头的 ./
            .replace(/\.ts$/, '')           // 移除 .ts 后缀
            .replace(/\[([^\]]+)\]/g, ':$1') // [id] → :id
            .replace(/\/index$/, '');        // 移除 /index 后缀

        const normalizedPath = '/' + (routePath || '');

        routes.push({
            path: normalizedPath,
            handler: moduleLoader
        });
    }

    // 按路径长度降序排列，确保更具体的路由优先匹配
    // 例如：/api/users/:id 会排在 /api/:id 前面
    routes.sort((a, b) => b.path.split('/').length - a.path.split('/').length);
    return routes;
}