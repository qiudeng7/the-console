# The Console - 任务管理系统

基于 Nuxt 4 + MySQL 8.0 的任务管理系统，采用队列架构和乐观锁机制实现多实例部署。

原serverless架构项目: https://github.com/qiudeng7/deprecated-the-console-serverless


## 技术栈

### 前端
- **Nuxt 4** - Vue 3 全栈框架
- **Tailwind CSS** - UI 样式框架
- **Pinia** - 状态管理
- **JWT** - 用户认证

### 后端
- **Nitro** - Nuxt 服务端引擎
- **MySQL 8.0** - 关系型数据库
- **Drizzle ORM** - 数据库 ORM
- **自定义队列服务** - 任务队列处理

### 部署
- **Docker Compose** - 容器编排
- **Caddy** - 反向代理和负载均衡

## 架构设计

### 整体架构

```
                    ┌─────────────┐
                    │   Caddy    │
                    │  (端口 80)  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────▼─────┐           ┌──────▼──────┐
        │  App-1    │           │   App-2     │
        │ (端口3000) │           │  (端口3000) │
        └─────┬─────┘           └──────┬──────┘
              │                         │
              └────────────┬────────────┘
                           │
                  ┌────────▼─────────┐
                  │  Queue Service   │
                  │   (端口 4000)    │
                  └────────┬─────────┘
                           │
                    ┌───────▼────────┐
                    │  MySQL 8.0     │
                    │  (端口 3306)   │
                    └────────────────┘
```

### 核心特性

#### 1. 队列服务架构
- **单实例队列服务**：避免并发冲突
- **HTTP API 调用**：App 通过 HTTP 调用队列服务
- **批量处理**：每批 10 个任务或 100ms 刷新间隔
- **自动重试**：失败任务自动重试（最多 3 次，指数退避）

#### 2. 乐观锁机制
- **User 表**：`version` 字段防止并发修改冲突
- **Task 表**：`version` 字段实现乐观锁
- **自动冲突检测**：版本不匹配时返回 409 错误

#### 3. 多实例部署
- **2 个 App 实例**：通过 Caddy 负载均衡
- **1 个 Queue 实例**：集中处理任务队列
- **数据库连接池**：每个实例维护独立的数据库连接池

## 项目结构

```
the-console/
├── app/                      # Nuxt 应用（前端 + API）
│   ├── app/                  # 前端页面和组件
│   │   ├── middleware/       # Nuxt 中间件
│   │   ├── pages/           # 页面路由
│   │   └── stores/          # Pinia 状态管理
│   └── server/              # 服务端代码
│       ├── api/            # API 路由
│       │   ├── auth/       # 认证相关 API
│       │   ├── tasks/      # 任务相关 API
│       │   └── users/      # 用户相关 API
│       ├── database/       # 数据库相关
│       │   ├── db.ts       # 数据库连接
│       │   ├── schema.ts   # 数据模型
│       │   └── migrations/ # 数据库迁移
│       └── utils/          # 工具函数
│
├── queue/                   # 队列服务（独立服务）
│   ├── server/
│   │   ├── api/            # Nitro API 路由
│   │   │   ├── health.get.ts
│   │   │   └── queue/
│   │   │       ├── status.get.ts
│   │   │       └── job.post.ts
│   │   ├── database/       # 数据库相关
│   │   └── task-queue.ts   # 队列核心逻辑
│   └── nuxt.config.ts
│
├── compose.yaml            # Docker Compose 配置
├── Caddyfile              # Caddy 反向代理配置
├── Dockerfile             # Docker 镜像构建
└── README.md              # 项目文档
```

## API 文档

### 队列服务 API

#### 1. 健康检查
```
GET /api/health
```

**响应：**
```json
{
  "status": "ok"
}
```

#### 2. 队列状态
```
GET /api/queue/status
```

**响应：**
```json
{
  "success": true,
  "data": {
    "queueLength": 0,
    "processing": false
  }
}
```

#### 3. 提交任务
```
POST /api/queue/job
Content-Type: application/json

{
  "type": "create-task | update-task | delete-task",
  "data": {
    // 任务类型相关数据
  }
}
```

### 应用 API

#### 1. 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "admin",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

#### 2. 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 3. 创建任务
```
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "任务标题",
  "category": "开发",
  "tag": "前端",
  "description": "任务描述",
  "status": "todo",
  "assignedToUserId": 2
}
```

#### 4. 更新任务
```
PATCH /api/tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "新标题",
  "status": "in-progress"
}
```

**乐观锁冲突响应：**
```json
{
  "error": true,
  "statusCode": 409,
  "message": "任务已被其他人修改，请刷新后重试"
}
```

#### 5. 删除任务
```
DELETE /api/tasks/{id}
Authorization: Bearer {token}
```

## 数据库设计

### User 表
```sql
CREATE TABLE user_table (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  version INT NOT NULL DEFAULT 1,        -- 乐观锁版本号
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deletedAt DATETIME(3)
);
```

### Task 表
```sql
CREATE TABLE task_table (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  tag VARCHAR(50),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo',
  createdByUserId INT NOT NULL,
  assignedToUserId INT,
  version INT NOT NULL DEFAULT 1,        -- 乐观锁版本号
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deletedAt DATETIME(3),
  FOREIGN KEY (createdByUserId) REFERENCES user_table(id),
  FOREIGN KEY (assignedToUserId) REFERENCES user_table(id)
);
```

## 部署指南

### 前置要求
- Docker 和 Docker Compose
- Git

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd the-console
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的变量
```

3. **启动服务**
```bash
docker compose up -d
```

4. **运行数据库迁移**
```bash
cd app
DATABASE_URL="mysql://root:root_password@localhost:3306/the_console" npx drizzle-kit migrate
```

5. **访问应用**
- 应用地址：http://localhost
- 队列服务健康检查：http://localhost:4000/api/health

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Caddy | 80 | 反向代理 |
| App-1 | 3000 | 应用实例 1 |
| App-2 | 3000 | 应用实例 2 |
| Queue | 4000 | 队列服务 |
| MySQL | 3306 | 数据库 |

### 环境变量

```bash
# 数据库配置
DATABASE_URL=mysql://root:root_password@localhost:3306/the_console

# JWT 密钥
JWT_SECRET=your-secret-key-change-in-production

# 队列服务地址
QUEUE_SERVICE_URL=http://queue:4000
```

## 开发指南

### 本地开发

**启动 App 服务：**
```bash
cd app
pnpm install
pnpm dev
# 访问 http://localhost:3000
```

**启动 Queue 服务：**
```bash
cd queue
pnpm install
pnpm dev
# 访问 http://localhost:4000
```

### 数据库操作

**生成迁移：**
```bash
cd app
npx drizzle-kit generate
```

**执行迁移：**
```bash
npx drizzle-kit migrate
```

**查看数据库：**
```bash
docker exec -it the-console-mysql mysql -uroot -proot_password the_console
```

## 故障排查

### 常见问题

#### 1. 队列服务返回 404
**原因**：Nuxt 文件路由映射问题
**解决**：确保使用 `/api/queue/job` 而不是 `/queue/job`

#### 2. API 请求被重定向到登录页
**原因**：auth 中间件拦截了 API 请求
**解决**：检查 `app/app/middleware/auth.global.ts` 是否跳过 `/api/*` 路径

#### 3. 队列服务创建任务失败
**原因**：MySQL Drizzle 不支持 `.returning()`
**解决**：使用 `insertId` 重新查询插入的记录

#### 4. 乐观锁冲突
**现象**：返回 409 错误
**解决**：刷新页面重新获取数据，再次提交修改

### 日志查看

**查看 App 日志：**
```bash
docker logs the-console-app-1 -f
docker logs the-console-app-2 -f
```

**查看 Queue 日志：**
```bash
docker logs the-console-queue -f
```

**查看 MySQL 日志：**
```bash
docker logs the-console-mysql -f
```

## 性能优化

### 队列服务
- **批量处理**：每批 10 个任务或 100ms 刷新间隔
- **连接池**：MySQL 连接限制为 10
- **指数退避**：失败任务重试延迟为 2^n * 100ms

### 应用服务
- **多实例**：2 个 App 实例负载均衡
- **数据库连接池**：每个实例独立连接池
- **乐观锁**：减少数据库锁竞争

## 安全考虑

1. **密码存储**：当前使用明文密码（仅用于演示，生产环境需加密）
2. **JWT 认证**：Token 有效期 7 天
3. **角色权限**：
   - `admin`：管理员，可以创建任务
   - `employee`：普通用户，只能查看和修改分配给自己的任务
4. **CORS**：生产环境需配置正确的 CORS 策略

## 未来改进

- [ ] 密码加密（bcrypt）
- [ ] API 文档自动生成（OpenAPI）
- [ ] 单元测试和集成测试
- [ ] CI/CD 流水线
- [ ] 监控和日志聚合
- [ ] 任务优先级队列
- [ ] WebSocket 实时通知

## 许可证

MIT License
