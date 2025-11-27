import React, { useEffect, useState } from 'react'

import { VIDEO_RESOLUTIONS, VIDEO_RATIOS, VIDEO_FPS_OPTIONS, VIDEO_DURATIONS } from '../../constants/video'
import { useUploadToBucket } from '../../hooks/useUploadToBucket'
import { useVideoGeneration } from '../../hooks/useVideoGeneration'
import { toastError, toastSuccess } from '../../services/utils'
import type { GenerateVideoParams } from '../../types/video'
import { captureFirstFrame } from '../../utils/media'
import { SegmentedControl } from '../SegmentedControl'

import { VideoPreview } from './VideoPreview'

export const VideoGenerateModal: React.FC<{
  open: boolean
  onClose: () => void
  onSaved: (publicUrl: string, coverBlob: Blob) => void
  onStart?: (params: GenerateVideoParams) => void
  onReset?: () => void
}> = ({ open, onClose, onSaved, onStart, onReset }) => {
  const { create, poll, error, videoUrl, taskId, reset } = useVideoGeneration()
  const { saveToBucket } = useUploadToBucket()
  const [params, setParams] = useState<GenerateVideoParams>({ 
    prompt: '', 
    resolution: VIDEO_RESOLUTIONS[0].value, 
    ratio: VIDEO_RATIOS[0].value, 
    duration: VIDEO_DURATIONS.DEFAULT as 3|4|5, 
    fps: VIDEO_FPS_OPTIONS[0].value as 16|24
  })
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  

  const start = async () => {
    if (!params.prompt.trim()) { toastError('请输入提示词'); return }
    try {
      setGenerating(true)
      console.log('start → params:', params)
      if (onStart) onStart(params)
      const { id } = await create(params)
      console.log('start → created id:', id)
      const status = await poll(id)
      console.log('start → poll succeeded, videoUrl:', status.content?.video_url)
    } catch (e: any) {
      toastError(e?.message || '生成失败')
      console.error('start → error:', e)
      setGenerating(false)
    }
  }

  const save = async () => {
    if (!videoUrl || !taskId) return
    try {
      setSaving(true)
      const { videoPath } = await saveToBucket(taskId, videoUrl)
      const coverBlob = await captureFirstFrame(videoPath)
      toastSuccess('生成成功，已保存到项目')
      onSaved(videoPath, coverBlob)
      reset()
      setGenerating(false)
      setSaving(false)
      onClose()
    } catch (e: any) {
      toastError(e?.message || '保存失败')
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!open) {
      reset()
      setGenerating(false)
      setSaving(false)
      if (onReset) onReset()
    }
  }, [open, reset, onReset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI 生成视频</h3>
          <div className="space-y-3">
            <textarea 
              maxLength={200} 
              value={params.prompt} 
              onChange={(e)=>setParams({...params,prompt:e.target.value})} 
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              placeholder="提示词（描述你希望生成的视频）" 
              rows={3} 
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">分辨率</label>
                <SegmentedControl
                  options={VIDEO_RESOLUTIONS}
                  value={params.resolution}
                  onChange={(v)=>setParams({ ...params, resolution: v as any })}
                  size="sm"
                  disabled={generating || saving}
                  ariaLabel="分辨率"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">画面比例</label>
                <SegmentedControl
                  options={VIDEO_RATIOS}
                  value={params.ratio}
                  onChange={(v)=>setParams({ ...params, ratio: v as any })}
                  size="sm"
                  disabled={generating || saving}
                  ariaLabel="画面比例"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">时长：{params.duration} 秒</label>
                <input 
                  type="range" 
                  min={VIDEO_DURATIONS.MIN} 
                  max={VIDEO_DURATIONS.MAX} 
                  step={VIDEO_DURATIONS.STEP} 
                  value={params.duration} 
                  onChange={(e)=>setParams({...params,duration:Number(e.target.value) as any})} 
                  className="w-full" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">帧率</label>
                <SegmentedControl
                  options={VIDEO_FPS_OPTIONS}
                  value={params.fps}
                  onChange={(v)=>setParams({ ...params, fps: v as any })}
                  size="sm"
                  disabled={generating || saving}
                  ariaLabel="帧率"
                />
              </div>
            </div>
          </div>
          {!videoUrl && (
            <div className="flex justify-end gap-2 pt-2">
              <button disabled={generating} onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">取消</button>
              <button disabled={generating} onClick={start} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">开始生成</button>
            </div>
          )}
          {generating && !videoUrl && (
            <div className="min-h-24 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">正在生成视频，请稍候…</div>
          )}
          {videoUrl && (
            <div className="space-y-3">
              <div className="max-h-[60vh] overflow-auto">
                <VideoPreview url={videoUrl} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button disabled={saving} onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">取消</button>
                <button disabled={saving} onClick={save} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50 inline-flex items-center gap-2">
                  {saving && (
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  )}
                  使用视频
                </button>
              </div>
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  )
}
