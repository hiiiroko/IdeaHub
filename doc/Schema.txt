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