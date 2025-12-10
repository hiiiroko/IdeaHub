-- ===========================
-- policies.sql
-- 说明：重建所有与业务相关的 RLS 策略
-- 前提：schema.sql 已执行
-- ===========================

SET search_path TO public;

-- ---------- 统一打开 RLS ----------

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_view_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_tasks ENABLE ROW LEVEL SECURITY;

-- 如需强制所有访问走 RLS，可改用 FORCE ROW LEVEL SECURITY;
-- 根据你现在的状态，我保守只 ENABLE，不 FORCE。


-- ---------- Table: profiles ----------

-- Public profiles are viewable by everyone.
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- Users can insert own profile.
CREATE POLICY "Users can insert own profile."
  ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((select auth.uid()) = id);

-- Users can update own profile.
CREATE POLICY "Users can update own profile."
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((select auth.uid()) = id);


-- ---------- Table: videos ----------

-- Public videos are viewable by everyone.
CREATE POLICY "Public videos are viewable by everyone."
  ON public.videos
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    (
      (is_public = true)
      AND (is_deleted = false)
    )
    OR
    ((select auth.uid()) = uploader_id)
  );

-- Users can insert their own videos.
CREATE POLICY "Users can insert their own videos."
  ON public.videos
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((select auth.uid()) = uploader_id);

-- Users can update own videos.
CREATE POLICY "Users can update own videos."
  ON public.videos
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((select auth.uid()) = uploader_id);

-- Users can delete own videos.
CREATE POLICY "Users can delete own videos."
  ON public.videos
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((select auth.uid()) = uploader_id);


-- ---------- Table: comments ----------

-- Comments are viewable by everyone.
CREATE POLICY "Comments are viewable by everyone."
  ON public.comments
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- Users can insert comments as themselves.
CREATE POLICY "Users can insert comments as themselves."
  ON public.comments
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((select auth.uid()) = author_id);

-- Users can update own comments.
CREATE POLICY "Users can update own comments."
  ON public.comments
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((select auth.uid()) = author_id);

-- Users can delete own comments or video owner can delete.
CREATE POLICY "Users can delete own comments or video owner can delete."
  ON public.comments
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (
    ((select auth.uid()) = author_id)
    OR
    ((select auth.uid()) IN (
      SELECT v.uploader_id
      FROM public.videos v
      WHERE v.id = comments.video_id
    ))
  );


-- ---------- Table: video_likes ----------

-- Public can read likes.
CREATE POLICY "Public can read likes"
  ON public.video_likes
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- Users can like as themselves.
CREATE POLICY "Users can like as themselves."
  ON public.video_likes
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can unlike as themselves.
CREATE POLICY "Users can unlike as themselves."
  ON public.video_likes
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((select auth.uid()) = user_id);


-- ---------- Table: video_view_events ----------

-- Video owners can see view events of their videos.
CREATE POLICY "Video owners can see view events of their videos."
  ON public.video_view_events
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    (select auth.uid()) IN (
      SELECT v.uploader_id
      FROM public.videos v
      WHERE v.id = video_view_events.video_id
    )
  );


-- ---------- Table: video_generation_tasks ----------

-- Users can view their own generation tasks.
CREATE POLICY "Users can view their own generation tasks."
  ON public.video_generation_tasks
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((select auth.uid()) = user_id);

-- Users can update own video_generation_tasks.
CREATE POLICY "Users can update own video_generation_tasks"
  ON public.video_generation_tasks
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
