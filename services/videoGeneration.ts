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
  externalTaskId: string,
  userId: string
) => {
  if (!externalTaskId) {
    throw new Error('缺少 externalTaskId，无法丢弃任务')
  }

  const { data, error } = await supabase
    .from('video_generation_tasks')
    .update({ is_discarded: true })
    .eq('external_task_id', externalTaskId)
    .eq('user_id', userId)
    .select('id, external_task_id, is_discarded')
    .maybeSingle()

  if (error) {
    console.error('[discardVideoGenerationTask] supabase error:', error)
    throw new Error(error.message || '丢弃任务失败')
  }

  if (!data) {
    throw new Error('未找到对应的生成任务，无法丢弃')
  }

  return data
}
