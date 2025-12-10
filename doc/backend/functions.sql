-- ==========================================
-- functions.sql
-- 用于重建所有自定义数据库函数
-- 注意：如果以后在 Supabase 里改动了函数，
--       请同步更新这里
-- ==========================================

SET search_path TO public;

-- ------------------------------
-- 1. add_comment
-- 说明：
--   通过 auth.uid() 获取当前用户，
--   并插入一条评论到 public.comments。
--   设计成 RPC 可直接从前端调用：rpc('add_comment', ...)
-- ------------------------------

CREATE OR REPLACE FUNCTION public.add_comment(
  target_video_id uuid,
  p_content text,
  p_parent_comment_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_user_id uuid;
begin
  -- 当前登录用户
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not logged in';
  end if;

  -- 插入评论
  insert into public.comments (
    video_id,
    author_id,
    content,
    parent_comment_id
  ) values (
    target_video_id,
    v_user_id,
    p_content,
    p_parent_comment_id
  );
end;
$$;

-- ------------------------------
-- 2. get_daily_likes_trend
-- 说明：
--   统计“当前登录用户上传的视频”
--   每天收到的总点赞数，用于折线图。
-- ------------------------------

CREATE OR REPLACE FUNCTION public.get_daily_likes_trend()
RETURNS TABLE (
  date text,
  total_likes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  return query
  with user_videos as (
    select id
    from public.videos
    where uploader_id = auth.uid()
      and is_deleted = false
  )
  select
    to_char(date_trunc('day', vl.created_at), 'YYYY-MM-DD') as date,
    count(*)::bigint as total_likes
  from public.video_likes vl
  join user_videos uv on uv.id = vl.video_id
  group by 1
  order by 1;
end;
$$;

-- ------------------------------
-- 3. get_interaction_stats
-- 说明：
--   统计当前用户所有视频的：
--   - 观看量
--   - 点赞数
--   - 评论数
--   返回三行：type / value
-- ------------------------------

CREATE OR REPLACE FUNCTION public.get_interaction_stats()
RETURNS TABLE (
  type text,
  value bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  return query
  with user_videos as (
    select id
    from public.videos
    where uploader_id = auth.uid()
      and is_deleted = false
  )
  select '观看量'::text as type,
         count(ve.*)::bigint as value
  from public.video_view_events ve
  join user_videos uv on uv.id = ve.video_id

  union all

  select '点赞数'::text as type,
         count(vl.*)::bigint as value
  from public.video_likes vl
  join user_videos uv on uv.id = vl.video_id

  union all

  select '评论数'::text as type,
         count(c.*)::bigint as value
  from public.comments c
  join user_videos uv on uv.id = c.video_id;
end;
$$;

-- ------------------------------
-- 4. handle_new_user
-- 说明：
--   触发器函数，挂在 auth.users 上，
--   用于在新用户注册时自动创建 public.profiles。
-- ------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    new.raw_user_meta_data->>'username'
  );

  return new;
end;
$$;

-- ------------------------------
-- 5. increment_view_count
-- 说明：
--   用于记录播放事件：
--   - 检查视频是否存在且可访问
--   - 往 video_view_events 中插入一条记录
--   通常会作为 RPC，从前端调用：rpc('increment_view_count', { video_id })
-- ------------------------------

CREATE OR REPLACE FUNCTION public.increment_view_count(
  video_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid(); -- 匿名访问时可能为 null

  -- 确保视频存在且为公开或属于当前用户
  if not exists (
    select 1
    from public.videos v
    where v.id = video_id
      and (
        (v.is_public = true and v.is_deleted = false)
        or v.uploader_id = current_user_id
      )
  ) then
    raise exception 'Video not found or not accessible';
  end if;

  insert into public.video_view_events (video_id, user_id)
  values (video_id, current_user_id);
end;
$$;

-- ------------------------------
-- 6. set_timestamp
-- 说明：
--   通用 updated_at 自动更新时间触发器函数。
--   返回 trigger，用于 BEFORE UPDATE。
-- ------------------------------

CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------
-- 7. toggle_like
-- 说明：
--   点赞 / 取消点赞的切换函数：
--   - 如果当前用户已经赞过 -> 取消
--   - 否则 -> 插入一条点赞记录
--   通常作为 RPC：rpc('toggle_like', { target_video_id })
-- ------------------------------

CREATE OR REPLACE FUNCTION public.toggle_like(
  target_video_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  current_user_id uuid;
  already_liked boolean;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Not logged in';
  end if;

  -- 确保视频存在且可见（或者属于自己）
  if not exists (
    select 1
    from public.videos v
    where v.id = target_video_id
      and (
        (v.is_public = true and v.is_deleted = false)
        or v.uploader_id = current_user_id
      )
  ) then
    raise exception 'Video not found or not accessible';
  end if;

  -- 检查是否已经点过赞
  select exists(
    select 1
    from public.video_likes
    where video_id = target_video_id
      and user_id = current_user_id
  ) into already_liked;

  if already_liked then
    -- 取消点赞
    delete from public.video_likes
    where video_id = target_video_id
      and user_id = current_user_id;
  else
    -- 点赞
    insert into public.video_likes (video_id, user_id)
    values (target_video_id, current_user_id)
    on conflict do nothing;
  end if;
end;
$$;
