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

export const sendComment = async (videoId: string, content: string, parentCommentId: string | null = null) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase.rpc('add_comment', {
    target_video_id: videoId,
    content,
    parent_comment_id: parentCommentId
  })

  if (error) throw error

  // Fetch the latest comment by this user on this video
  const { data: latestComment, error: fetchError } = await supabase
    .from('comments')
    .select('*, profiles(username, uid, avatar_url)')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !latestComment) {
     // Fallback optimistic with a UUID to keep reply flows working
     return {
        id: uuidv4(),
        video_id: videoId,
        user_id: user.id,
        content,
        parent_comment_id: parentCommentId,
        created_at: new Date().toISOString(),
        profiles: {
            username: user.user_metadata?.username || 'Me',
            uid: null,
            id: user.id,
            avatar_url: user.user_metadata?.avatar_url,
            bio: null,
            created_at: new Date().toISOString()
        }
     } as unknown as DbComment
  }
  
  return latestComment as unknown as DbComment
}

export const incrementViewCount = async (videoId: string) => {
  await supabase.rpc('increment_view_count', { video_id: videoId })
}

const buildThreadedComments = (videoId: string, parents: DbComment[], replies: DbComment[]): UiComment[] => {
  const replyMap: Record<string, UiComment[]> = {}

  for (const r of replies) {
    if (!r.parent_comment_id) continue
    const ui = toUiComment(videoId, r)
    const list = replyMap[r.parent_comment_id] || (replyMap[r.parent_comment_id] = [])
    list.push(ui)
  }

  return parents.map(p => {
    const uiParent = toUiComment(videoId, p)
    const children = replyMap[p.id] || []
    return {
      ...uiParent,
      replies: children,
    }
  })
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

  const parentList = parents || []
  if (parentList.length === 0) return []

  const parentIds = parentList.map(c => c.id)
  const { data: replies, error: replyError } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (id, username, uid, avatar_url)
    `)
    .in('parent_comment_id', parentIds)
    .order('created_at', { ascending: true })

  if (replyError) throw replyError

  return buildThreadedComments(videoId, parentList as DbComment[], (replies || []) as DbComment[])
}

export const fetchLikesForVideos = async (videoIds: string[]) => {
  if (videoIds.length === 0) return {}

  const { data: auth } = await supabase.auth.getUser()
  const currentUserId = auth.user?.id ?? null

  const { data, error } = await supabase
    .from('video_likes')
    .select('video_id, user_id')
    .in('video_id', videoIds)

  if (error) throw error

  const result: Record<string, { count: number; isLiked: boolean }> = {}

  for (const row of data || []) {
    const vid = row.video_id as string
    if (!result[vid]) {
      result[vid] = { count: 0, isLiked: false }
    }
    result[vid].count += 1
    if (currentUserId && row.user_id === currentUserId) {
      result[vid].isLiked = true
    }
  }

  return result
}
