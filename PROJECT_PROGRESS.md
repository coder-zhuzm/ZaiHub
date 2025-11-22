<!--
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-22 22:50:56
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 22:50:57
-->
# ZaiHub 项目进展报告

## 概览
- 项目采用 Monorepo 架构，包含 Web 前端（Next.js 16 + AI SDK v5）与 API 后端（NestJS）。
- 前端使用 `useChat` 与数据流（SSE）协议驱动对话；后端提供 UIMessage 流输出并支持 JWT 鉴权。
- 已完成登录/注册、携带令牌的流式聊天、模拟流响应、自动滚动到底部等核心功能，开发体验已打通。

## 当前架构
- 前端（apps/web）
  - 技术栈：Next.js 16、Turbopack、AI SDK v5 React。
  - 对话：`useChat` + `DefaultChatTransport`，遵循 UIMessage 协议，直连后端接口。
  - 路由代理：支持通过 `next.config.mjs` 配置 `rewrites` 到后端（开发阶段目前直连后端端口以减少代理问题）。
- 后端（apps/api）
  - 技术栈：NestJS、Passport JWT、AI SDK server。
  - 对话：`POST /ai/chat` 返回 UIMessage 流；`GET /ai/chat/:id/stream` 提供重连协商端点。
  - 鉴权：JWT 守卫保护对话与重连接口；登录/注册生成令牌。
- 数据层（packages/database）
  - 使用 Prisma Client 单例封装，避免热重载多实例问题（文件：`packages/database/src/index.ts`）。

## 已实现功能
- 登录/注册与令牌注入
  - 登录与注册表单、令牌持久化与切换视图（apps/web/src/app/page.tsx:74-126）。
  - 登录成功后在聊天请求头注入 `Authorization`（apps/web/src/app/page.tsx:29-37）。
- 流式聊天
  - 前端：`DefaultChatTransport`，发送 UIMessage，渲染 `messages.parts` 文本（apps/web/src/app/page.tsx:26-41, 148-160）。
  - 后端：UIMessage 流事件序列（`start → text-start → text-delta → text-end → finish`），模拟与真实模型统一（apps/api/src/ai/ai.controller.ts:32-44, 38-43）。
  - 重连端点：提供最小事件序列用于协商（apps/api/src/ai/ai.controller.ts:45-59）。
- 自动滚动到底部
  - 根据与底部的距离和 `status` 状态自动滚动，避免打断用户浏览历史消息（apps/web/src/app/page.tsx:43-54, 147）。
- 本地开发模拟响应
  - 无 `OPENAI_API_KEY` 时返回“随机内容 + 原样输入 + 服务器时间”的分段流，用于调试（apps/api/src/ai/ai.controller.ts:27-44）。

## 关键改动列表
- 修复 `useChat` 初始化错误，升级到 v5 用法：移除过时属性，使用 `sendMessage` 与 `status`（apps/web/src/app/page.tsx:26-41）。
- 动态注入令牌并保障 SSE 授权：在 `prepareSendMessagesRequest` 中从 state/localStorage 获取 `Authorization`（apps/web/src/app/page.tsx:29-37）。
- 统一后端响应为 UIMessage 流：
  - 模型分支：`streamText` → `pipeUIMessageStreamToResponse`（apps/api/src/ai/ai.controller.ts:38-43）。
  - 模拟分支：`createUIMessageStream` 写入完整事件序列（apps/api/src/ai/ai.controller.ts:32-44）。
- 增加流重连端点：`GET /ai/chat/:id/stream` 返回最小事件（apps/api/src/ai/ai.controller.ts:45-59）。
- Turbopack 根与 ESM 配置修复：`apps/web/next.config.mjs`（设置 `turbopack.root`、使用 ESM 导出，并提供 `rewrites`）。

## 流传输说明
- 协议：SSE（Server-Sent Events），以单次 `POST /ai/chat` 长连接返回 UIMessage 事件；不是短连接响应。
- 事件：`start` 标示开始；`text-start`/`text-delta`/`text-end` 构成文本块；最后 `finish` 收尾。
- 重连：`GET /ai/chat/:id/stream` 由 SDK 发起协商，后端提供最小事件以完成协商。

## 验证方法
- 登录后在页面发送消息：
  - Network 面板观察 `POST /ai/chat` 保持 Pending 并持续输出事件（apps/web 与 apps/api 已对齐 UIMessage 协议）。
  - UI 在 `status==='submitted'|'streaming'` 时显示“正在思考...”，随后逐字渲染（apps/web/src/app/page.tsx:163-169）。
- Lint：`apps/web` 已通过 eslint（本地执行 `pnpm -C apps/web lint`）。

## 已解决问题
- `useChat` v5 迁移与初始化错误。
- Turbopack 根目录推断错误、`next.config` 模块格式问题（改为 `next.config.mjs`）。
- 聊天请求未携带令牌导致 401（动态读取并注入）。
- 模拟响应格式错误（统一为 UIMessage 流）。
- EventStream 未返回（后端统一使用 UIMessage 流管道函数）。
- 模拟流不分段（已改为分段 `text-delta`，便于观察增量）。
- 聊天列表不会自动滚动到底（增加滚动逻辑）。

## 待改进与风险
- API URL 与代理：开发阶段直连后端端口，后续可统一回 `/api/ai/chat` 并完善 `rewrites`。
- 错误态与重试：前端与后端应增加错误处理与重试机制，提升鲁棒性。
- 丰富 UIMessage：可加入结构化片段（如 reasoning/tool 调用）以提升体验。
- 连接策略：如果确需“整场对话单连接”需自定义传输（WebSocket 或会话级 SSE），超出 SDK 默认模式。

## 下一步计划（建议）
- 统一前端 `api` 到相对路径，恢复 `rewrites`，减少跨域与端口耦合。
- 加入错误提示与日志埋点，便于生产环境排查。
- 扩展模拟分支文案与事件，覆盖更多 UIMessage 片段类型。
- 评估单连接实现（Edge + WebSocket）是否必要，若必要则设计自定义传输与后端通道。

---

更新日期：2025-11-22