# Backend Reconstruction Guide (Supabase)

## 1. 创建项目

1. 在 Supabase 创建一个新项目。
2. 记录下项目的 anon key / service role key（供前端和 Edge Functions 使用）。

## 2. 重建数据库结构

在 Supabase Dashboard 的 SQL Editor 中依次执行：

1. `doc/backend/schema.sql`
2. `doc/backend/policies.sql`
3. `doc/backend/indexes.sql`

## 3. 配置 Auth

- 允许邮箱注册：Yes
- 是否需要邮件验证：Yes
- Magic Link：Yes

## 4. 配置 Storage Buckets

根据原项目创建相同名称的 Buckets：

- `videos`
- `covers`
- ...

并设置：

- 是否 public
- 文件夹结构约定： `videos/{video_id}.mp4`, `covers/{video_id}.jpg`

## 5. 部署 Edge Functions

详见 `doc/edge-functions/README-edge-functions.md`。
