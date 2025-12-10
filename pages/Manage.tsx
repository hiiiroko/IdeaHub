import React, { useMemo, useState, useEffect } from 'react';

import { ConfirmModal } from '../components/ConfirmModal';
import { EditVideoModal } from '../components/EditVideoModal';
import { FiltersBar } from '../components/FiltersBar';
import { useApp } from '../context/AppContext';
import { toastSuccess, toastError } from '../services/utils';
import { deleteVideo as deleteVideoSvc, fetchMyVideosWithStats } from '../services/video';
import { SortOption, TimeRange } from '../types';
import type { VideoWithEngagementStats } from '../types/index';

import DashboardCharts from '@/components/DashboardCharts';
import { VideoTable } from '@/components/Manage/VideoTable';

export const Manage: React.FC<{ onVideoClick?: (id: string) => void }> = ({ onVideoClick }) => {
  const { currentUser, deleteVideo: deleteGlobalVideo } = useApp();
  const [myVideos, setMyVideos] = useState<VideoWithEngagementStats[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.ALL)
  const [sort, setSort] = useState<SortOption>(SortOption.LATEST)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [chartsPreviewOpen, setChartsPreviewOpen] = useState(false)

  const fetchVideos = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await fetchMyVideosWithStats(currentUser.id);
      setMyVideos(data);
    } catch (e: any) {
      console.error(e);
      toastError('获取视频列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [currentUser]);

  const filteredMyVideos = useMemo(() => {
    let result = [...myVideos]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(q) || (v.tags || []).some(t => t.toLowerCase().includes(q)))
    }
    const now = new Date()
    if (timeRange === TimeRange.TODAY) {
      result = result.filter(v => {
        const d = new Date(v.created_at)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
      })
    } else if (timeRange === TimeRange.WEEK) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(v => {
        const d = new Date(v.created_at)
        return d >= sevenDaysAgo && d <= now
      })
    } else if (timeRange === TimeRange.MONTH) {
      result = result.filter(v => {
        const d = new Date(v.created_at)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
    }
    result.sort((a, b) => {
      if (sort === SortOption.MOST_LIKED) return b.total_likes - a.total_likes
      if (sort === SortOption.MOST_VIEWED) return b.total_views - a.total_views
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    // Fix sorting direction for numbers
    if (sort === SortOption.MOST_LIKED) {
       result.sort((a, b) => b.total_likes - a.total_likes)
    } else if (sort === SortOption.MOST_VIEWED) {
       result.sort((a, b) => b.total_views - a.total_views)
    }

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
          showDivider={false}
        />

        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            className="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
            onClick={() => setChartsPreviewOpen(true)}
          >
            查看视图
          </button>
          <span className="bg-blue-100 dark:bg-blue-900/20 text-primary px-3 py-1 rounded-full text-sm font-medium transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
            {filteredMyVideos.length} 条结果
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">加载中...</div>
        ) : (
          <VideoTable
            videos={filteredMyVideos as any} // Temporary cast until VideoTable updated
            onPreview={(url) => {
              const target = myVideos.find(v => v.video_path === url || v.video_path.endsWith(url.split('/').pop() || ''))
              if (target && onVideoClick) {
                onVideoClick(target.video_id)
              } else {
                setPreviewUrl(url)
                setPreviewOpen(true)
              }
            }}
            onEdit={setPendingEditId}
            onDelete={handleDelete}
          />
        )}
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
          const target = myVideos.find(v => v.video_id === pendingDeleteId)
          if (target) {
            await deleteVideoSvc(target.video_id)
          }
          setMyVideos(prev => prev.filter(v => v.video_id !== pendingDeleteId))
          deleteGlobalVideo(pendingDeleteId)
          
          setPendingDeleteId(null)
          toastSuccess('删除成功')
        }}
        onClose={() => setPendingDeleteId(null)}
      />
    )}
    {pendingEditId && (() => {
      const target = myVideos.find(v => v.video_id === pendingEditId)
      // Adapter for EditVideoModal
      const adaptedVideo = target ? {
        id: target.video_id,
        uploaderId: target.uploader_id,
        title: target.title,
        description: target.description || '',
        tags: target.tags || [],
        videoUrl: target.video_path.startsWith('http') ? target.video_path : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/IdeaUploads/${target.video_path}`,
        coverUrl: target.cover_path.startsWith('http') ? target.cover_path : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/IdeaUploads/${target.cover_path}`,
        aspectRatio: target.aspect_ratio,
        duration: target.duration,
        is_public: target.is_public,
        is_deleted: target.is_deleted,
        createdAt: target.created_at,
        updatedAt: target.updated_at,
        viewCount: target.total_views,
        likeCount: target.total_likes,
        commentCount: target.total_comments,
        isLiked: false // Default
      } : null

      return adaptedVideo ? (
          <EditVideoModal 
            video={adaptedVideo} 
            onClose={() => {
                setPendingEditId(null)
                fetchVideos() 
            }} 
          />
      ) : null
    })()}
    </>
  );
};
