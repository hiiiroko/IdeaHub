-- ===========================
-- indexes.sql
-- 说明：补充非主键/非唯一约束索引
-- 前提：schema.sql 已执行
-- ===========================

SET search_path TO public;

-- comments：按视频/作者/父评论查询
CREATE INDEX IF NOT EXISTS comments_video_id_idx
  ON public.comments (video_id);

CREATE INDEX IF NOT EXISTS comments_author_id_idx
  ON public.comments (author_id);

CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx
  ON public.comments (parent_comment_id);

-- video_likes：按用户查询点赞
CREATE INDEX IF NOT EXISTS video_likes_user_id_idx
  ON public.video_likes (user_id);

-- video_view_events：按视频/用户查询播放记录
CREATE INDEX IF NOT EXISTS video_view_events_user_id_idx
  ON public.video_view_events (user_id);

CREATE INDEX IF NOT EXISTS video_view_events_video_id_idx
  ON public.video_view_events (video_id);

-- videos：按上传者查询视频
CREATE INDEX IF NOT EXISTS videos_uploader_id_idx
  ON public.videos (uploader_id);
