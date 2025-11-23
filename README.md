# ZaiHub

<div align="center">

![ZaiHub Logo](https://via.placeholder.com/150x50/1f2937/ffffff?text=ZaiHub)

**多窗口AI聊天平台** - 支持多模型并行对话的智能聊天应用

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/next.js-16-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E11.0-red.svg)](https://nestjs.com/)

</div>

## ✨ 特性

### 🚀 核心功能
- **多窗口并行对话** - 同时与多个AI模型对话，支持1-3个窗口动态布局
- **智能模型管理** - 支持添加、编辑、删除多种AI模型配置
- **实时流式响应** - 基于SSE的流式输出，实时显示AI回复
- **Markdown渲染** - 完整的Markdown支持，包括代码高亮、表格、GFM特性
- **JWT认证** - 安全的用户认证和授权机制

### 🎨 用户体验
- **响应式设计** - 适配不同屏幕尺寸，移动端友好
- **优雅的UI** - 基于shadcn/ui的现代化界面设计
- **智能重试** - 单个窗口失败时可独立重试
- **状态指示** - 清晰的加载、成功、错误状态展示

### 🛠 技术特性
- **TypeScript** - 全栈TypeScript支持，类型安全
- **Monorepo架构** - 使用Turbo进行项目管理
- **数据库集成** - Prisma ORM + SQLite/PostgreSQL
- **模块化设计** - 清晰的代码组织和架构

## 🏗️ 技术栈

### 前端 (apps/web)
- **框架**: Next.js 16 + React 19
- **UI库**: shadcn/ui + Tailwind CSS
- **AI集成**: Vercel AI SDK v5
- **Markdown**: react-markdown + remark-gfm + rehype-highlight
- **状态管理**: React Hooks + Context

### 后端 (apps/api)
- **框架**: NestJS 11
- **认证**: JWT + Passport
- **AI集成**: OpenAI SDK
- **数据库**: Prisma ORM
- **API**: RESTful + SSE

### 数据层 (packages/database)
- **ORM**: Prisma
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **迁移**: 版本化数据库schema管理

## 📁 项目结构

```
ZaiHub/
├── apps/
│   ├── web/                 # Next.js 前端应用
│   │   ├── src/
│   │   │   ├── app/         # App Router
│   │   │   ├── components/  # React组件
│   │   │   └── lib/         # 工具函数
│   │   └── package.json
│   └── api/                 # NestJS 后端API
│       ├── src/
│       │   ├── ai/          # AI相关模块
│       │   ├── auth/        # 认证模块
│       │   ├── models/      # 模型管理模块
│       │   └── prisma/      # 数据库服务
│       └── package.json
├── packages/
│   └── database/            # 共享数据库包
├── turbo.json               # Turbo配置
├── pnpm-workspace.yaml      # PNPM工作空间配置
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js 20+
- pnpm 10+
- Git

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/your-username/ZaiHub.git
cd ZaiHub

# 安装依赖
pnpm install
```

### 环境配置

#### 后端环境变量 (apps/api/.env)
```env
# JWT配置
JWT_SECRET=your-super-secret-jwt-key

# OpenAI配置 (可选)
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1

# 数据库
DATABASE_URL="file:./dev.db"
```

#### 前端环境变量 (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 数据库初始化
```bash
# 推送数据库schema
pnpm db:push
```

### 启动应用

#### 方式一：统一启动 (推荐)
```bash
# 同时启动前后端
pnpm dev
```

#### 方式二：分别启动
```bash
# 启动后端 (端口8000)
pnpm -C apps/api dev

# 启动前端 (端口3000)
pnpm -C apps/web dev
```

### 访问应用
- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000
- 管理界面: http://localhost:3000/admin/models

## 📖 使用指南

### 1. 添加AI模型
1. 访问 `/admin/models` 管理页面
2. 点击"新增模型"按钮
3. 填写模型信息：
   - 名称: 模型显示名称
   - 平台: iflow/openai
   - Base URL: API端点
   - API Key: 认证密钥 (可选)

### 2. 开始对话
1. 在主界面选择窗口数量 (1-3个)
2. 为每个窗口选择AI模型
3. 在输入框中输入消息
4. 点击发送，所有窗口会并行响应

### 3. 高级功能
- **重试**: 点击失败窗口的重试按钮
- **模型切换**: 点击窗口标题快速切换模型
- **Markdown**: 支持完整的Markdown语法渲染

## 🔧 开发指南

### 常用脚本
```bash
# 开发
pnpm dev                    # 启动开发服务器
pnpm -C apps/web dev        # 仅启动前端
pnpm -C apps/api dev        # 仅启动后端

# 构建
pnpm build                  # 构建所有应用
pnpm -C apps/web build      # 构建前端
pnpm -C apps/api build      # 构建后端

# 数据库
pnpm db:push               # 推送schema
pnpm -C packages/database db:push  # 数据库操作

# 代码检查
pnpm -C apps/web lint       # 前端代码检查
```

### 添加新功能
1. **前端组件**: 在 `apps/web/src/components/` 添加
2. **API端点**: 在 `apps/api/src/` 添加模块
3. **数据库**: 在 `packages/database/prisma/` 修改schema

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 组件使用函数式写法
- API使用装饰器模式

## 🎯 核心功能详解

### 多窗口聊天系统
- **动态布局**: 根据窗口数量自动调整布局 (1列/2列/3列)
- **独立状态**: 每个窗口独立的对话历史和状态
- **并行处理**: 同时向多个模型发送请求
- **错误隔离**: 单个窗口失败不影响其他窗口

### Markdown渲染引擎
- **完整支持**: 标题、列表、表格、代码块、引用等
- **语法高亮**: 基于highlight.js的代码高亮
- **GFM特性**: GitHub Flavored Markdown支持
- **流式优化**: 专为AI流式输出优化

### 模型管理系统
- **CRUD操作**: 完整的模型增删改查
- **配置灵活**: 支持多种AI平台和自定义端点
- **安全存储**: API密钥安全存储和传输
- **即时切换**: 运行时动态切换AI模型

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范
- 遵循现有代码风格
- 添加适当的测试
- 更新相关文档
- 确保CI/CD通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢
- [心流 iFolow](https://iflow.cn/) - AI模型服务
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI集成框架
- [Next.js](https://nextjs.org/) - React框架
- [NestJS](https://nestjs.com/) - Node.js框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Prisma](https://www.prisma.io/) - ORM
- [highlight.js](https://highlightjs.org/) - 代码高亮库
- [GitHub](https://github.com/) - 开源社区


<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**
