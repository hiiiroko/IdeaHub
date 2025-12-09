import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { supabase } from '../lib/supabase'
import { toastError, toastSuccess } from '../services/utils'
import type { VideoGenerationTask } from '../types/video'

export interface TrackedVideoTask {
  taskId: string
  status: VideoGenerationTask['status'] | 'queued'
  videoUrl?: string
  coverUrl?: string | null
  loading?: boolean
}

interface PendingUseResult {
  taskId: string
  videoUrl: string
  coverUrl: string | null
}

interface VideoGenerationTasksContextValue {
  tasks: TrackedVideoTask[]
  previewTask: TrackedVideoTask | null
  pendingUseResult: PendingUseResult | null
  addTask: (taskId: string, initial?: Partial<TrackedVideoTask>) => void
  updateTask: (taskId: string, patch: Partial<TrackedVideoTask>) => void
  removeTask: (taskId: string) => void
  refreshTask: (taskId: string) => Promise<VideoGenerationTask | null>
  openPreview: (taskId: string) => void
  closePreview: () => void
  setPendingUseResult: (result: PendingUseResult | null) => void
}

const VideoGenerationTasksContext = createContext<VideoGenerationTasksContextValue | null>(null)

export const VideoGenerationTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TrackedVideoTask[]>([])
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null)
  const [pendingUseResult, setPendingUseResult] = useState<PendingUseResult | null>(null)

  const addTask = useCallback((taskId: string, initial: Partial<TrackedVideoTask> = {}) => {
    setTasks(prev => {
      const exists = prev.find(t => t.taskId === taskId)
      if (exists) {
        return prev.map(t => t.taskId === taskId ? { ...t, ...initial } : t)
      }
      return [...prev, { taskId, status: 'queued', ...initial }]
    })
  }, [])

  const updateTask = useCallback((taskId: string, patch: Partial<TrackedVideoTask>) => {
    setTasks(prev => prev.map(t => (t.taskId === taskId ? { ...t, ...patch } : t)))
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.taskId !== taskId))
    setPreviewTaskId(prev => (prev === taskId ? null : prev))
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token || null
    if (!token) {
      toastError('请先登录再使用 AI 生成功能')
    }
    return token
  }, [])

  const refreshTask = useCallback(async (taskId: string) => {
    updateTask(taskId, { loading: true })
    const accessToken = await getAccessToken()
    if (!accessToken) {
      updateTask(taskId, { loading: false })
      return null
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          action: 'sync_from_ark',
          taskId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (error) {
        throw error
      }

      const task = data as VideoGenerationTask
      updateTask(taskId, {
        status: task.status,
        videoUrl: task.video_url || undefined,
        coverUrl: task.last_frame_url,
        loading: false,
      })
      if (task.status === 'succeeded' && task.video_url) {
        toastSuccess('生成完成')
      } else {
        toastSuccess('任务仍在进行中，请稍后再试')
      }
      return task
    } catch (e: any) {
      toastError(e?.message || '查询任务状态失败')
      updateTask(taskId, { loading: false })
      return null
    }
  }, [getAccessToken, updateTask])

  const previewTask = useMemo(() => tasks.find(t => t.taskId === previewTaskId) || null, [tasks, previewTaskId])

  const openPreview = useCallback((taskId: string) => {
    const target = tasks.find(t => t.taskId === taskId)
    if (target?.videoUrl) {
      setPreviewTaskId(taskId)
    }
  }, [tasks])

  const closePreview = useCallback(() => setPreviewTaskId(null), [])

  const value = useMemo(() => ({
    tasks,
    previewTask,
    pendingUseResult,
    addTask,
    updateTask,
    removeTask,
    refreshTask,
    openPreview,
    closePreview,
    setPendingUseResult,
  }), [tasks, previewTask, pendingUseResult, addTask, updateTask, removeTask, refreshTask, openPreview, closePreview])

  return (
    <VideoGenerationTasksContext.Provider value={value}>
      {children}
    </VideoGenerationTasksContext.Provider>
  )
}

export const useVideoGenerationTasks = () => {
  const ctx = useContext(VideoGenerationTasksContext)
  if (!ctx) throw new Error('useVideoGenerationTasks must be used within VideoGenerationTasksProvider')
  return ctx
}
