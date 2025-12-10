# Edge Functions 概览

本项目当前使用了 **3 个 Supabase Edge Functions**，用于 AI 视频生成相关的后台任务和 Storage 清理。

所有函数均运行在 **Deno + Supabase Functions** 环境下，使用 `@supabase/supabase-js@2` 通过 **Service Role Key** 访问数据库。

- 运行时：Deno（Supabase Edge Functions 默认环境）
- 客户端库：`@supabase/supabase-js@2`
- 部署方式（示例）：

  ```bash
  # 在 monorepo / backend 目录下（视项目结构而定）
  supabase functions deploy delete-storage-files
  supabase functions deploy generate-video
  supabase functions deploy video-callback
  ```

- 环境变量配置位置：Supabase Dashboard → Project Settings → Functions（或 Environment Variables）

## 共用环境变量说明

以下变量在多个函数中使用，**必须在新项目中重新配置**：

| 变量名                      | 必需 | 用途                                                        |
| --------------------------- | ---- | ----------------------------------------------------------- |
| `SUPABASE_URL`              | ✅   | Supabase 项目 URL，用于创建 `SupabaseClient`                |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅   | Supabase Service Role Key，用于服务器端访问数据库和 Storage |
| `SERVICE_ROLE_KEY`          | ⭕   | 兼容字段，有些函数中会备用读取，通常与上面的值相同          |
| `VITE_SUPABASE_BUCKET`      | ⭕   | 前端使用的 Bucket 名，这里默认回退为 `IdeaUploads`          |

> ⚠ 安全提示：  
> 所有使用 `SERVICE_ROLE_KEY` 的函数**必须视为后端内部函数**，**不要直接暴露给前端匿名访问**。  
> 前端调用时必须带用户 JWT（如 `generate-video`），或者只让外部服务（Ark 回调）访问（`video-callback`）。

## 1. `delete-storage-files`

- 文件：`supabase/functions/delete-storage-files/index.ts`
- HTTP 方法：`POST`
- 调用方式：建议作为 **Database Webhook / Trigger** 使用，而不是给前端直接调用
- 鉴权方式：无显式鉴权，函数内部使用 `SERVICE_ROLE_KEY` 操作 Storage

### 功能说明

当数据库中某条记录被删除或标记为需要清理时，调用此函数，自动删除对应的 Storage 文件（视频文件、封面文件）。

- 从请求体中读取：`data.record.video_path` & `data.record.cover_path`
- 根据路径数组，删除 Bucket 中对应文件
- 使用 Bucket：默认是 `IdeaUploads`（或来自环境变量 `VITE_SUPABASE_BUCKET`，视你实际代码而定）

### 依赖资源

- Storage Bucket：`IdeaUploads`

  一般路径结构类似：
  - `<userId>/videos/...`
  - `<userId>/covers/...`

### 典型使用场景（建议）

- 配合数据库触发器：  
  例如在 `videos` 表里，当一条视频记录被硬删除时，通过 HTTP 调用此函数，把 `video_path` 和 `cover_path` 同步清掉。
- 或者管理后台手动清理垃圾文件时，由后端脚本调用。

### 请求示例

```jsonc
POST /functions/v1/delete-storage-files
{
  "record": {
    "video_path": "user-uuid/videos/ai-generated-xxx.mp4",
    "cover_path": "user-uuid/covers/ai-generated-xxx.png"
  }
}
```

### 响应

- `200 OK`：`"Storage files successfully deleted."`
- `400 Bad Request`：未提供任何路径
- `500 Internal Server Error`：环境变量缺失或 Storage 删除失败

## 2. `generate-video`

- 文件：`supabase/functions/generate-video/index.ts`
- HTTP 方法：`POST`（带 CORS 支持，前端直接调用）
- 调用 URL：`/functions/v1/generate-video`
- 鉴权方式：**前端必须在 `Authorization` 头里带 Bearer JWT**  
  函数内部用 `supabase.auth.getUser(token)` 检查当前用户

用途：

- 创建 AI 视频生成任务（走火山 Ark / Doubao API）
- 查询任务（从本地 `video_generation_tasks` 表）
- 下载生成结果、上传到 Storage 并写入 `videos` 表
- 在 Ark 回调异常时，主动从 Ark 同步任务状态

### 专用环境变量说明

在 `generate-video` 中额外使用了以下变量：

| 变量名                    | 必需 | 用途                                                                    |
| ------------------------- | ---- | ----------------------------------------------------------------------- |
| `VOLCANO_API_BASE`        | ⭕   | 火山 Ark API 基础地址，默认：`https://ark.cn-beijing.volces.com/api/v3` |
| `VOLCANO_API_KEY`         | ✅   | 调用火山 Ark / Doubao 的 API Key                                        |
| `VOLCANO_CALLBACK_URL`    | ✅   | Ark 回调地址，通常指向 `video-callback` 函数的公网 URL                  |
| `VOLCANO_CALLBACK_SECRET` | ⭕   | 如果使用 Ark 的回调签名校验，则这里是约定的 secret                      |
| `VITE_SUPABASE_BUCKET`    | ⭕   | 存储生成视频/封面的 Bucket 名，默认为 `IdeaUploads`                     |

### 请求结构总览

函数根据请求 JSON 里的 `action` 字段分流：

```ts
type Action =
  | 'create' // 创建任务
  | 'query' // 查询任务
  | 'download' // 下载 & 发布
  | 'sync_from_ark'; // 从 Ark 端拉取任务最新状态

interface GenerateVideoRequest {
  prompt: string;
  resolution: '480p' | '720p';
  ratio: '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9';
  duration: 3 | 4 | 5;
  fps?: 16 | 24;
}
```

并且 **所有非 `sync_from_ark` 请求都要求用户已登录**（从 `Authorization` 头获取 JWT）。

#### 2.1 `action: "create"` —— 创建视频生成任务

- 入口函数：`handleCreateTask`
- 流程：
  1. 校验 env：`VOLCANO_API_KEY` 和 `CALLBACK_URL` 必须存在
  2. 拼接 prompt：`<prompt> --rs <resolution> --rt <ratio> --dur <duration> --fps <fps>`
  3. 请求火山 Ark，创建生成任务，并传入：
     - `callback_url`（指向 `video-callback` 函数）
     - `return_last_frame = true`
     - 可选 `callback_secret`
  4. 从 Ark 返回体中提取 `externalTaskId` 和初始 `status`
  5. 在 `video_generation_tasks` 表插入一条新记录：
     - `user_id`
     - `external_task_id`
     - `status`
     - `prompt` / `resolution` / `ratio` / `duration` / `fps`

##### 请求示例

```jsonc
POST /functions/v1/generate-video
Authorization: Bearer <user_jwt>
{
  "action": "create",
  "prompt": "a cat learning to code in TypeScript",
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 3,
  "fps": 16
}
```

##### 响应示例

```json
{
  "externalTaskId": "ark-task-id-xxxx",
  "status": "queued"
}
```

#### 2.2 `action: "query"` —— 查询本地任务状态

- 入口函数：`handleQueryTask`
- 只查询当前用户自己的 `video_generation_tasks`：

```sql
select * from video_generation_tasks
where external_task_id = :taskId
  and user_id = :currentUserId
```

##### 请求示例

```jsonc
POST /functions/v1/generate-video
Authorization: Bearer <user_jwt>
{
  "action": "query",
  "taskId": "ark-task-id-xxxx"
}
```

##### 响应

- `200`：返回整行任务数据
- `404`：`{ "error": "Task not found" }`

#### 2.3 `action: "download"` —— 下载视频并发布为作品

- 入口函数：`handleDownloadAndPublish`
- 流程：
  1. 根据 `taskId` 和 `userId` 查 `video_generation_tasks`：
     - 必须属于当前用户
     - 必须 `status === "succeeded"`
     - 必须有 `video_url`
  2. 从 Ark 提供的 `video_url` 下载视频文件
  3. 如有 `last_frame_url`，尝试下载封面图
  4. 构造存储路径：
     - `videoPath = <userId>/videos/ai-generated-<taskId>.mp4`
     - `coverPath = <userId>/covers/ai-generated-<taskId>.png`（如果有）
  5. 上传到 Storage 的 `BUCKET`（默认 `IdeaUploads`）
  6. 在 `videos` 表插入一条新视频记录，字段包括：
     - `uploader_id`
     - `title` / `description` / `tags`
     - `video_path` / `cover_path`
     - `duration`（优先 params，其次 task.duration）
     - `aspect_ratio`（默认 1.77）
  7. 把 `video_generation_tasks.status` 更新为 `"uploaded"`

##### 请求示例

```jsonc
POST /functions/v1/generate-video
Authorization: Bearer <user_jwt>
{
  "action": "download",
  "taskId": "ark-task-id-xxxx",
  "title": "My AI Generated Video",
  "description": "Generated from Doubao",
  "tags": ["ai", "doubao", "demo"],
  "duration": 3,
  "aspect_ratio": 1.77
}
```

##### 响应示例

```json
{
  "taskId": "ark-task-id-xxxx",
  "video": {
    "id": "uuid-of-video-row",
    "uploader_id": "user-uuid",
    "title": "My AI Generated Video",
    "...": "..."
  },
  "videoPublicUrl": "https://.../IdeaUploads/...mp4",
  "coverPublicUrl": "https://.../IdeaUploads/...png"
}
```

#### 2.4 `action: "sync_from_ark"` —— 主动从 Ark 同步任务状态

- 入口函数：`handleSyncFromArk`
- 用于 Ark 回调失败/丢失时的兜底。
- 流程：
  1. 确认 `video_generation_tasks` 中存在该任务，且归当前用户所有
  2. 调用 Ark `GET /contents/generations/tasks/:id`
  3. 从返回体中提取：
     - `status`
     - `content.video_url`
     - `content.last_frame_url`
     - `error`（如有）
  4. 回写 `video_generation_tasks`：
     - `status`
     - `video_url`
     - `last_frame_url`
     - `error_message`（在失败时保存 Ark 的 error 对象）

##### 请求示例

```jsonc
POST /functions/v1/generate-video
Authorization: Bearer <user_jwt>
{
  "action": "sync_from_ark",
  "taskId": "ark-task-id-xxxx"
}
```

### generate-video 依赖的数据库与 Storage

- 表：
  - `public.video_generation_tasks`
  - `public.videos`
- Storage：
  - Bucket：`IdeaUploads`（或 `VITE_SUPABASE_BUCKET`）
  - 路径约定：
    - `<userId>/videos/ai-generated-<taskId>.mp4`
    - `<userId>/covers/ai-generated-<taskId>.png`

## 3. `video-callback`

- 文件：`supabase/functions/video-callback/index.ts`
- HTTP 方法：`POST`（支持 `OPTIONS` 做 CORS 但不暴露给浏览器前端，一般被 Ark 回调）
- 调用 URL：配置给 Ark 的 `callback_url`（即 `VOLCANO_CALLBACK_URL`）
- 鉴权方式：**外部不鉴权**（由 Ark 调用），内部使用 `SERVICE_ROLE_KEY` 更新数据库

### 功能说明

接收火山 Ark 的异步回调，更新 `video_generation_tasks` 表中的对应任务记录。

- 接收 payload（结构与 Ark 查询接口的返回体类似）：
  - `id`：外部任务 ID（对应 `external_task_id`）
  - `status`：任务状态（`queued` / `running` / `succeeded` / `failed` / ...）
  - `content.video_url`：生成视频地址
  - `content.last_frame_url`：尾帧封面地址（可选）
  - `error`：错误信息（失败时可能存在）

- 更新逻辑：  
  根据 `external_task_id = payload.id` 更新：
  - `status`
  - `video_url`
  - `last_frame_url`
  - `error_message`（在失败时记录 Ark 的 error 对象）

### 环境变量

复用：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` / `SERVICE_ROLE_KEY`

### 请求示例（由 Ark 触发）

```jsonc
POST /functions/v1/video-callback
{
  "id": "ark-task-id-xxxx",
  "status": "succeeded",
  "content": {
    "video_url": "https://...",
    "last_frame_url": "https://..."
  },
  "error": null
}
```

### 响应

- `200 OK`：`{ "ok": true }`
- `400`：payload 格式错误 / JSON 解析失败
- `500`：数据库更新失败（同时打印详细日志）

> 如果找不到对应任务（例如用户还没在我们这边插入记录），函数会记录 warning，但仍然返回 `200`，避免 Ark 反复重试。
