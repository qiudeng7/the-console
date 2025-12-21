import { type RouteModule, buildRoutes } from "./buildRoutes";
import { createErrorResponse } from "../response";
export { defineMyHandler } from "./defineMyHandler"
import { ifPathContainsDoNothingList } from "./config";

/**
 * 处理 HTTP 请求并根据预构建的路由注册表路由到相应的处理器
 *
 * 支持的路由模式：
 * - 精确匹配：/api/users → server/api/users.ts
 * - 动态参数：/api/123 → server/api/[id].ts (params: { id: "123" })
 * - 嵌套路由：/api/users/456/posts → server/api/users/[id]/posts.ts
 * - 索引路由：/api/users/ → server/api/users/index.ts
 *
 * @param request - HTTP 请求对象
 * @param env - Cloudflare Workers 环境变量
 * @param ctx - Cloudflare Workers 执行上下文
 * @returns Promise<Response> - HTTP 响应
 */
export async function handleMyRoute(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const requestPath = url.pathname;

    // 对于某些路径，空响应
    for (const item of ifPathContainsDoNothingList) {
        if (requestPath.includes(item))
            return Response.json({})
    }

    // 只处理 /api 路由
    if (!requestPath.startsWith('/api/')) {
        return createErrorResponse({
            message: "路由必须以 '/api' 开头"
        });
    }

    // 匹配已定义路由和实际请求的资源路径
    let match: { handler: () => Promise<RouteModule>, params: Record<string, string> } | null = null;

    // 从import.meta.glob模块路径中构建路由
    // TODO 从modulePath到routes的构建步骤在每一次请求都会运行，虽然只是字符串处理不太影响性能，但最好还是能优化到vite构建期
    const routes = buildRoutes()

    for (const route of routes) {
        const routeSegments = route.path.split('/').filter(Boolean);
        const requestSegments = requestPath.split('/').filter(Boolean);

        // 路径段数必须相等
        if (routeSegments.length !== requestSegments.length) {
            continue;
        }

        const params: Record<string, string> = {};
        let isMatch = true;

        // 逐段匹配路径
        for (let i = 0; i < routeSegments.length; i++) {
            const routeSegment = routeSegments[i];
            const requestSegment = requestSegments[i];

            if (routeSegment.startsWith(':')) {
                // 动态参数匹配，提取参数名和值
                const paramName = routeSegment.slice(1);
                params[paramName] = requestSegment;
            } else if (routeSegment !== requestSegment) {
                // 静态路径不匹配
                isMatch = false;
                break;
            }
        }

        if (isMatch) {
            match = {
                handler: route.handler,
                params
            };
            break;
        }
    }

    if (!match) {
        return createErrorResponse({
            message: `路由 '${requestPath}' 未找到`
        });
    }

    // 调用handler
    try {
        // 使用 Vite 预构建的模块加载器动态导入处理器
        const module = await match.handler();
        const handler = module.default;

        if (typeof handler !== 'function') {
            throw new Error('路由处理器必须导出一个默认函数');
        }

        // 创建带有 params 的增强 request 对象
        const enhancedRequest = Object.create(request);
        enhancedRequest.params = match.params;

        // 使用 defineMyHandler 包装的函数格式
        return handler({ request: enhancedRequest, routerParams: match.params, env, ctx });
    } catch (error) {
        console.error('路由导入错误:', error);
        return createErrorResponse('路由处理器加载失败')
    }
}