import { useCallback, useState } from 'react'

import { supabase } from '../lib/supabase'
import type { GenerateVideoParams, VideoGenerationTask } from '../types/video'

export const useVideoGeneration = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')

  const create = useCallback(async (params: GenerateVideoParams) => {
    setError(null)
    setLoading(true)

    try {
      console.log('[useVideoGeneration] create → body:', { action: 'create', ...params })

      const { data, error } = await supabase.functions.invoke('generate-video', {
          body: {
              action: 'create',
              ...params
          }
      })

      if (error) {
          console.error('[useVideoGeneration] create → error:', error)
          throw new Error(`create failed: ${error.message}`)
      }

      // data should contain externalTaskId
      const id = data?.externalTaskId
      if (!id) throw new Error('任务创建返回缺少 externalTaskId')

      setTaskId(id)
      console.log('[useVideoGeneration] create → taskId:', id)
      return { id }
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async (taskIdArg?: string) => {
    setError(null)
    const effectiveId = taskIdArg || taskId
    if (!effectiveId) throw new Error('任务未创建')

    const { data, error } = await supabase.functions.invoke('generate-video', {
      body: {
        action: 'query',
        taskId: effectiveId,
      },
    })

    if (error) {
      console.error('[useVideoGeneration] refresh → error:', error)
      throw new Error(error.message)
    }

    const task = data as VideoGenerationTask
    if (task.status === 'succeeded' && task.video_url) {
      setVideoUrl(task.video_url)
    }
    return task
  }, [taskId])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setVideoUrl('')
    setTaskId('')
  }, [])

  // New function to publish
  const publish = useCallback(async (taskIdToPublish: string, meta: { title: string; description: string; tags: string[] }) => {
      const { data, error } = await supabase.functions.invoke('generate-video', {
          body: {
              action: 'download',
              taskId: taskIdToPublish,
              title: meta.title,
              description: meta.description,
              tags: meta.tags
              // duration, aspect_ratio optional
          }
      })
      if (error) throw error
      return data // { taskId, video, videoPublicUrl, coverPublicUrl }
  }, [])

  return { create, refresh, publish, loading, error, videoUrl, taskId, reset }
}
