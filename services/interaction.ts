import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { Comment as DbComment } from '../types/index.ts'

export const toggleLikeVideo = async (videoId: string) => {
  const { error } = await supabase.rpc('toggle_like', { target_video_id: videoId })
  if (error) {
    console.error('Supabase RPC Error:', error)
    throw error
  }
}

export const sendComment = async (videoId: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, uid')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('用户档案不存在')

  const newComment: DbComment = {
    cid: uuidv4(),
    uid: profile.uid,
    username: profile.username,
    content,
    created_at: new Date().toISOString()
  }

  const { error } = await supabase.rpc('add_comment', {
    target_video_id: videoId,
    payload: newComment
  })
  if (error) throw error
  return newComment
}

export const incrementViewCount = async (videoId: string) => {
  await supabase.rpc('increment_view_count', { video_id: videoId })
}