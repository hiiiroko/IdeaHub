import React, { useEffect, useState } from 'react'

import { VIDEO_RESOLUTIONS, VIDEO_RATIOS, VIDEO_FPS_OPTIONS, VIDEO_DURATIONS } from '../../constants/video'
import { useApp } from '../../context/AppContext'
import { useVideoGeneration } from '../../hooks/useVideoGeneration'
import { toastError, toastSuccess } from '../../services/utils'
import { discardVideoGenerationTask } from '../../services/videoGeneration'
import type { GenerateVideoParams, VideoGenerationTask } from '../../types/video'

import { VideoGenerateForm } from './VideoGenerateForm'
import { VideoGenerateResult } from './VideoGenerateResult'

export const VideoGenerateModal: React.FC<{
  open: boolean
  onClose: () => void
  onSaved: (result: { taskId: string; videoUrl: string; coverUrl: string | null }) => void
  onStart?: (params: GenerateVideoParams) => void
  onReset?: () => void
}> = ({ open, onClose, onSaved, onStart, onReset }) => {
  const { currentUser, removeGenerationTask } = useApp()
  const { create, refresh, error, videoUrl, taskId, reset } = useVideoGeneration()
  const [params, setParams] = useState<GenerateVideoParams>({
    prompt: '',
    resolution: VIDEO_RESOLUTIONS[0].value,
    ratio: VIDEO_RATIOS[0].value,
    duration: VIDEO_DURATIONS.DEFAULT as 3|4|5,
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
    const identifier = { id: latestTask?.id, externalTaskId: latestTask?.external_task_id || taskId }
    if (!currentUser) {
      toastError('请先登录后再操作')
      return
    }
    if (!identifier.id && !identifier.externalTaskId) {
      toastError('缺少任务标识，无法丢弃')
      return
    }
    setDiscarding(true)
    try {
      await discardVideoGenerationTask(identifier, currentUser.id)
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
    }
  }, [open, reset, onReset])

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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {!generating && !videoUrl && taskId && (
            <div className="min-h-24 flex flex-col gap-3 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-base font-medium text-gray-900 dark:text-gray-100">任务已创建</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">任务 ID：{taskId}。生成可能需要数分钟，点击下方按钮刷新状态，或稍后在管理页查看。</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                  onClick={refreshStatus}
                >
                  刷新状态
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={onClose}
                >
                  关闭
                </button>
              </div>
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
