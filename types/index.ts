export interface Profile {
  id: string
  username: string | null
  uid: number | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Video {
  id: string
  uploader_id: string
  title: string
  description: string | null
  tags: string[] | null
  video_path: string
  cover_path: string | null
  duration: number
  aspect_ratio: number
  is_public: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  // Optional fields that might be joined or computed
  profiles?: Profile
  view_count?: number // Computed/fetched separately
  like_count?: number // Computed/fetched separately
  is_liked?: boolean // Computed/fetched separately
  comment_count?: number // Computed/fetched separately
}

export interface VideoWithEngagementStats {
  video_id: string
  uploader_id: string
  title: string
  description: string | null
  tags: string[] | null
  video_path: string
  cover_path: string
  duration: number
  aspect_ratio: number
  is_public: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  total_comments: number
  top_level_comments: number
  total_likes: number
  total_views: number
}

export interface Comment {
  id: string
  video_id: string
  author_id: string
  content: string
  parent_comment_id: string | null
  created_at: string
  // Relations
  profiles?: Profile
}

export interface CommentWithReplies extends Comment {
  user: Profile // Mapped from profiles
  replies: Array<Comment & { user: Profile }>
}

// Legacy support or UI specific alias
export type UserProfile = Profile
