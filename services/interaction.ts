import { supabase } from '../lib/supabase'
import type { Comment as DbComment, Profile } from '../types/index.ts'

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
     // Fallback optimistic
     return {
        id: 'temp-' + Date.now(),
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

export const fetchComments = async (videoId: string) => {
  // 1. Fetch parent comments
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
  if (!parents || parents.length === 0) return []

  // 2. Fetch replies
  const parentIds = parents.map(c => c.id)
  const { data: replies, error: replyError } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (id, username, uid, avatar_url)
    `)
    .in('parent_comment_id', parentIds)
    .order('created_at', { ascending: true })

  if (replyError) throw replyError

  // 3. Assemble
  // We can return flat list or nested.
  // The UI might expect flat list or nested?
  // `CommentList` usually expects a flat list or handles nesting.
  // Let's check `CommentList`.
  // For now, returning all comments (parents + replies) flat is usually easier if UI handles threading,
  // or we can return them as is.
  // The user guide says: "前端自己在内存里组装成...".
  
  return [...parents, ...(replies || [])] as unknown as DbComment[]
}
