import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

export async function handleMyRoute(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const requestPath = url.pathname;

    // 分割路径
    const segments = requestPath.split('/').filter(Boolean);

    // 只处理 /api 路由
    if (segments.length === 0 || segments[0] !== 'api') {
        return routerErrorResponse("路由必须以 '/api' 开头");
    }

    // 移除 'api' 前缀，获取实际的路由段
    const routeSegments = segments.slice(1);

    // 如果没有路由段，返回 404
    if (routeSegments.length === 0) {
        return routerErrorResponse('未指定具体的 API 路由');
    }

    // 根据请求查询路由处理器，动态处理器将被标记到params
    const apiDir = path.join(process.cwd(), 'server', 'api');
    let currentDir = apiDir;
    const params: Record<string, string> = {};

    for (let i = 0; i < routeSegments.length; i++) {
        const segment = routeSegments[i];

        // 1. 检查是否有精确匹配的目录
        const exactDirPath = path.join(currentDir, segment);
        if (existsSync(exactDirPath)) {
            currentDir = exactDirPath;
            continue;
        }

        // 2. 检查是否有精确匹配的文件
        const exactFilePath = path.join(currentDir, `${segment}.ts`);
        if (existsSync(exactFilePath)) {
            return await invokeMyHandler(exactFilePath, params, request, env, ctx);
        }

        // 3. 检查是否有动态路由目录 [param]
        const filesInDir = readdirSync(currentDir);
        const dynamicDir = filesInDir.find(file =>
            file.startsWith('[') && file.endsWith(']') && !file.includes('.ts')
        );

        if (dynamicDir) {
            const paramName = dynamicDir.slice(1, -1);
            params[paramName] = segment;
            currentDir = path.join(currentDir, dynamicDir);
            continue;
        }

        // 4. 检查是否有动态路由文件 [param].ts
        const dynamicFile = filesInDir.find(file =>
            file.startsWith('[') && file.endsWith('].ts')
        );

        if (dynamicFile) {
            const paramName = dynamicFile.slice(1, -3);
            params[paramName] = segment;
            return await invokeMyHandler(path.join(currentDir, dynamicFile), params, request, env, ctx);
        }

        // 5. 都没找到，返回错误
        return routerErrorResponse(`路由 '${requestPath}' 未找到`);
    }

    // 检查是否有 index.ts 文件
    const indexPath = path.join(currentDir, 'index.ts');
    if (existsSync(indexPath)) {
        return await invokeMyHandler(indexPath, params, request, env, ctx);
    }

    return routerErrorResponse(`路由 '${requestPath}' 未找到`);
}

async function invokeMyHandler(filePath: string, routerParams: Record<string, string>, request: Request, env: any, ctx: any): Promise<Response> {
    try {
        // 动态导入路由处理器
        const module = await import(filePath);
        const handler = module.default;

        if (typeof handler !== 'function') {
            throw new Error('路由处理器必须导出一个默认函数');
        }

        // 创建带有 params 的增强 request 对象
        const enhancedRequest = Object.create(request);
        enhancedRequest.params = routerParams;

        return handler(enhancedRequest, env, ctx);
    } catch (error) {
        console.error('路由导入错误:', error);
        return new Response(JSON.stringify({ error: '路由处理器加载失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export type MyHandlerParams = {
    request: Request,
    routerParams: Record<string, string>,
    env: Env,
    ctx: ExecutionContext,
}

export function defineMyHandler(
    myHandler: (myHandlerParams: MyHandlerParams) => Response
) {
    // 为所有handler包装异常处理
    return function errorWrapper(myHandlerParams: MyHandlerParams) {
        try {
            myHandler(myHandlerParams)
        } catch (e) {
            const errorMessage = `myHandler error: ${e}`
            const body = JSON.stringify({
                error: errorMessage
            })
            return new Response(body, {
                status: 500,
                statusText: errorMessage,
                headers: { 'Content-Type': 'application/json' }
            })
        }
    }
}

function routerErrorResponse(msg: string) {
    return new Response(JSON.stringify({ error: msg }), {
        status: 404,
        statusText: `router error: ${msg}`,
        headers: { 'Content-Type': 'application/json' }
    });
}