import React from 'react'

import { Video } from '../../types'
import { EditIcon, TrashIcon, PlayIcon, EyeIcon } from '../Icons'

interface VideoTableProps {
  videos: Video[]
  onPreview: (url: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  onPreview,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
      <div className="overflow-x-auto">
        <table className="min-w-full transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
          <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">视频</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="flex-shrink-0 h-16 w-24 relative rounded bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-pointer group"
                      onClick={() => onPreview(video.videoUrl)}
                      title="预览播放"
                    >
                      <img className="h-16 w-24 object-cover" src={video.coverUrl} alt="cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <PlayIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">{video.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.duration}s</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                      <EyeIcon className="w-3 h-3" /> {video.viewCount}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                      ♥ {video.likeCount}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(video.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary hover:text-blue-800 mr-4 transition-colors" title="编辑" onClick={() => onEdit(video.id)}>
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(video.id)}
                    className="text-red-400 hover:text-red-600 transition-colors" 
                    title="删除"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {videos.length === 0 && (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400 text-sm">
            你还没有上传任何视频。
          </div>
        )}
      </div>
    </div>
  )
}
