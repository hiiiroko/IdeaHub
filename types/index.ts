export interface Comment {
  cid: string
  uid: string
  username: string
  content: string
  created_at: string
}

export interface Video {
  id: string
  uploader_id: string
  title: string
  description: string | null
  tags: string[]
  video_path: string
  cover_path: string
  aspect_ratio: number
  view_count: number
  like_count: number
  comments: Comment[]
  created_at: string
  profiles?: {
    username: string
    uid: string
  }
}

export interface UserProfile {
  id: string
  username: string
  uid: string
  liked_video_ids: string[]
}