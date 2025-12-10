-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id),
  CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text,
  uid text UNIQUE,
  avatar_url text,
  bio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.video_generation_tasks (
  id bigint NOT NULL DEFAULT nextval('video_generation_tasks_id_seq'::regclass),
  user_id uuid NOT NULL,
  external_task_id text NOT NULL,
  status text NOT NULL,
  prompt text,
  resolution text,
  ratio text,
  duration integer,
  fps integer,
  video_url text,
  last_frame_url text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_discarded boolean NOT NULL DEFAULT false,
  CONSTRAINT video_generation_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT video_generation_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.video_likes (
  video_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT video_likes_pkey PRIMARY KEY (video_id, user_id),
  CONSTRAINT video_likes_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id),
  CONSTRAINT video_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.video_view_events (
  id bigint NOT NULL DEFAULT nextval('video_view_events_id_seq'::regclass),
  video_id uuid NOT NULL,
  user_id uuid,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT video_view_events_pkey PRIMARY KEY (id),
  CONSTRAINT video_view_events_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id),
  CONSTRAINT video_view_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uploader_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  tags ARRAY,
  video_path text NOT NULL,
  cover_path text NOT NULL,
  duration integer DEFAULT 0,
  aspect_ratio double precision DEFAULT 1.77,
  is_public boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT videos_pkey PRIMARY KEY (id),
  CONSTRAINT videos_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.profiles(id)
);

-- ==========================================
-- Views — 管理后台 / 统计相关只读视图
-- ==========================================

DROP VIEW IF EXISTS public.video_with_engagement_stats;

CREATE VIEW public.video_with_engagement_stats
WITH (security_invoker = true) AS
SELECT
  base.video_id,
  base.uploader_id,
  base.title,
  base.description,
  base.tags,
  base.video_path,
  base.cover_path,
  base.duration,
  base.aspect_ratio,
  base.is_public,
  base.is_deleted,
  base.created_at,
  base.updated_at,
  base.total_comments,
  base.top_level_comments,
  base.total_likes,
  base.total_views,
  (
    LN(base.total_views + 1)
    + 3.0 * base.total_likes
    + 8.0 * base.top_level_comments
    + 4.0 * (base.total_comments - base.top_level_comments)
  ) AS hot_score
FROM (
  SELECT
    v.id            AS video_id,
    v.uploader_id,
    v.title,
    v.description,
    v.tags,
    v.video_path,
    v.cover_path,
    v.duration,
    v.aspect_ratio,
    v.is_public,
    v.is_deleted,
    v.created_at,
    v.updated_at,
    COALESCE(c.total_comments, 0)::bigint       AS total_comments,
    COALESCE(c.top_level_comments, 0)::bigint   AS top_level_comments,
    COALESCE(l.total_likes, 0)::bigint          AS total_likes,
    COALESCE(w.total_views, 0)::bigint          AS total_views
  FROM public.videos v
  LEFT JOIN (
    SELECT
      video_id,
      COUNT(*) AS total_comments,
      COUNT(*) FILTER (WHERE parent_comment_id IS NULL) AS top_level_comments
    FROM public.comments
    GROUP BY video_id
  ) c ON c.video_id = v.id
  LEFT JOIN (
    SELECT
      video_id,
      COUNT(*) AS total_likes
    FROM public.video_likes
    GROUP BY video_id
  ) l ON l.video_id = v.id
  LEFT JOIN (
    SELECT
      video_id,
      COUNT(*) AS total_views
    FROM public.video_view_events
    GROUP BY video_id
  ) w ON w.video_id = v.id
) AS base;
