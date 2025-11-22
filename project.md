## 📄 文档二：ZaiHub 初期搭建实施指南

### 阶段 0: 环境准备

- **本地开发**：Node.js 20+, pnpm (`npm i -g pnpm`), Docker (用于跑本地 PG/Redis，或者直接连宝塔数据库)。
    
- **服务器 (宝塔)**：安装 PM2 管理器, Nginx, PostgreSQL 16, Redis 7。
    

### 阶段 1: Monorepo 初始化

在终端执行以下命令：

Bash

```
# 1. 创建项目目录
mkdir zaihub && cd zaihub
pnpm init

# 2. 创建工作区配置
echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# 3. 安装 Turbo 和 TypeScript
pnpm add turbo typescript -D -w

# 4. 初始化目录结构
mkdir apps packages
```

### 阶段 2: 搭建数据库层 (@zaihub/database)

Bash

```
mkdir -p packages/database && cd packages/database
pnpm init
# 修改 package.json name 为 "@zaihub/database"
pnpm add prisma -D
pnpm add @prisma/client
npx prisma init
# (后续使用文档三的 Prompt 填充 schema.prisma)
```

### 阶段 3: 初始化后端 API

Bash

```
cd ../../apps
npx @nestjs/cli new api --package-manager pnpm
cd api
# 安装核心依赖
pnpm add @nestjs/config @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt class-validator class-transformer ai @ai-sdk/openai
# 引入内部包
pnpm add @zaihub/database --workspace
```

### 阶段 4: 初始化前端 Web

Bash

```
cd ..
npx create-next-app@latest web --typescript --tailwind --eslint
cd web
# 安装 UI 和 AI 依赖
pnpm add ai lucide-react clsx tailwind-merge
pnpm add @zaihub/database --workspace
# 初始化 shadcn (按提示选择默认即可)
npx shadcn@latest init
```

### 阶段 5: 联调启动

在根目录 `package.json` 添加：

JSON

```
"scripts": {
  "dev": "turbo run dev",
  "build": "turbo run build",
  "db:push": "turbo run db:push"
}
```

运行 `pnpm dev`，ZaiHub 将在本地启动。

---

## 📄 文档三：ZaiHub AI 辅助开发提示词 (Prompt List)

请按顺序将以下提示词投喂给你的 AI 编辑器（Cursor/Windsurf），即可自动生成代码。

#### 任务 1: 数据库建模 (Database)

**Prompt:**

> 我正在构建 Monorepo 项目 "ZaiHub"。请在 `packages/database` 目录下工作。
> 
> 1. 修改 `package.json`，name 设为 `@zaihub/database`，并导出 PrismaClient。
>     
> 2. 编辑 `prisma/schema.prisma`，使用 PostgreSQL。
>     
>     - **User**: id(uuid), email(unique), password(string), nickname(string?), role(default 'user'), createdAt.
>         
>     - **Chat**: id(uuid), userId(fk), messages(Json type - 存储 Vercel AI SDK 消息), createdAt, updatedAt.
>         
> 3. 生成一个 `src/index.ts`，导出单例 `PrismaService` 或 `PrismaClient` 实例，防止连接数过多。
>     

#### 任务 2: 后端鉴权模块 (API Auth)

**Prompt:**

> 切换到 `apps/api`。我要实现 ZaiHub 的基础鉴权。
> 
> 1. 创建 `src/prisma/prisma.service.ts`，继承自 `@zaihub/database` 的 Client。
>     
> 2. 实现 `AuthModule` (基于 JWT + Passport-Local)。
>     
>     - `auth.service.ts`: 包含 `validateUser(email, pass)` 和 `login(user)`。使用 bcrypt 比对密码。
>         
>     - `jwt.strategy.ts`: 提取 Bearer Token 并验证。
>         
>     - `auth.controller.ts`: 提供 POST `/auth/login` 和 `/auth/register`。
>         
> 3. 注册到 AppModule。
>     

#### 任务 3: 后端 AI 模块 (API Core)

**Prompt:**

> 在 `apps/api` 中实现 AI 对话功能。
> 
> 1. 创建 `AiModule` 和 `AiController`。
>     
> 2. 引入 `ai` (Vercel AI SDK) 和 `@ai-sdk/openai`。
>     
> 3. 实现 POST `/ai/chat` 接口：
>     
>     - 使用 `@UseGuards(AuthGuard('jwt'))` 保护接口。
>         
>     - 从 Body 获取 `messages` 数组。
>         
>     - 使用 `streamText` 调用模型 (gpt-4o 或 gpt-3.5-turbo)。
>         
>     - 使用 pipeDataStreamToResponse 将结果流式返回给 Response。
>         
>         注意：确保正确处理了 Node.js 的 ServerResponse 对象。
>         

#### 任务 4: 前端聊天 UI (Web)

**Prompt:**

> 切换到 `apps/web` (Next.js App Router)。
> 
> 1. 确保已安装 shadcn 的 `Button`, `Input`, `Card`, `ScrollArea`, `Avatar` 组件。
>     
> 2. 配置 `next.config.js` 的 rewrite 规则，将 `/api/:path*` 代理到后端端口。
>     
> 3. 修改 `app/page.tsx` 实现 ZaiHub 聊天主界面：
>     
>     - 使用 `useChat` hook 连接 `/api/ai/chat`。
>         
>     - 在 headers 中带上 localStorage 里的 token。
>         
>     - 界面布局：左侧/顶部是 ZaiHub Logo，中间是聊天区域（User 右侧蓝泡泡，AI 左侧白泡泡），底部是输入框。
>         
>     - 如果未登录（无 token），显示一个简单的登录遮罩或跳转到 `/login`。
>         

#### 任务 5: 宝塔部署配置

**Prompt:**

> 我要将 ZaiHub 部署到宝塔面板。
> 
> 1. 请给出 `apps/api` 的构建命令和 `apps/web` (standalone 模式) 的构建配置。
>     
> 2. 请给出一个 `ecosystem.config.js` (PM2 配置)，用于在宝塔上同时启动这两个服务。
>     
>     - API 运行在 3000 端口。
>         
>     - Web 运行在 3001 端口。
>         
> 3. 请给出 Nginx 的配置片段，展示如何配置 `server` 块，让 `api.zaihub.com` 指向 3000，`zaihub.com` 指向 3001。
>     

---

**祝你的 ZaiHub 开发顺利！** 如果中间遇到报错，随时把错误信息发给我，我们继续微调。