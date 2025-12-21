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

#### 简单路由
```typescript
// server/api/users.ts
// 将会命中 /api/users 
import { defineMyHandler } from '../utils/myRouter';

export default defineMyHandler(({ request, routerParams }) => {
    return new Response(JSON.stringify({ users: ['Alice', 'Bob'] }));
});
```

#### 动态参数路由
```typescript
// server/api/[id].ts
import { defineMyHandler } from '../utils/myRouter';

export default defineMyHandler(({ request, routerParams }) => {
    const { id } = routerParams;
    return new Response(JSON.stringify({ id, name: `User ${id}` }));
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


## 最佳实践

```typescript
export default defineMyHandler(({ request, routerParams }) => {
    switch (request.method) {
        case 'GET':
            return handleGet(routerParams);
        case 'POST':
            return handlePost(await request.json());
        default:
            return new Response('Method Not Allowed', { status: 405 });
    }
});
```