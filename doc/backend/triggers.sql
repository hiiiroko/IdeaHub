-- ==========================================
-- triggers.sql — 项目自定义触发器快照
--
-- 说明：
--   只记录与本项目业务直接相关的触发器。
--   Realtime / Storage 等 Supabase 内置触发器
--   不在此文件中重建，由 Supabase 自行管理。
-- ==========================================

-- 为了明确起见，显式指定 search_path（可选）
SET search_path TO public;


-- ------------------------------
-- 1. 新用户自动创建 profiles
-- Schema: auth
-- Table : auth.users
-- Trigger 名: on_auth_user_created
-- Function: public.handle_new_user()
--
-- 作用：
--   当有新用户插入 auth.users 时，
--   自动往 public.profiles 写入一行：
--     profiles.id = users.id
--     profiles.username = raw_user_meta_data->>'username'
-- ------------------------------

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------
-- 2. video_generation_tasks 自动更新时间戳
-- Schema: public
-- Table : public.video_generation_tasks
-- Trigger 名: set_timestamp_video_generation_tasks
-- Function: public.set_timestamp()
--
-- 作用：
--   在更新 video_generation_tasks 时，
--   自动把 updated_at 设置为 now()。
-- ------------------------------

CREATE TRIGGER set_timestamp_video_generation_tasks
BEFORE UPDATE ON public.video_generation_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();


-- ------------------------------
-- 3. videos 自动更新时间戳
-- Schema: public
-- Table : public.videos
-- Trigger 名: set_timestamp_videos
-- Function: public.set_timestamp()
--
-- 作用：
--   在更新 videos 时，
--   自动把 updated_at 设置为 now()。
-- ------------------------------

CREATE TRIGGER set_timestamp_videos
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();
