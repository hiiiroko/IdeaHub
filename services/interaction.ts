import { supabase } from '../lib/supabase'
import type { Comment as DbComment } from '../types/index.ts'
import type { Comment as UiComment } from '../types'
import { toUiComment } from './adapters'
import { v4 as uuidv4 } from 'uuid'

export const toggleLikeVideo = async (videoId: string) => {
  const { error } = await supabase.rpc('toggle_like', { target_video_id: videoId })
  if (error) {
    console.error('Supabase RPC Error:', error)
    throw error
  }
}

export const sendComment = async (
  videoId: string,
  content: string,
  parentCommentId: string | null = null,
): Promise<DbComment> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { error } = await supabase.rpc('add_comment', {
    target_video_id: videoId,
    content,
    parent_comment_id: parentCommentId,
  })

  if (error) throw error

  const { data: latestComment, error: fetchError } = await supabase
    .from('comments')
    .select('*, profiles(id, username, uid, avatar_url)')
    .eq('video_id', videoId)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !latestComment) {
    return {
      id: uuidv4(),
      video_id: videoId,
      author_id: user.id,
      content,
      parent_comment_id: parentCommentId,
      created_at: new Date().toISOString(),
      profiles: {
        id: user.id,
        username: user.user_metadata?.username || 'Me',
        uid: null,
        avatar_url: user.user_metadata?.avatar_url,
        bio: null,
        created_at: new Date().toISOString(),
      },
    } as DbComment
  }

  return latestComment as DbComment
}

export const incrementViewCount = async (videoId: string) => {
  await supabase.rpc('increment_view_count', { video_id: videoId })
}

export const fetchComments = async (videoId: string): Promise<UiComment[]> => {
  const { data: parents, error: parentError } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (id, username, uid, avatar_url)
    `)
    .eq('video_id', videoId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })

  if (parentError) throw parentError
  const safeParents = (parents || []) as DbComment[]
  if (safeParents.length === 0) return []

  const parentIds = safeParents.map(c => c.id)
  const { data: replies, error: replyError } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (id, username, uid, avatar_url)
    `)
    .in('parent_comment_id', parentIds)
    .order('created_at', { ascending: true })

  if (replyError) throw replyError
  const safeReplies = (replies || []) as DbComment[]

  const uiAll = [...safeParents, ...safeReplies].map(c => toUiComment(videoId, c))
  const map = new Map<string, UiComment>()
  uiAll.forEach(c => map.set(c.id, { ...c, replies: [] }))

  const roots: UiComment[] = []
  map.forEach(c => {
    if (c.parentId) {
      const parent = map.get(c.parentId)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(c)
      } else {
        roots.push(c)
      }
    } else {
      roots.push(c)
    }
  })

  return roots
}

export const fetchLikesForVideos = async (videoIds: string[]): Promise<Record<string, boolean>> => {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || videoIds.length === 0) return {}

  const { data, error } = await supabase
    .from('video_likes')
    .select('video_id')
    .in('video_id', videoIds)
    .eq('user_id', auth.user.id)

  if (error || !data) return {}

  const map: Record<string, boolean> = {}
  for (const row of data) {
    map[row.video_id] = true
  }
  return map
}
