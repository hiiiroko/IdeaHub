
+5
-5

import React from 'react'

import { VideoWithEngagementStats } from '../../types/index'
import { EditIcon, TrashIcon, PlayIcon, EyeIcon, HeartIcon, CommentIcon, FireIcon } from '../Icons'

interface VideoTableProps {
  videos: VideoWithEngagementStats[]
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
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">视频</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">热度</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">观看</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">点赞</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评论</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上传日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日期</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
            {videos.map((video) => {
              // Construct full URLs if needed, assuming relative path from DB
              const coverUrl = video.cover_path.startsWith('http') 
                ? video.cover_path 
                : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/IdeaUploads/${video.cover_path}`
              
              const videoUrl = video.video_path.startsWith('http')
                ? video.video_path
                : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/IdeaUploads/${video.video_path}`

              return (
              <tr
                key={video.video_id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="flex-shrink-0 h-16 w-24 relative rounded bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-pointer group"
                      onClick={() => onPreview(videoUrl)}
                      title="预览播放"
                    >
                      <img className="h-16 w-24 object-cover" src={coverUrl} alt="cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <PlayIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[10px] text-white">
                        {video.duration}s
                      </div>
                    </button>
                    <div className="ml-4 max-w-xs">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={video.title}>{video.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          video.is_public 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {video.is_public ? '公开' : '私密'}
                        </span>
                        {video.tags && video.tags.length > 0 && (
                          <div className="flex gap-1 overflow-hidden">
                            {video.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <FireIcon className="w-3.5 h-3.5 text-gray-400" /> 
                    {typeof video.hot_score === 'number' ? video.hot_score.toFixed(1) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <EyeIcon className="w-3.5 h-3.5 text-gray-400" /> 
                    {video.total_views}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <HeartIcon className="w-3.5 h-3.5 text-gray-400" fill /> {video.total_likes}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <CommentIcon className="w-3.5 h-3.5 text-gray-400" /> {video.total_comments}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(video.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {video.updated_at ? new Date(video.updated_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary hover:text-blue-800 mr-4 transition-colors" title="编辑" onClick={() => onEdit(video.video_id)}>
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(video.video_id)}
                    className="text-red-400 hover:text-red-600 transition-colors" 
                    title="删除"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            )})}
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
