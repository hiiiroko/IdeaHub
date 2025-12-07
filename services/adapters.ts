import { supabase } from '../lib/supabase'
import type { Video as DbVideo, Comment as DbComment, Profile } from '../types/index.ts'
import type { Video as UiVideo, User, Comment as UiComment } from '../types.ts'

const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'IdeaUploads'

const getPublicUrl = (path: string | null) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const toUiUser = (uploaderId: string, profile?: Profile): User => {
  const fallbackName = profile?.username || '未命名用户'
  const fallbackUid = profile?.uid != null ? profile.uid.toString() : uploaderId.slice(0, 8)
  return {
    id: uploaderId,
    email: '', // Profile doesn't have email usually for privacy
    username: fallbackName,
    uid: fallbackUid,
    avatar: profile?.avatar_url || undefined,
    createdAt: profile?.created_at || ''
  }
}

export const toUiComment = (videoId: string, c: DbComment): UiComment => {
  return {
    id: c.id,
    content: c.content,
    userId: c.author_id,
    videoId,
    createdAt: c.created_at,
    parentId: c.parent_comment_id ?? null,
    user: c.profiles
      ? toUiUser(c.author_id, c.profiles)
      : {
          id: c.author_id,
          email: '',
          username: '匿名用户',
          uid: c.author_id.slice(0, 8),
          avatar: undefined,
          createdAt: '',
        },
    replies: [],
  }
}

export const toUiVideo = (v: DbVideo): UiVideo => {
  return {
    id: v.id,
    title: v.title ?? '',
    description: v.description ?? undefined,
    tags: v.tags ?? [],
    videoUrl: getPublicUrl(v.video_path),
    coverUrl: getPublicUrl(v.cover_path),
    aspectRatio: v.aspect_ratio ?? 1.77,
    duration: v.duration ?? 0,
    viewCount: v.view_count ?? 0,
    likeCount: v.like_count ?? 0,
    commentCount: v.comment_count ?? 0,
    createdAt: v.created_at ?? new Date().toISOString(),
    updatedAt: v.updated_at ?? v.created_at ?? new Date().toISOString(),
    uploaderId: v.uploader_id,
    uploader: toUiUser(v.uploader_id, v.profiles),
    comments: [],
    isLiked: !!v.is_liked,
  }
}
