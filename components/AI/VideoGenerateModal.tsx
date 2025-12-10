import React, { useEffect, useState } from 'react'

import { VIDEO_RESOLUTIONS, VIDEO_RATIOS, VIDEO_FPS_OPTIONS, VIDEO_DURATIONS } from '../../constants/video'
import { useApp } from '../../context/AppContext'
import { useVideoGeneration } from '../../hooks/useVideoGeneration'
import { toastError, toastSuccess } from '../../services/utils'
import { discardVideoGenerationTask, fetchRecentVideoGenerationTasks } from '../../services/videoGeneration'
import type { GenerateVideoParams, VideoGenerationTask } from '../../types/video'

import { VideoGenerateForm } from './VideoGenerateForm'
import { VideoGenerateResult } from './VideoGenerateResult'

export const VideoGenerateModal: React.FC<{
  open: boolean
  onClose: () => void
  onSaved: (result: { taskId: string; videoUrl: string; coverUrl: string | null }) => void
  onStart?: (params: GenerateVideoParams) => void
  onReset?: () => void
  prefill?: Partial<GenerateVideoParams>
}> = ({ open, onClose, onSaved, onStart, onReset, prefill }) => {
  const { currentUser, removeGenerationTask, setGenerationTasks, updateGenerationTask } = useApp()
  const { create, refresh, error, videoUrl, taskId, reset } = useVideoGeneration()
  const [params, setParams] = useState<GenerateVideoParams>({
    prompt: '',
    resolution: VIDEO_RESOLUTIONS[0].value,
    ratio: VIDEO_RATIOS[0].value,
    duration: VIDEO_DURATIONS.DEFAULT,
    fps: VIDEO_FPS_OPTIONS[0].value as 16|24
  })
  const [generating, setGenerating] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [latestTask, setLatestTask] = useState<VideoGenerationTask | null>(null)
  const [discarding, setDiscarding] = useState(false)

  const start = async () => {
    if (!params.prompt.trim()) { toastError('请输入提示词'); return }
    try {
      setGenerating(true)
      setCoverUrl(null)
      setLatestTask(null)
      console.log('start → params:', params)
      if (onStart) onStart(params)
      const { id } = await create(params)
      console.log('start → created id:', id)
      if (id && currentUser) {
        const tasks = await fetchRecentVideoGenerationTasks(currentUser.id)
        setGenerationTasks(tasks)
      }
      toastSuccess('任务已创建，请在侧边栏查看进度')
      onClose()
    } catch (e: any) {
      toastError(e?.message || '生成失败')
      console.error('start → error:', e)
    }
    setGenerating(false)
  }

  const refreshStatus = async () => {
    if (!taskId) return
    setGenerating(true)
    try {
      const task = await refresh(taskId)
      if (!task) {
        toastError('未获取到任务信息')
        return
      }
      setLatestTask(task)
      if (task.last_frame_url) {
        setCoverUrl(task.last_frame_url)
      }
      updateGenerationTask(task.id, task)
      if (currentUser) {
        const tasks = await fetchRecentVideoGenerationTasks(currentUser.id)
        setGenerationTasks(tasks)
      }
      if (task.status !== 'succeeded') {
        toastSuccess('任务仍在进行中，请稍后再试')
      }
    } catch (e: any) {
      toastError(e?.message || '查询任务状态失败')
    } finally {
      setGenerating(false)
    }
  }

  const save = async () => {
    if (!videoUrl || !taskId) return
    // Just pass the info to parent, don't save to bucket yet
    onSaved({ taskId, videoUrl, coverUrl })
    toastSuccess('请完善视频信息')
    reset()
    setGenerating(false)
    onClose()
  }

  const discardTask = async () => {
    const externalId = latestTask?.external_task_id || taskId
    if (!currentUser) {
      toastError('请先登录后再操作')
      return
    }
    if (!externalId) {
      toastError('缺少 externalTaskId，无法丢弃')
      return
    }
    console.log('[discard] task from modal:', latestTask)
    console.log('[discard] identifier:', {
      id: latestTask?.id,
      externalTaskId: externalId,
      userId: currentUser.id,
    })
    setDiscarding(true)
    try {
      await discardVideoGenerationTask(externalId, currentUser.id)
      if (latestTask?.id) {
        removeGenerationTask(latestTask.id)
      }
      toastSuccess('任务已丢弃')
      reset()
      setGenerating(false)
      setCoverUrl(null)
      setLatestTask(null)
      onClose()
    } catch (e: any) {
      console.error(e)
      toastError(e?.message || '丢弃任务失败')
    } finally {
      setDiscarding(false)
    }
  }

  useEffect(() => {
    if (!open) {
      reset()
      setGenerating(false)
      setLatestTask(null)
      setDiscarding(false)
      if (onReset) onReset()
    } else if (prefill) {
      setParams(prev => ({ ...prev, ...prefill }))
    }
  }, [open, reset, onReset, prefill])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {!videoUrl && !generating && (
            <VideoGenerateForm
              params={params}
              setParams={setParams}
              generating={generating}
              saving={false}
              onClose={onClose}
              onStart={start}
            />
          )}
          
          {generating && !videoUrl && (
            <div className="min-h-24 flex items-center justify-center flex-col gap-4 p-8">
              <div className="text-lg font-medium text-gray-900 dark:text-gray-100">正在处理...</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">任务创建或查询中，请稍候</div>
              <div className="h-8 w-8 rounded-full border-2 border-primary/70 border-t-transparent animate-spin"></div>
            </div>
          )}

          {videoUrl && (
            <VideoGenerateResult
              videoUrl={videoUrl}
              saving={false}
              onClose={onClose}
              onSave={save}
              onDiscard={discardTask}
              discarding={discarding}
            />
          )}
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}
        </div>
      </div>
    </div>
  )
}
