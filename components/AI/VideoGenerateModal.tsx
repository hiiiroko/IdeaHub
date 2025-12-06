import React, { useEffect, useState } from 'react'

import { VIDEO_RESOLUTIONS, VIDEO_RATIOS, VIDEO_FPS_OPTIONS, VIDEO_DURATIONS } from '../../constants/video'
import { useVideoGeneration } from '../../hooks/useVideoGeneration'
import { toastError, toastSuccess } from '../../services/utils'
import type { GenerateVideoParams } from '../../types/video'

import { VideoGenerateForm } from './VideoGenerateForm'
import { VideoGenerateResult } from './VideoGenerateResult'

export const VideoGenerateModal: React.FC<{
  open: boolean
  onClose: () => void
  onSaved: (result: { taskId: string; videoUrl: string; coverUrl: string | null }) => void
  onStart?: (params: GenerateVideoParams) => void
  onReset?: () => void
}> = ({ open, onClose, onSaved, onStart, onReset }) => {
  const { create, poll, error, videoUrl, taskId, reset } = useVideoGeneration()
  const [params, setParams] = useState<GenerateVideoParams>({ 
    prompt: '', 
    resolution: VIDEO_RESOLUTIONS[0].value, 
    ratio: VIDEO_RATIOS[0].value, 
    duration: VIDEO_DURATIONS.DEFAULT as 3|4|5, 
    fps: VIDEO_FPS_OPTIONS[0].value as 16|24
  })
  const [generating, setGenerating] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  const start = async () => {
    if (!params.prompt.trim()) { toastError('请输入提示词'); return }
    try {
      setGenerating(true)
      setCoverUrl(null)
      console.log('start → params:', params)
      if (onStart) onStart(params)
      const { id } = await create(params)
      console.log('start → created id:', id)
      const task = await poll(id)
      console.log('start → poll succeeded, videoUrl:', task.video_url)
      if (task.last_frame_url) {
          setCoverUrl(task.last_frame_url)
      }
    } catch (e: any) {
      toastError(e?.message || '生成失败')
      console.error('start → error:', e)
      setGenerating(false)
    }
  }

  const save = async () => {
    if (!videoUrl || !taskId) return
    // Just pass the info to parent, don't save to bucket yet
    onSaved({ taskId, videoUrl, coverUrl })
    toastSuccess('视频已生成，请完善信息后发布')
    reset()
    setGenerating(false)
    onClose()
  }

  useEffect(() => {
    if (!open) {
      reset()
      setGenerating(false)
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
              <div className="text-lg font-medium text-gray-900 dark:text-gray-100">AI 正在生成视频</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">请稍候，这可能需要几分钟...</div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {videoUrl && (
            <VideoGenerateResult
              videoUrl={videoUrl}
              saving={false}
              onClose={onClose}
              onSave={save}
            />
          )}
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}
        </div>
      </div>
    </div>
  )
}
