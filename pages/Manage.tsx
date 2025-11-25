import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { EditIcon, TrashIcon, PlayIcon, EyeIcon } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { deleteVideo as deleteVideoSvc, fetchVideos } from '../services/video';
import { toastSuccess } from '../services/utils';
import { toUiVideo } from '../services/adapters';
import { getCurrentUserProfile } from '../services/auth';
import { EditVideoModal } from '../components/EditVideoModal';
import { FiltersBar } from '../components/FiltersBar';
import { SortOption, TimeRange } from '../types';

export const Manage: React.FC = () => {
  const { currentUser, videos, deleteVideo } = useApp();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.ALL)
  const [sort, setSort] = useState<SortOption>(SortOption.LATEST)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const myVideos = videos.filter(v => v.uploaderId === currentUser?.id);
  const filteredMyVideos = useMemo(() => {
    let result = [...myVideos]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q)))
    }
    const now = new Date()
    if (timeRange === TimeRange.TODAY) {
      result = result.filter(v => {
        const d = new Date(v.createdAt)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
      })
    } else if (timeRange === TimeRange.WEEK) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(v => {
        const d = new Date(v.createdAt)
        return d >= sevenDaysAgo && d <= now
      })
    } else if (timeRange === TimeRange.MONTH) {
      result = result.filter(v => {
        const d = new Date(v.createdAt)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
    }
    result.sort((a, b) => {
      if (sort === SortOption.MOST_LIKED) return b.likeCount - a.likeCount
      if (sort === SortOption.MOST_VIEWED) return b.viewCount - a.viewCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return result
  }, [myVideos, search, timeRange, sort])

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  if (!currentUser) return <div className="p-10 text-center">请先登录以管理视频。</div>;

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">我的视频</h1>
            <span className="bg-blue-50 dark:bg-blue-900/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {filteredMyVideos.length} 条结果
            </span>
        </div>

        <FiltersBar
          timeRange={timeRange}
          sort={sort}
          onTimeRangeChange={setTimeRange}
          onSortChange={setSort}
          onSearchChange={setSearch}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
            <div className="overflow-x-auto">
                <table className="min-w-full transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                    <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">视频</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                        {filteredMyVideos.map((video) => (
                            <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <button
                                          type="button"
                                          className="flex-shrink-0 h-16 w-24 relative rounded bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-pointer group"
                                          onClick={() => { setPreviewUrl(video.videoUrl); setPreviewOpen(true) }}
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                        已发布
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(video.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-primary hover:text-blue-800 mr-4 transition-colors" title="编辑" onClick={() => setPendingEditId(video.id)}>
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(video.id)}
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
                {filteredMyVideos.length === 0 && (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                        你还没有上传任何视频。
                    </div>
                )}
            </div>
        </div>
    </div>
    {pendingDeleteId && (
      <ConfirmModal
        title="删除视频"
        message="确定要删除该视频吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={async () => {
          const target = videos.find(v => v.id === pendingDeleteId)
          if (target) {
            await deleteVideoSvc(target.id, target.videoUrl, target.coverUrl)
          }
          // 为即时用户体验进行本地移除
          if (pendingDeleteId) deleteVideo(pendingDeleteId)
          // full refresh
          const profile = await getCurrentUserProfile().catch(() => null)
          const likedIds = profile?.liked_video_ids || []
          const list = await fetchVideos('latest')
          // 已通过 deleteVideo 更新上下文以替换页面的本地视图，或直接依赖上下文的初始加载器
          // 此处无需进一步处理，因为上下文未暴露 setter；以上的本地移除已更新 UI
          setPendingDeleteId(null)
          toastSuccess('删除成功')
        }}
        onClose={() => setPendingDeleteId(null)}
      />
    )}
    {pendingEditId && (() => {
      const target = videos.find(v => v.id === pendingEditId)
      return target ? <EditVideoModal video={target} onClose={() => setPendingEditId(null)} /> : null
    })()}
    {previewOpen && previewUrl && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={() => { setPreviewOpen(false); setPreviewUrl('') }}
            className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            aria-label="关闭预览"
          >
            ✕
          </button>
          <div className="w-full bg-black flex items-center justify-center">
            <video src={previewUrl} controls autoPlay className="w-full h-full max-h-[80vh] object-contain" />
          </div>
        </div>
      </div>
    )}
    </>
  );
};