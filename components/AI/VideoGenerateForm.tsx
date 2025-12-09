import React from 'react'

import { VIDEO_RESOLUTIONS, VIDEO_RATIOS, VIDEO_FPS_OPTIONS, VIDEO_DURATIONS } from '../../constants/video'
import type { GenerateVideoParams } from '../../types/video'
import { SegmentedControl } from '../SegmentedControl'

interface VideoGenerateFormProps {
  params: GenerateVideoParams
  setParams: (params: GenerateVideoParams) => void
  generating: boolean
  saving: boolean
  onClose: () => void
  onStart: () => void
}

export const VideoGenerateForm: React.FC<VideoGenerateFormProps> = ({
  params,
  setParams,
  generating,
  saving,
  onClose,
  onStart
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI 生成视频</h3>

      <div className="space-y-1">
        <label className="text-xs text-gray-500 dark:text-gray-400">提示词</label>
        <textarea
          rows={3}
          value={params.prompt}
          onChange={(e)=>setParams({ ...params, prompt: e.target.value })}
          disabled={generating || saving}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
          placeholder="例如：夏日海滩·慢动作·轻快背景乐·广告片风格"
        />
      </div>

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

      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">时长：{params.duration} 秒</label>
          <input
            type="range"
            min={VIDEO_DURATIONS.MIN}
            max={VIDEO_DURATIONS.MAX}
            step={VIDEO_DURATIONS.STEP}
            value={params.duration}
            onChange={(e)=>setParams({ ...params, duration: Number(e.target.value) })}
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

      <div className="flex justify-end gap-2 pt-2">
        <button disabled={generating} onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">取消</button>
        <button disabled={generating} onClick={onStart} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">开始生成</button>
      </div>
    </div>
  )
}
