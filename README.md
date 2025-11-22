<!--
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-22 23:01:20
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 23:01:21
-->
# ZaiHub

## 简介
- Monorepo 项目，包含 `apps/web` (Next.js 16) 与 `apps/api` (NestJS)。
- 前端使用 AI SDK v5 的 `useChat`，后端提供 SSE UIMessage 流，支持 JWT 鉴权。

## 目录结构
- `apps/web` 前端应用
- `apps/api` 后端 API
- `packages/database` Prisma 数据层

## 环境要求
- Node.js 20+
- pnpm (`npm i -g pnpm`)

## 安装与启动
- 安装依赖：
  ```bash
  pnpm install
  ```
- 开发模式（分别启动）：
  ```bash
  pnpm -C apps/api dev
  pnpm -C apps/web dev
  ```
- 根目录统一启动（如已配置 turbo）：
  ```bash
  pnpm dev
  ```

## 环境变量
- `apps/api`
  - `JWT_SECRET`：JWT 密钥（默认 `dev-secret`）
  - `OPENAI_API_KEY`：可选，配置后走真实模型；未配置时使用模拟流
- `apps/web`
  - 开发环境默认直连 `http://localhost:8000/ai/chat`

## 常用脚本
- 前端：`pnpm -C apps/web lint`、`pnpm -C apps/web build`
- 后端：`pnpm -C apps/api dev`、`pnpm -C apps/api build`

## 说明
- 本地模拟流在未设置 `OPENAI_API_KEY` 时返回“随机内容 + 原样输入 + 服务器时间”，用于开发调试。
- `.gitignore` 已忽略 `.turbo`、构建产物与环境文件，确保仓库整洁。