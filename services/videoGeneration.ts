import { supabase } from '../lib/supabase'
import type { VideoGenerationTask } from '../types/video'

const RECENT_WINDOW_MS = 12 * 60 * 60 * 1000

export const fetchRecentVideoGenerationTasks = async (
  userId: string
): Promise<VideoGenerationTask[]> => {
  const since = new Date(Date.now() - RECENT_WINDOW_MS).toISOString()

  const { data, error } = await supabase
    .from('video_generation_tasks')
    .select(
      `id, user_id, external_task_id, status, is_discarded, prompt, resolution, ratio, duration, fps, video_url, last_frame_url, error_message, created_at, updated_at`
    )
    .eq('user_id', userId)
    .eq('is_discarded', false)
    .in('status', ['queued', 'running', 'succeeded'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as VideoGenerationTask[]
}

export const discardVideoGenerationTask = async (
  identifier: { id?: number; externalTaskId?: string },
  userId: string
) => {
  const { id, externalTaskId } = identifier
  if (!id && !externalTaskId) {
    throw new Error('缺少任务标识，无法丢弃任务')
  }

  let query = supabase
    .from('video_generation_tasks')
    .update({ is_discarded: true })
    .eq('user_id', userId)

  query = id ? query.eq('id', id) : query.eq('external_task_id', externalTaskId as string)

  const { data, error } = await query.select('id, is_discarded').maybeSingle()
  if (error) throw error
  if (!data) {
    throw new Error('未找到对应的生成任务，无法丢弃')
  }
}

