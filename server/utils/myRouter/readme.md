# MyRouter - 动态文件路由

类似 nuxt/next 的动态文件路由，为 cloudflare vite 设计。

## 快速开始

### 1. 入口文件

```typescript
// server/index.ts
import { handleMyRoute } from './utils/myRouter';

export default {
    fetch: handleMyRoute
} satisfies ExportedHandler<Env>;
```

### 2. 创建路由

```typescript
// server/api/[id].ts
import { defineMyHandler } from '../utils/myRouter';
import { createSuccessResponse } from '../utils/response';

export default defineMyHandler(({ request, routerParams }) => {
    const { id } = routerParams;
    return createSuccessResponse({ id, name: `User ${id}` });
});
```

### handler参数

```typescript
type MyHandlerParams = {
    request: Request,                    // HTTP 请求
    routerParams: Record<string, string>, // 动态路由参数 { id: "123" }
    env: Env,                           // 原始的Cloudflare env
    ctx: ExecutionContext               // 原始的cloudflare context
}
```

## 路由匹配

支持的路由模式：

- 精确匹配：`/api/users` =>
  - `server/api/users.ts`
- 动态参数：`/api/123` =>
  - `server/api/[id].ts (params: { id: "123" })`
- 嵌套路由：`/api/users/456/posts` =>
  - `server/api/users/[id]/posts.ts`
- 索引路由：`/api/users/` =>
  - `server/api/users/index.ts`


## 3. 配置说明

### 路径过滤配置

```typescript
// server/utils/myRouter/config.ts
export const ifPathContainsDoNothingList: string[] = [
    "/.well-known/"  // 对于这些路径，路由不做任何响应，直接返回空 JSON
];
```

### 统一响应格式

路由系统使用 `@server/utils/response` 提供的统一响应工具：

- `createSuccessResponse(data)` - 创建成功响应
- `createErrorResponse(message, options?)` - 创建错误响应

## 最佳实践

```typescript
import { defineMyHandler } from '../utils/myRouter';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export default defineMyHandler(({ request, routerParams }) => {
    switch (request.method) {
        case 'GET':
            return createSuccessResponse(handleGet(routerParams));
        case 'POST':
            try {
                const data = await request.json();
                return createSuccessResponse(handlePost(data));
            } catch (error) {
                return createErrorResponse('Invalid JSON data', { status: 400 });
            }
        default:
            return createErrorResponse('Method Not Allowed', { status: 405 });
    }
});
```