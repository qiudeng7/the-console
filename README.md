# The Console

需求如下：

1.  cloudflare serverless架构
2.  管理端发布和监控任务
3.  员工端执行并任务

---

技术特点：

1. 在 cloudflare-vite 项目实现类似nuxt/next的动态文件路由
   1. 难点在于在构建前后文件结构是不同的，运行时如何动态导入构建时的文件结构？细节参考[myRouter/readme](./server/utils/myRouter/readme.md)
   2. TODO: `[buildTimeModulePath]`到`[dynamicRoutes]`的转化只需要在构建期执行一次，但是在目前的实现中由于serverless的特点，每次request都会执行一次，需要优化。但是serverless的运行方式似乎和我想的不一样，看起来不是进程级别的重启，参考 https://orm.drizzle.team/docs/perf-serverless 。
2. 在 cloudflare-vite 项目使用 drizzle ORM
   1. 难点在于理解 worker、drizzle-kit、drizzle-orm在开发环境和生产环境的行为方式。

## 设计

> cloudflare 免费额度只有 5G sqllite 和 10G 对象存储，对于图片或者pdf格式的任务资源很容易超过这个容量。
> 
> 1.  方案一：损失性能，价格最低
>     1.  用 openlist + 夸克网盘 或者 openlist + github加密分块，虽然需要二次网络IO但是很便宜。
>     2.  也可以用cloudflare的存储做缓存。
> 2.  方案二：花钱
>     1.  直接升级cloudflare计划，对象存储本身就不贵。

### 文件结构

文件结构总体上是一个vite-vue项目，但是多了一个server，是cloudlfare的后端项目，以下主要对cloudflare 后端的结构规范做说明

- `server/` 后端目录
  - `api/` 端点目录
  - `utils/` 工具目录，每个工具都有自己的readme供参考。
    - `myRotuer` 适用于 cloudflare vite 架构的动态文件路由
    - `response` 统一构造错误和成功响应
  - `index.ts` 导出cloudflare可识别的 serverless 后端模块

