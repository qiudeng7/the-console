# The Console

需求如下：

1.  cloudflare serverless架构
2.  管理端发布和监控任务
3.  员工端执行并任务


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

