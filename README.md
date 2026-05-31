<div align="center">

# ZaiHub

**多窗口AI聊天平台** - 支持多模型并行对话的智能聊天应用

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/next.js-16-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E11.0-red.svg)](https://nestjs.com/)

</div>

ZaiHub 是一个面向开发者的多模型 AI 对比工作台。它支持在同一会话中并行请求 1-3 个模型，实时对比回答，并将会话、消息和每次模型调用结果持久化。

当前版本已经覆盖聊天工作台的基础闭环：认证、模型配置、SSE 流式响应、会话历史、模型密钥加密存储和管理员权限。评测集、成本统计和回答评分仍在规划中。

## 功能概览

### 多模型聊天

- 支持 1-3 个聊天窗口并行请求不同模型。
- 每个窗口独立展示加载、流式输出、成功和失败状态。
- 单个模型失败不会阻塞其他窗口。
- 失败窗口支持独立重试，并复用当前会话。
- Markdown、GFM 表格和代码高亮渲染。

### 会话历史

- 新建、切换、删除和重命名会话。
- 首条问题自动生成会话标题。
- 历史列表使用 cursor 分页，默认每页 20 条。
- 会话侧边栏支持收起和展开。
- 同一轮问题发送给多个模型时，用户消息只保存一次。

### 模型管理与安全

- 管理员可以新增、编辑和删除模型配置。
- 普通用户只能读取启用模型的安全摘要。
- 模型 API Key 使用 AES-256-GCM 加密存储。
- 管理接口仅返回 masked key。
- 编辑模型时 API Key 留空表示不修改。
- 用户角色以数据库为准，后端每次鉴权都会读取当前角色。

### 服务保护

- JWT + Passport 鉴权。
- 单用户最多 3 个并发 AI 请求。
- 单用户每分钟最多 30 个 AI 请求。
- 上游模型请求默认 20 秒超时。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| Web | Next.js 16、React 19、Tailwind CSS、Radix UI、lucide-react |
| API | NestJS 11、Passport JWT、OpenAI SDK |
| Database | PostgreSQL、Prisma |
| Monorepo | pnpm workspace、Turbo |

Provider 层当前通过 OpenAI-compatible SDK 请求模型，因此可以接入支持兼容接口的服务。不同厂商的专用适配器仍在规划中。

## 系统架构

```mermaid
flowchart LR
    Browser["Next.js Web"] -->|"REST + SSE"| API["NestJS API"]
    API --> Auth["JWT / RBAC"]
    API --> Chat["AI Chat Pipeline"]
    API --> Conversations["Conversation API"]
    API --> Models["Model Admin API"]
    Chat --> Mapper["MessageMapper"]
    Chat --> Resolver["ModelResolver"]
    Chat --> Factory["ProviderFactory"]
    Chat --> Writer["SseWriter"]
    Chat --> Runs["ChatRunService"]
    Resolver --> Crypto["ApiKeyCryptoService"]
    Factory --> Provider["OpenAI-compatible Provider"]
    Conversations --> DB[("PostgreSQL")]
    Models --> DB
    Runs --> DB
```

### 后端模块

| 模块 | 职责 |
| --- | --- |
| `auth` | 注册、登录、JWT 校验、实时角色读取、RBAC |
| `ai` | 流式聊天编排、模型解析、Provider 创建、SSE 输出、调用记录 |
| `conversations` | 会话列表、分页、详情、创建、重命名、删除 |
| `models` | 模型摘要读取、管理员配置管理、密钥脱敏 |
| `prisma` | Prisma Client 生命周期与数据库连接 |

### 前端模块

| 模块 | 职责 |
| --- | --- |
| `useChatSessions` | 多窗口状态、消息列表、历史回放 |
| `useChatStream` | SSE 消费、流式增量、失败处理 |
| `useConversations` | 会话刷新、分页加载、切换、删除、重命名 |
| `chat-api.ts` | 模型摘要和聊天流请求 |
| `conversation-api.ts` | 会话 REST API |

## 数据模型

```mermaid
erDiagram
    User ||--o{ Conversation : owns
    Conversation ||--o{ Message : contains
    Conversation ||--o{ ChatRun : records
    ChatRun }o--|| Message : "uses user message"
    ChatRun }o--o| Message : "produces assistant message"
```

| 模型 | 说明 |
| --- | --- |
| `User` | 用户账号、角色、偏好模型 |
| `Model` | 模型标识、平台、Base URL、加密 API Key、启用状态 |
| `Conversation` | 用户会话、标题、更新时间 |
| `Message` | 用户或模型消息；`clientMessageId` 用于避免多模型并发重复保存问题 |
| `ChatRun` | 单次模型调用状态、耗时和错误信息 |

`Chat` 是早期兼容模型，新聊天链路使用 `Conversation / Message / ChatRun`。

## 项目结构

```text
ZaiHub/
├── apps/
│   ├── api/src/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── conversations/
│   │   ├── models/
│   │   └── prisma/
│   └── web/src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       └── lib/
├── packages/
│   └── database/
│       └── prisma/schema.prisma
├── .env.example
├── pnpm-workspace.yaml
└── turbo.json
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10+
- PostgreSQL

### 安装依赖

```bash
git clone https://github.com/coder-zhuzm/ZaiHub.git
cd ZaiHub
pnpm install
```

### 配置环境变量

复制根目录示例文件：

```bash
cp .env.example .env
```

根目录 `.env`：

```env
DATABASE_URL="postgresql://username:password@host:port/dbname?schema=public"
JWT_SECRET=replace-with-a-stable-random-secret
MODEL_KEY_ENCRYPTION_SECRET=replace-with-a-stable-random-secret

# 可选：默认模型配置
IFLOW_BASE_URL=https://apis.iflow.cn/v1
IFLOW_API_KEY=

# 可选：模型请求限制
AI_REQUEST_TIMEOUT_MS=20000
AI_MAX_TOKENS=4096

# 可选：Next.js rewrite 的 API 地址
API_ORIGIN=http://localhost:8000
```

`MODEL_KEY_ENCRYPTION_SECRET` 必须长期保持稳定。更换该值前，需要先完成模型 API Key 的重新加密迁移，否则历史密文将无法解密。

前端默认通过 `/api` rewrite 请求后端。如果希望前端直连 API，可创建 `apps/web/.env.local`：

```env
NEXT_PUBLIC_API_ORIGIN=http://localhost:8000
```

### 初始化数据库

```bash
pnpm -C packages/database generate
pnpm -C packages/database db:push
```

### 启动开发环境

统一启动：

```bash
pnpm dev
```

分别启动：

```bash
pnpm -C apps/api dev
pnpm -C apps/web dev
```

访问地址：

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)
- 模型管理: [http://localhost:3000/admin/models](http://localhost:3000/admin/models)

## 管理员与模型配置

新注册用户默认角色为 `user`。模型配置管理仅允许 `admin` 角色访问。

当前项目尚未提供管理员管理页面。首次部署时，需要通过数据库管理工具将指定用户的 `role` 更新为 `admin`。角色更新后刷新页面即可生效，不需要重新登录。

管理员模型配置字段：

| 字段 | 说明 |
| --- | --- |
| `modelId` | 上游接口使用的真实模型标识 |
| `name` | 前端展示名称 |
| `platform` | 平台标识，例如 `iflow` 或 `openai` |
| `baseURL` | OpenAI-compatible API 地址 |
| `apiKey` | 上游密钥；创建时写入，编辑时留空表示不修改 |
| `enabled` | 是否对普通用户开放 |

## SSE 协议

聊天接口：`POST /ai/chat`

服务端统一输出以下事件：

| 事件 | 说明 |
| --- | --- |
| `start` | 模型流已建立，包含 `runId`、`modelId`、`conversationId` |
| `delta` | 增量文本内容 |
| `error` | 模型请求失败或超时 |
| `done` | 请求结束，包含 `elapsedMs` |

示例：

```text
data: {"type":"start","runId":"...","conversationId":"..."}

data: {"type":"delta","content":"你好"}

data: {"type":"done","elapsedMs":842}
```

## API 摘要

### 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/auth/register` | 注册 |
| `POST` | `/auth/login` | 登录 |
| `GET` | `/users/me` | 当前用户与实时角色 |

### 模型

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/models` | 登录用户 | 启用模型的安全摘要 |
| `GET` | `/models/admin` | 管理员 | 模型配置列表，API Key 已脱敏 |
| `POST` | `/models` | 管理员 | 新增模型 |
| `PUT` | `/models/:id` | 管理员 | 更新模型 |
| `DELETE` | `/models/:id` | 管理员 | 删除模型 |

### 会话

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/conversations?limit=20&cursor=...` | 分页查询会话 |
| `GET` | `/conversations/:id` | 查询会话消息与调用记录 |
| `POST` | `/conversations` | 新建会话 |
| `PATCH` | `/conversations/:id` | 重命名会话 |
| `DELETE` | `/conversations/:id` | 删除会话 |

## 常用命令

```bash
# 开发
pnpm dev
pnpm -C apps/api dev
pnpm -C apps/web dev

# 构建
pnpm build
pnpm -C apps/api build
pnpm -C apps/web build
pnpm -C packages/database build

# 检查
pnpm -C apps/web lint

# Prisma
pnpm -C packages/database generate
pnpm -C packages/database db:push
pnpm -C packages/database db:pull
```

## 安全说明

- 不要提交 `.env`、`apps/api/.env` 或 `apps/web/.env.local`。
- 生产环境必须使用稳定且随机的 `JWT_SECRET` 和 `MODEL_KEY_ENCRYPTION_SECRET`。
- 模型 API Key 只应通过管理员接口写入，接口响应中只返回 masked key。
- 普通用户不应看到模型管理入口；后端 RBAC 仍是最终安全边界。
- 数据库连接串可能包含密码，不要打印到日志或提交到仓库。

## 已知限制

- 尚未支持主动停止生成。
- SSE `done` 已返回耗时，但页面尚未展示 run 指标。
- 尚未采集 token usage 和成本。
- Provider 当前统一走 OpenAI-compatible SDK，尚未拆分厂商专用适配器。
- 尚未提供评测集、批量运行、评分、备注和最佳答案选择。
- 自动化测试覆盖仍需补齐。

## 路线图

1. 增加停止生成和 run 指标展示。
2. 补充会话、并发、分页、RBAC 和密钥安全自动化测试。
3. 记录 token usage、成本、成功率、平均耗时和 P95。
4. 增加回答评分、备注和最佳答案选择。
5. 增加评测集和多模型批量对比。
6. 将 Provider 层拆为厂商适配器。

## License

本项目使用 [MIT License](LICENSE)。
