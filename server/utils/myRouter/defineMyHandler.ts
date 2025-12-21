import { error } from "console"
import { createErrorResponse } from "../response"

/**
 * 创建自定义路由处理器，统一包装异常处理。
 *
 * 使用示例：
 * ```typescript
 * export default defineMyHandler(({ request, routerParams, env, ctx }) => {
 *   const { id } = routerParams;
 *   return createSuccessResponse({ id })
 * });
 * ```
 *
 * @param myHandler - 用户定义的路由处理函数
 * @returns 包装后的处理函数，包含统一的错误处理逻辑
 */
export function defineMyHandler(
    myHandler: (myHandlerParams: {
        /** HTTP 请求对象，包含 params 属性用于访问路由参数 */
        request: Request,
        /** 从 URL 路径中提取的路由参数，如 { id: "123" } */
        routerParams: Record<string, string>,
        /** Cloudflare Workers 环境变量 */
        env: Env,
        /** Cloudflare Workers 执行上下文 */
        ctx: ExecutionContext,
    }) => Response
) {
    // 为所有handler包装异常处理
    return function errorWrapper(myHandlerParams: any) {
        try {
            return myHandler(myHandlerParams)
        } catch (e) {
            const errorMessage = `myHandler error: ${e}`
            const body = JSON.stringify({
                error: errorMessage
            })

            return createErrorResponse({
                message: errorMessage,
                options: { status: 500 }
            })
        }
    }
}