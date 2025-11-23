import type { Video as DbVideo, Comment as DbComment } from '../types/index.ts'
import type { Video as UiVideo, User, Comment as UiComment } from '../types.ts'

const toUiUser = (uploaderId: string, profile?: { username: string; uid: string }): User => {
  return {
    id: uploaderId,
    email: '',
    username: profile?.username || 'User',
    uid: profile?.uid || '',
    avatar: undefined,
    createdAt: ''
  }
}

const toUiComment = (videoId: string, c: DbComment): UiComment => {
  return {
    id: c.cid,
    content: c.content,
    userId: c.uid,
    videoId,
    createdAt: c.created_at,
    user: {
      id: c.uid,
      email: '',
      username: c.username,
      uid: c.uid,
      avatar: undefined,
      createdAt: ''
    }
  }
}

export const toUiVideo = (v: DbVideo, likedIds?: string[]): UiVideo => {
  const ui: UiVideo = {
    id: v.id,
    title: v.title,
    description: v.description || undefined,
    tags: v.tags || [],
    videoUrl: v.video_path,
    coverUrl: v.cover_path,
    aspectRatio: (v as any).aspect_ratio ?? 1.77,
    duration: (v as any).duration ?? 0,
    viewCount: v.view_count || 0,
    likeCount: v.like_count || 0,
    commentCount: Array.isArray(v.comments) ? v.comments.length : 0,
    createdAt: v.created_at,
    updatedAt: v.created_at,
    uploaderId: v.uploader_id,
    uploader: toUiUser(v.uploader_id, v.profiles),
    comments: Array.isArray(v.comments) ? v.comments.map(c => toUiComment(v.id, c)) : [],
    isLiked: likedIds ? likedIds.includes(v.id) : false
  }
  return ui
}