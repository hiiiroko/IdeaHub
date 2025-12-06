import React from 'react'

import { User, Video } from '../../types'
import { FakeAvatar } from '../FakeAvatar'
import { EyeIcon, HeartIcon } from '../Icons'

interface VideoInfoProps {
  video: Video
  currentUser: User | null
  onRequireAuth?: () => void
  toggleLike: (id: string) => void
}

export const VideoInfo: React.FC<VideoInfoProps> = ({
  video,
  currentUser,
  onRequireAuth,
  toggleLike
}) => {
  return (
    <div className="p-6 border-b border-gray-100 dark:border-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">{video.title}</h2>
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <EyeIcon className="w-4 h-4" />
          <span>{video.viewCount.toLocaleString()} 次观看</span>
        </div>
        <span>•</span>
        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {video.tags.map((tag, idx) => (
          <span key={`${tag}-${idx}`} className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FakeAvatar name={video.uploader?.username || 'U'} size={40} />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{video.uploader?.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">作者</p>
          </div>
        </div>
        
        <button 
          onClick={() => { if (!currentUser) { onRequireAuth && onRequireAuth(); return } toggleLike(video.id) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            video.isLiked 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <HeartIcon className="w-5 h-5" fill={video.isLiked} />
          <span className="font-semibold">{video.likeCount}</span>
        </button>
      </div>
      
      {video.description && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          {video.description}
        </p>
      )}
    </div>
  )
}
