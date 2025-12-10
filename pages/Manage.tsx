import React, { useMemo, useState } from 'react';

import { ConfirmModal } from '../components/ConfirmModal';
import { EditVideoModal } from '../components/EditVideoModal';
import { FiltersBar } from '../components/FiltersBar';
import { useApp } from '../context/AppContext';
import { toastSuccess } from '../services/utils';
import { deleteVideo as deleteVideoSvc } from '../services/video';
import { SortOption, TimeRange } from '../types';

import DashboardCharts from '@/components/DashboardCharts';
import { VideoTable } from '@/components/Manage/VideoTable';

export const Manage: React.FC<{ onVideoClick?: (id: string) => void }> = ({ onVideoClick }) => {
  const { currentUser, videos, deleteVideo } = useApp();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.ALL)
  const [sort, setSort] = useState<SortOption>(SortOption.LATEST)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [chartsPreviewOpen, setChartsPreviewOpen] = useState(false)

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
    <div className="p-6 max-w-7xl mx-auto">
        <FiltersBar
          timeRange={timeRange}
          sort={sort}
          onTimeRangeChange={setTimeRange}
          onSortChange={setSort}
          onSearchChange={setSearch}
        />

        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            className="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            onClick={() => setChartsPreviewOpen(true)}
          >
            查看视图
          </button>
          <span className="bg-blue-100 dark:bg-blue-900/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {filteredMyVideos.length} 条结果
          </span>
        </div>

        <VideoTable
          videos={filteredMyVideos}
          onPreview={(url) => {
            const target = videos.find(v => v.videoUrl === url)
            if (target && onVideoClick) {
              onVideoClick(target.id)
            } else {
              setPreviewUrl(url)
              setPreviewOpen(true)
            }
          }}
          onEdit={setPendingEditId}
          onDelete={handleDelete}
        />
    </div>
    {chartsPreviewOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden">
          <button
            onClick={() => setChartsPreviewOpen(false)}
            className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
          <div className="max-h-[85vh] overflow-y-auto p-4 modal-scroll">
            <DashboardCharts />
          </div>
        </div>
      </div>
    )}
    {pendingDeleteId && (
      <ConfirmModal
        title="删除视频"
        message="确定要删除该视频吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={async () => {
          const target = videos.find(v => v.id === pendingDeleteId)
          if (target) {
            await deleteVideoSvc(target.id)
          }
          // 为即时用户体验进行本地移除
          if (pendingDeleteId) deleteVideo(pendingDeleteId)
          
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
    </>
  );
};
