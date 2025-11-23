<!--
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-23 19:14:13
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 19:14:15
-->
# ZaiHub Chat 接口架构与流程

## 概览
- 前端为每个选中模型维护独立会话，并行向后端发送聊天请求。
- 后端 `POST /ai/chat` 基于请求体携带的数据库主键 `modelId` 查库，取真实模型标识与凭据，调用心流 `chat/completions`。
- 后端将结果封装为 UI 消息流事件（SSE），前端逐字增量渲染；异常时统一返回错误事件。

## 前端模块
- 会话管理与窗口布局
  - 初始化与维护每模型会话：`apps/web/src/app/page.tsx:56-77`
  - 自动滚动与状态指示：`apps/web/src/app/page.tsx:85-101`、`apps/web/src/components/status-indicator.tsx:6-27`
- 接口调用
  - 直连后端基地址：`apps/web/src/app/page.tsx:17`
  - 拉取模型列表：`apps/web/src/app/page.tsx:109-111`
  - 登录注册：`apps/web/src/components/auth.tsx:16-23`
  - 并发发送聊天请求（每模型一次）：`apps/web/src/app/page.tsx:198-206`
- SSE 解析与渲染
  - 判定 `text/event-stream` 与逐块读取：`apps/web/src/app/page.tsx:215-231`
  - 事件解析：
    - 增量文本：`apps/web/src/app/page.tsx:259-276`
    - 错误事件：`apps/web/src/app/page.tsx:243-258`
    - 完成事件：`apps/web/src/app/page.tsx:277-285`

## 后端模块
- 控制器与鉴权
  - 路由定义与守卫：`apps/api/src/ai/ai.controller.ts:18-21`
  - JWT 校验策略：`apps/api/src/auth/jwt.strategy.ts:6-12`
- 模型解析与配置来源
  - 从请求体读取 `modelId`（数据库主键），查库后得到真实模型标识 `Model.modelId`、`baseURL`、`apiKey`：`apps/api/src/ai/ai.controller.ts:25-44`
- 心流接口调用（对齐文档）
  - 调用：`POST ${base}/chat/completions`，参数包含 `model`、`messages`（OpenAI 兼容）与 `response_format/temperature/top_p/top_k`：`apps/api/src/ai/ai.controller.ts:45-57`
- UI 流封装
  - 文本提取：`apps/api/src/ai/ai.controller.ts:59`
  - 事件序列：`start → text-start → text-delta... → text-end → finish`：`apps/api/src/ai/ai.controller.ts:77-106`
- 错误处理
  - 心流错误或无内容 → `{"type":"error","errorText":"[iFlow] ..."}` + `finish(error)`：`apps/api/src/ai/ai.controller.ts:87-93`
  - 异常捕获统一错误事件流：`apps/api/src/ai/ai.controller.ts:100-107`

## 数据契约
- 请求体（前端 → 后端）
  - `messages: UIMessage[]`：包含 `id/role/parts[]`，其中 `parts` 以 `type==='text'` 的文本拼接为 `content`
  - `modelId: string`：数据库主键，用于查库获取真实模型配置
  - 映射为 OpenAI 风格消息：`apps/api/src/ai/ai.controller.ts:29-34`
- 响应（后端 → 前端）
  - SSE 事件：
    - 正常：`start`、`text-start`、`text-delta`×N、`text-end`、`finish`
    - 异常：`error{errorText}`、`finish(error)`

## 配置与模型管理
- 数据库结构
  - `Model` 表：`packages/database/prisma/schema.prisma:31-40`
    - `modelId: String @default("")`（真实模型标识，必填，默认值用于平滑升级）
    - `name: String`（展示名称）
    - `platform/baseURL/apiKey/enabled`
- 服务层
  - 列表返回含 `modelId`：`apps/api/src/models/models.service.ts:11-22`
  - 创建写入 `modelId`：`apps/api/src/models/models.service.ts:34-43`
- 管理页（前端）
  - 列表与表单包含 `modelId`：`apps/web/src/app/admin/models/page.tsx:14-21, 176-205`

## 时序示例
1. 用户在窗口 1 选择模型 A（数据库主键 `idA`），输入“你好”。
2. 前端在窗口 1 的会话追加用户消息，并调用 `POST /ai/chat`：`apps/web/src/app/page.tsx:198-206`。
3. 后端读取 `modelId=idA`，查库获取 `modelId=『tstars2.0』`、`baseURL/apiKey`：`apps/api/src/ai/ai.controller.ts:25-44`。
4. 后端调用心流 `POST ${base}/chat/completions`（非流式），取文本：`apps/api/src/ai/ai.controller.ts:45-59`。
5. 后端封装为 UI 流事件推送：`apps/api/src/ai/ai.controller.ts:77-106`。
6. 前端解析 `text-delta` 增量更新窗口 1 的助手消息；结束后窗口状态转为 `ready`：`apps/web/src/app/page.tsx:259-285`。

## 运行与联调
- 后端端口固定 `8000`：`apps/api/src/main.ts:7-11`
- 前端直连后端：设置 `NEXT_PUBLIC_API_ORIGIN=http://localhost:8000`，避免代理中断 SSE。
- Curl 示例（需登录拿到 Token）：
  ```bash
  curl -N \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"modelId":"<数据库主键>","messages":[{"role":"user","parts":[{"type":"text","text":"你好"}]}]}' \
    http://localhost:8000/ai/chat
  ```

## 错误与稳定性
- 开发代理对 SSE 不稳定，推荐始终直连后端。
- 后端统一错误事件，前端将错误文本写入气泡并标记状态 `error`，支持重试：`apps/web/src/app/page.tsx:139-186`

## 可扩展方向
- 切换心流流式接口（`stream: true`）直转事件，减少后端封装逻辑。
- 多平台 Provider：按 `platform` 选择调用策略，复用消息映射。
- 速率限制与并发控制：保障多窗口并行的稳定性。