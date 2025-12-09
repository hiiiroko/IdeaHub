import React from 'react'

import { VideoPreview } from './VideoPreview'

interface VideoTaskPreviewProps {
  open: boolean
  videoUrl: string
  onUse: () => void
  onClose: () => void
}

export const VideoTaskPreview: React.FC<VideoTaskPreviewProps> = ({ open, videoUrl, onUse, onClose }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI 生成视频</h3>
          <div className="space-y-3">
            <div className="max-h-[60vh] overflow-auto">
              <VideoPreview url={videoUrl} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">关闭</button>
              <button onClick={onUse} className="px-4 py-2 rounded bg-primary text-white inline-flex items-center gap-2">
                使用视频
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
