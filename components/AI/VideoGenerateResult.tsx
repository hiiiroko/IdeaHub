import React from 'react'

import { VideoPreview } from './VideoPreview'

interface VideoGenerateResultProps {
  videoUrl: string
  saving: boolean
  onClose: () => void
  onSave: () => void
}

export const VideoGenerateResult: React.FC<VideoGenerateResultProps> = ({
  videoUrl,
  saving,
  onClose,
  onSave
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI 生成视频</h3>
      <div className="space-y-3">
        <div className="max-h-[60vh] overflow-auto">
          <VideoPreview url={videoUrl} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button disabled={saving} onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">取消</button>
          <button disabled={saving} onClick={onSave} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50 inline-flex items-center gap-2">
            {saving && (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            )}
            使用视频
          </button>
        </div>
      </div>
    </div>
  )
}
