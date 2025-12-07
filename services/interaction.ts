import { v4 as uuidv4 } from 'uuid'

import { supabase } from '../lib/supabase'
import type { Comment as UiComment } from '../types'
import type { Comment as DbComment } from '../types/index.ts'

import { toUiComment } from './adapters'

export const toggleLikeVideo = async (videoId: string) => {
  const { error } = await supabase.rpc('toggle_like', { target_video_id: videoId })
  if (error) {
    console.error('Supabase RPC Error:', error)
    throw error
  }
}

export const fetchLikeStats = async (videoId: string): Promise<{ likeCount: number; isLiked: boolean }> => {
  const { data: auth } = await supabase.auth.getUser()
  let total = 0
  try {
    const { count } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId)
    total = count || 0
  } catch (e) {
    const { count } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact' })
      .eq('video_id', videoId)
    total = count || 0
  }

  let liked = false
  if (auth.user) {
    const { data: rows, error } = await supabase
      .from('video_likes')
      .select('video_id')
      .eq('video_id', videoId)
      .eq('user_id', auth.user.id)
      .limit(1)
    if (!error && rows && rows.length > 0) liked = true
  }
  return { likeCount: total || 0, isLiked: liked }
}

export const fetchLikeCountsForVideos = async (videoIds: string[]): Promise<Record<string, number>> => {
  if (videoIds.length === 0) return {}
  const { data, error } = await supabase
    .from('video_likes')
    .select('video_id')
    .in('video_id', videoIds)

  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data as Array<{ video_id: string }>) {
    counts[row.video_id] = (counts[row.video_id] || 0) + 1
  }
  return counts
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
    p_content: content,
    p_parent_comment_id: parentCommentId ?? null,
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
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (id, username, uid, avatar_url)
    `)
    .eq('video_id', videoId)
    .order('created_at', { ascending: true })

  if (error) throw error
  const flat = (data || []) as DbComment[]
  return flat.map(c => toUiComment(videoId, c))
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
