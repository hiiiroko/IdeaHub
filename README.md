<img src="https://s2.loli.net/2025/11/23/BKYTnvUtX2wkWg3.png" alt="IdeaHub Logo" width="64" align="left" />

# IdeaHub

一个专注于创意视频的轻量平台：发现、上传、管理与互动一体化。前端基于 React + Vite，后端使用 Supabase 提供鉴权、数据库、存储与 RPC 能力。

## 功能特性
- 发现页：支持搜索、时间范围筛选（今天/本周/本月）、排序（最新/热门/点赞数）
- 上传页：拖拽/点击上传视频与封面，自动读取视频时长与封面宽高比，上传进度提示
- 我的视频：结果统计、表格视图、编辑与删除操作、即时本地更新
- 详情页：播放器、作者信息、标签、点赞、评论列表与输入，浏览计数
- 交互体验：动画过渡（framer-motion）、消息提示（react-hot-toast）、懒加载与骨架屏

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
- 默认存储桶名为 `IdeaUploads`（若未配置环境变量时），建议与业务实际一致。

## Supabase 后端结构

### 数据表

#### profiles 表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | 必填 | 主键 |
| `uid` | `integer` | 必填 | 用户ID |
| `username` | `text` | 可选 | 用户名 |
| `liked_video_ids` | `text[]` | 可选 | 喜欢的视频ID数组 |
| `created_at` | `timestamptz` | 必填 | 创建时间 |

#### videos 表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | 必填 | 主键 |
| `uploader_id` | `uuid` | 必填 | 上传者ID（关联profiles.id） |
| `title` | `text` | 必填 | 视频标题 |
| `description` | `text` | 可选 | 描述 |
| `tags` | `text[]` | 可选 | 标签数组 |
| `video_path` | `text` | 必填 | 视频文件路径 |
| `cover_path` | `text` | 必填 | 封面路径 |
| `view_count` | `integer` | 可选 | 观看次数 |
| `like_count` | `integer` | 可选 | 点赞数 |
| `comments` | `jsonb` | 可选 | 评论数据 |
| `created_at` | `timestamptz` | 必填 | 创建时间 |
| `duration` | `integer` | 可选 | 时长（秒） |
| `aspect_ratio` | `double` | 可选 | 宽高比 |

### 存储过程

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
- 前端框架：`React` + `Vite`
- 动画：`framer-motion`
- 通知：`react-hot-toast`
- 数据访问：`@supabase/supabase-js`
- 状态管理：应用上下文 `context/AppContext.tsx`

## 目录结构
```
.
├─ components/         # 组件库（Sidebar、VideoCard 等）
├─ pages/              # 页面视图（Discovery、Create、Manage、Detail）
├─ context/            # 应用上下文（AppContext）
├─ services/           # 业务服务（auth、video、interaction、utils、adapters）
├─ public/             # 静态资源（favicon、logo）
├─ lib/                # 第三方库封装（supabase 初始化）
├─ types/              # 类型定义
├─ index.html          # 应用入口 HTML
├─ index.tsx           # 前端应用入口
└─ package.json        # 脚本与依赖
```

## 常见问题
- 存储桶与权限：上传/封面需在 Supabase Storage 中开启相应 Bucket 并配置允许公开读取；开发阶段可开放读取策略，生产环境请结合 RLS 与存储策略加固。

## TODOList
- 国际化（i18n）支持，按需切换中文/英文
- 添加视频弹幕
- 添加管理 Dashboard