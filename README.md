<img src="https://s2.loli.net/2025/11/23/BKYTnvUtX2wkWg3.png" alt="IdeaHub Logo" width="64" align="left" />

# IdeaHub

一个专注于创意视频的轻量平台：发现、上传、管理与互动一体化。

前端基于 React + Vite，后端使用 Supabase 提供鉴权、数据库、存储与 RPC 能力。

## 功能特性

- 创作前-创意模块：支持搜索、时间范围筛选（今天/本周/本月）、排序（最新/热门/点赞数）
- 创作中-发布模块：拖拽/点击上传视频与封面，自动读取视频时长与封面宽高比
- 创作后-管理模块：编辑与删除操作、即时更新
- 视频详情页：播放器、作者信息、标签、点赞、评论列表与输入，浏览计数
- 交互体验：动画过渡（framer-motion）、消息提示（react-hot-toast）
- 主题：支持浅色/深色主题切换，自动跟随系统并可手动切换
- AI 生成视频：支持提示词生成短视频，参数可选（分辨率、画面比例、时长、帧率），一键“使用视频”发布

## 预览

<p float="left">
    <img src="https://s2.loli.net/2025/11/26/vlxeQgNqmhwznkK.png" width="48%">
    <img src="https://s2.loli.net/2025/11/26/Gb8XV1uRJB4KOCs.png" width="48%">
    <img src="https://s2.loli.net/2025/11/26/HnFm6PzGCvbeVlT.png" width="48%">
    <img src="https://s2.loli.net/2025/11/26/hVg2HlL97WtiImN.png" width="48%">
</p>

## 快速开始

### 环境要求

- `Node.js >= 18`
- `pnpm`（或使用 `npm`/`yarn`，下文以 `pnpm` 为例）

### 安装与运行

```
pnpm i
pnpm dev
```

构建与预览：

```
pnpm build
pnpm preview
```

### 环境变量（.env.local）

按以下格式配置 Supabase 接入：

```
VITE_SUPABASE_URL=[YOUR_VITE_SUPABASE_URL]
VITE_SUPABASE_ANON_KEY=[YOUR_VITE_SUPABASE_ANON_KEY]
VITE_SUPABASE_BUCKET=[YOUR_VITE_SUPABASE_BUCKET_NAME]
```

- 存储桶需存在且可公开读取；代码在 `services/video.ts:71` 对“未找到存储桶”进行了错误提示与引导。

### 边缘函数环境（部署在 Supabase Functions）

- `VOLCANO_API_KEY`：Doubao SeeDance 接入密钥（仅在函数侧配置，不写入前端）
- `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`：函数侧使用 Service Role 上传生成视频并获取公开地址

> 以上密钥请通过 Supabase Dashboard 的 Functions 环境变量管理，避免泄露到前端与仓库。

## AI 生成视频

### 使用流程

- 在发布页点击右上角“AI 生成视频”按钮
- 填写提示词，选择参数：
  - 分辨率：`480P/720P`
  - 画面比例：`16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9`
  - 时长：`3–5 秒`
  - 帧率：`16 / 24 FPS`
- 生成完成后预览，点击“使用视频”，自动将生成视频（含首帧封面）保存并进入发布流程

### 体验与占位

- 生成与上传期间提供青红渐变“流动”占位符与旋转指示，避免空白区域
- 返回发布页后，视频/封面预览加载完成即自动替换占位

### 后端说明

- 边缘函数 `generate-video` 对接 Doubao SeeDance 模型：
  - `create`：创建生成任务
  - `query`：查询任务状态与返回视频地址
  - `download`：在函数侧下载生成视频并上传 Supabase Storage，返回公开 URL
- 函数已统一处理 CORS 与预检（OPTIONS），前端通过 `supabase.functions.invoke` 调用

## Supabase 后端结构

### 数据表

#### profiles 表

| 字段              | 类型          | 约束 | 说明             |
| ----------------- | ------------- | ---- | ---------------- |
| `id`              | `uuid`        | 必填 | 主键             |
| `uid`             | `integer`     | 必填 | 用户ID           |
| `username`        | `text`        | 可选 | 用户名           |
| `created_at`      | `timestamptz` | 必填 | 创建时间         |

#### videos 表

| 字段           | 类型          | 约束 | 说明                        |
| -------------- | ------------- | ---- | --------------------------- |
| `id`           | `uuid`        | 必填 | 主键                        |
| `uploader_id`  | `uuid`        | 必填 | 上传者ID（关联profiles.id） |
| `title`        | `text`        | 必填 | 视频标题                    |
| `description`  | `text`        | 可选 | 描述                        |
| `tags`         | `text[]`      | 可选 | 标签数组                    |
| `video_path`   | `text`        | 必填 | 视频文件路径                |
| `cover_path`   | `text`        | 必填 | 封面路径                    |
| `view_count`   | `integer`     | 可选 | 观看次数                    |
| `like_count`   | `integer`     | 可选 | 点赞数                      |
| `comments`     | `jsonb`       | 可选 | 评论数据                    |
| `created_at`   | `timestamptz` | 必填 | 创建时间                    |
| `duration`     | `integer`     | 可选 | 时长（秒）                  |
| `aspect_ratio` | `double`      | 可选 | 宽高比                      |

### RPC 函数

#### add_comment

- 功能：为视频添加评论
- 参数：`payload: jsonb`, `target_video_id: uuid`
- 调用：`await supabase.rpc('add_comment', { payload, target_video_id })`

#### increment_view_count

- 功能：增加视频观看计数
- 参数：`video_id: uuid`
- 调用：`await supabase.rpc('increment_view_count', { video_id })`

#### toggle_like

- 功能：切换视频点赞状态
- 参数：`target_video_id: uuid`
- 调用：`await supabase.rpc('toggle_like', { target_video_id })`

## 技术栈与架构

- 前端：
  - `React` + `Vite`
  - 样式：`Tailwind CSS`（实用类样式）
  - 动画：`framer-motion`
  - 通知：`react-hot-toast`
  - 上传进度：`axios`（直传存储时显示进度）
  - 状态管理：应用上下文（`context/AppContext.tsx`）
- 后端（Supabase）：
  - 鉴权与用户：`Auth`（`profiles` 表映射基础信息）
  - 数据库：`Postgres`（`videos` 表存储视频元数据、标签、统计与评论）
  - 存储：`Storage`（公开读取视频与封面）
  - 边缘函数：`Functions`（`supabase/functions/generate-video`，Deno 运行时，服务端下载生成视频并上传 Storage）

- AI 文生视频流程：
  - 前端发起：发布页点击“AI 生成视频”→创建任务（`create`）→轮询状态（`query`）
  - 保存为视频：成功后调用（`download`）在函数侧下载并上传到 `Storage`，返回公开 URL，前端点击“使用视频”完成发布
  - 调用方式：`supabase.functions.invoke`；函数侧统一处理 CORS/预检（`OPTIONS`）

## 目录结构

```
.
├─ components/                 # 组件库
│  ├─ AI/                     # AI 生成视频相关组件（`VideoGenerateModal.tsx`）
│  └─ ...
├─ hooks/                      # 复用钩子（`useVideoGeneration.ts` 等）
├─ pages/                      # 页面视图（`Discovery.tsx`、`Create.tsx`、`Detail.tsx` 等）
├─ context/                    # 应用上下文（`AppContext.tsx`）
├─ services/                   # 业务服务（`auth`、`video`、`utils`、`adapters`）
├─ lib/                        # 第三方库封装（`supabase.ts` 初始化）
├─ supabase/                   # Supabase 项目配置与函数
│  ├─ config.toml             # 本地与项目配置
│  └─ functions/
│     └─ generate-video/
│        └─ index.ts          # 边缘函数：文生视频任务与保存
├─ types/                      # 类型定义
├─ public/                     # 静态资源（`favicon`、`logo`）
├─ index.html                  # 应用入口 HTML
├─ index.tsx                   # 前端应用入口
└─ package.json                # 脚本与依赖
```

## 常见问题

- 存储桶与权限：上传/封面需在 Supabase Storage 中开启相应 Bucket 并配置允许公开读取；开发阶段可开放读取策略，生产环境请结合 RLS 与存储策略加固。

## TODOList

- 视频上传进度提示
- 国际化（i18n）支持，按需切换中文/英文
- 添加视频弹幕
- 添加管理模块的结果统计、表格视图
- 支持视频录制
- 根据简介生成视频封面
- 无限滚动
