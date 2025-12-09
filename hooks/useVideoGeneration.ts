import { useCallback, useMemo, useState } from 'react'

import { supabase } from '../lib/supabase'
import { toastError, toastSuccess } from '../services/utils'
import type { GenerateVideoParams, VideoGenerationTask } from '../types/video'

type GenerationStatus =
  | 'idle'
  | 'creating'
  | 'syncing'
  | 'polling'
  | 'publishing'
  | 'ready'
  | 'error'

export const useVideoGeneration = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [lastError, setLastError] = useState<string | null>(null)

  const isBusy = useMemo(
    () => ['creating', 'syncing', 'publishing', 'polling'].includes(status),
    [status]
  )

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token || null
    if (!token) {
      toastError('请先登录再使用 AI 生成功能')
      setStatus('idle')
    }
    return token
  }, [])

  const handleInvokeError = (prefix: string, invokeError: any, fallback: string) => {
    console.error(`${prefix} → error:`, invokeError)
    const msg = invokeError?.message || invokeError?.error || fallback
    setError(msg)
    setLastError(msg)
    toastError(msg.startsWith('生成') ? msg : `${fallback}：${msg}`)
    setStatus('error')
    setLoading(false)
  }

  const normalizeCatchError = (prefix: string, e: any, fallback: string) => {
    console.error(`${prefix} → error:`, e)
    const msg =
      e?.message?.includes('Failed to send a request to the Edge Function')
        ? '生成服务暂时不可用，请稍后重试'
        : e instanceof Error
          ? e.message
          : fallback
    setError(msg)
    setLastError(msg)
    toastError(msg.startsWith('生成') ? msg : `${fallback}：${msg}`)
    setStatus('error')
    setLoading(false)
    return msg
  }

  const create = useCallback(
    async (params: GenerateVideoParams) => {
      setError(null)
      setLastError(null)
      setStatus('creating')
      setLoading(true)

      const accessToken = await getAccessToken()
      if (!accessToken) {
        setLoading(false)
        return null
      }

      const body = { action: 'create', ...params }
      console.log('[useVideoGeneration] start → params:', params)
      console.log('[useVideoGeneration] create → body:', body)

      try {
        const { data, error: invokeError } = await supabase.functions.invoke('generate-video', {
          body,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (invokeError) {
          handleInvokeError('[useVideoGeneration] create', invokeError, '生成任务创建失败，请稍后重试')
          return null
        }

        const id = (data as any)?.externalTaskId
        if (!id) {
          handleInvokeError('[useVideoGeneration] create', { message: '任务创建返回缺少 externalTaskId' }, '生成任务创建失败，请稍后重试')
          return null
        }

        setTaskId(id)
        setStatus('polling')
        toastSuccess('生成任务已创建')
        console.log('[useVideoGeneration] create → taskId:', id)
        return { id }
      } catch (e: any) {
        normalizeCatchError('[useVideoGeneration] start', e, '生成任务创建失败，请稍后重试')
        return null
      } finally {
        setLoading(false)
      }
    },
    [getAccessToken]
  )

  const refresh = useCallback(
    async (taskIdArg?: string) => {
      setError(null)
      setLastError(null)
      const effectiveId = taskIdArg || taskId
      if (!effectiveId) {
        const msg = '任务未创建'
        setError(msg)
        setLastError(msg)
        toastError(msg)
        return null
      }

      setStatus('syncing')
      setLoading(true)

      const accessToken = await getAccessToken()
      if (!accessToken) {
        setLoading(false)
        return null
      }

      try {
        console.log('[useVideoGeneration] sync_from_ark → body:', { action: 'sync_from_ark', taskId: effectiveId })
        const { data, error: invokeError } = await supabase.functions.invoke('generate-video', {
          body: {
            action: 'sync_from_ark',
            taskId: effectiveId,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (invokeError) {
          handleInvokeError('[useVideoGeneration] sync_from_ark', invokeError, '任务状态同步失败，请稍后重试')
          return null
        }

        const task = data as VideoGenerationTask
        if (task.status === 'succeeded' && task.video_url) {
          setVideoUrl(task.video_url)
          setStatus('ready')
          toastSuccess('生成完成')
        } else {
          setStatus('polling')
        }
        return task
      } catch (e: any) {
        normalizeCatchError('[useVideoGeneration] sync_from_ark', e, '任务状态同步失败，请稍后重试')
        return null
      } finally {
        setLoading(false)
      }
    },
    [getAccessToken, taskId]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setLastError(null)
    setVideoUrl('')
    setTaskId('')
    setStatus('idle')
  }, [])

  const publish = useCallback(
    async (taskIdToPublish: string, meta: { title: string; description: string; tags: string[] }) => {
      setStatus('publishing')
      setLoading(true)
      setError(null)
      setLastError(null)

      const accessToken = await getAccessToken()
      if (!accessToken) {
        setLoading(false)
        return null
      }

      try {
        console.log('[useVideoGeneration] publish → body:', {
          action: 'download',
          taskId: taskIdToPublish,
          ...meta,
        })
        const { data, error: invokeError } = await supabase.functions.invoke('generate-video', {
          body: {
            action: 'download',
            taskId: taskIdToPublish,
            title: meta.title,
            description: meta.description,
            tags: meta.tags,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (invokeError) {
          handleInvokeError('[useVideoGeneration] publish', invokeError, '发布生成视频失败，请稍后重试')
          return null
        }
        toastSuccess('生成视频已发布')
        setStatus('ready')
        return data // { taskId, video, videoPublicUrl, coverPublicUrl }
      } catch (e: any) {
        normalizeCatchError('[useVideoGeneration] publish', e, '发布生成视频失败，请稍后重试')
        return null
      } finally {
        setLoading(false)
      }
    },
    [getAccessToken]
  )

  return {
    create,
    refresh,
    publish,
    loading,
    error,
    videoUrl,
    taskId,
    reset,
    status,
    isBusy,
    lastError,
  }
}
