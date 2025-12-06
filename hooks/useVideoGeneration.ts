import { useCallback, useRef, useState } from 'react'

import { supabase } from '../lib/supabase'
import type { GenerateVideoParams, VideoGenerationTask } from '../types/video'

export const useVideoGeneration = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const pollTimer = useRef<number | null>(null)
  const [taskId, setTaskId] = useState<string>('')
  const inFlightRef = useRef(false)
  const terminalRef = useRef(false)

  const create = useCallback(async (params: GenerateVideoParams) => {
    setError(null)
    setLoading(true)
    
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
  }, [])

  const poll = useCallback(async (taskIdArg?: string) => {
    setError(null)
    terminalRef.current = false
    const effectiveId = taskIdArg || taskId
    if (!effectiveId) throw new Error('任务未创建')
    
    console.log('[useVideoGeneration] poll → taskId:', effectiveId)
    
    return new Promise<VideoGenerationTask>((resolve, reject) => {
      let elapsed = 0
      let attempt = 0
      let stopped = false

      const run = async () => {
        if (stopped || terminalRef.current) return
        if (videoUrl) {
            // If we already have a videoUrl, maybe we are done? 
            // But let's stick to the task status check.
        }

        try {
          if (inFlightRef.current) return
          inFlightRef.current = true
          
          attempt += 1
          
          const { data, error } = await supabase.functions.invoke('generate-video', {
              body: { 
                  action: 'query', 
                  taskId: effectiveId 
              }
          })

          if (error) {
              throw error
          }
          
          const task = data as VideoGenerationTask
          console.log('[useVideoGeneration] poll → attempt', attempt, 'task:', task)

          if (task.status === 'succeeded') {
            // Task succeeded, but video_url might be a temp URL from Ark.
            // The user guide says: "video_url: Ark 临时 MP4 地址"
            // "last_frame_url: Ark 尾帧 PNG 地址"
            // We can use this URL to preview.
            // Later the user can "download/publish" it.
            
            if (task.video_url) {
                setVideoUrl(task.video_url)
                console.log('[useVideoGeneration] poll → succeeded video_url:', task.video_url)
            }
            
            stopped = true
            terminalRef.current = true
            if (pollTimer.current) {
              clearTimeout(pollTimer.current)
              pollTimer.current = null
            }
            resolve(task)
            return
          }
          
          if (task.status === 'failed') {
            stopped = true
            terminalRef.current = true
            if (pollTimer.current) {
              clearTimeout(pollTimer.current)
              pollTimer.current = null
            }
            const errMsg = task.error_message || '生成失败'
            setError(errMsg)
            reject(new Error(errMsg))
            return
          }
          
          // Check for timeout
          elapsed += 3000
          if (elapsed >= 300000) { // 5 minutes timeout
            stopped = true
            terminalRef.current = true
            if (pollTimer.current) {
              clearTimeout(pollTimer.current)
              pollTimer.current = null
            }
            setError('生成超时')
            reject(new Error('生成超时'))
            return
          }

        } catch (e: any) {
          console.error('[useVideoGeneration] poll → error:', e)
          // Don't stop on transient errors, but maybe if too many?
          // For now, we just log and retry.
        } finally {
          inFlightRef.current = false
        }
        
        const nextDelay = 3000
        pollTimer.current = window.setTimeout(run, nextDelay)
      }

      run()
    })
  }, [taskId, videoUrl])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setVideoUrl('')
    setTaskId('')
    if (pollTimer.current) clearTimeout(pollTimer.current)
    pollTimer.current = null
    terminalRef.current = false
    inFlightRef.current = false
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

  return { create, poll, publish, loading, error, videoUrl, taskId, reset }
}
