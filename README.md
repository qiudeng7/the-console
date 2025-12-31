# The Console - 任务管理系统

基于 Nuxt 4 + Drizzle ORM + SQLite 构建的任务管理系统，支持管理员和员工角色权限管理。

## 功能特性

- 用户认证（JWT）
- 角色权限管理（Admin/Employee）
- 任务 CRUD 操作
- 任务状态管理
- 任务搜索和过滤
- 响应式 UI（Tailwind CSS）
- **暗色模式支持** - 支持浅色/深色主题切换，自动保存用户偏好

## 技术栈

- **前端**: Vue 3, Nuxt 4, Tailwind CSS
- **后端**: Nuxt Server API
- **数据库**: SQLite + Drizzle ORM
- **状态管理**: Pinia
- **认证**: JWT (jsonwebtoken)
- **UI 主题**: @nuxtjs/color-mode (暗色模式支持)

## 安装

```bash
# 安装依赖
pnpm install

# 复制环境变量配置
cp .env.example .env

# 初始化数据库
pnpm db:push
```

## 开发

```bash
# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 数据库管理

```bash
# 生成迁移文件
pnpm db:generate

# 推送 schema 到数据库
pnpm db:push

# 打开数据库管理界面
pnpm db:studio
```

## 用户角色

### Admin（管理员）
- 创建、编辑、删除任务
- 分配任务给员工
- 查看任务统计
- 管理用户

### Employee（员工）
- 查看分配的任务
- 查看任务详情
- 更新任务状态

## 默认设置

- 第一个注册的用户自动成为管理员
- JWT Token 有效期：7 天
- 数据库文件：`./database.sqlite`
- **主题模式**: 默认跟随系统，支持手动切换浅色/深色模式

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 任务管理
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务（仅管理员）
- `GET /api/tasks/:id` - 获取任务详情
- `PATCH /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务
- `GET /api/tasks/stats` - 获取任务统计（仅管理员）

## 项目结构

```
├── app/                 # Nuxt app 目录
│   ├── layouts/        # 布局组件
│   │   ├── admin.vue   # 管理员布局（含暗色模式切换）
│   │   └── employee.vue # 员工布局（含暗色模式支持）
│   ├── pages/          # 页面组件
│   │   ├── admin/      # 管理员页面
│   │   │   ├── dashboard.vue  # 仪表盘（支持暗色模式）
│   │   │   ├── tasks/        # 任务管理（支持暗色模式）
│   │   │   └── apps.vue      # 应用管理（支持暗色模式）
│   │   ├── employee/   # 员工页面
│   │   │   └── tasks/        # 员工任务（支持暗色模式）
│   │   ├── login.vue   # 登录页（含暗色模式切换）
│   │   └── register.vue # 注册页
│   └── stores/         # Pinia stores
├── server/             # 服务端代码
│   ├── api/           # API 端点
│   ├── database/      # 数据库相关
│   └── utils/         # 工具函数
├── types/             # TypeScript 类型定义
├── tailwind.config.js # Tailwind CSS 配置（class 模式暗色支持）
└── nuxt.config.ts     # Nuxt 配置（含 color-mode 模块配置）
```

## 暗色模式实现

项目使用 `@nuxtjs/color-mode` 模块实现完整的暗色模式支持：

### 特性
- **自动检测**: 默认跟随系统主题设置
- **手动切换**: 通过页面上的切换按钮在浅色/深色模式间切换
- **持久化**: 用户选择的主题偏好会保存在 localStorage 中
- **全局适配**: 所有页面、组件、表单、表格和模态框均已适配暗色模式

### 样式规范
- 背景色: `bg-white dark:bg-gray-800`
- 文本色: `text-gray-900 dark:text-white`
- 边框色: `border-gray-200 dark:border-gray-700`
- 输入框: `dark:bg-gray-700 dark:text-white dark:border-gray-600`
- 表格表头: `bg-gray-50 dark:bg-gray-700`

## 构建

```bash
# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

## License

MIT
