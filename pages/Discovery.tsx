import React, { useMemo, useState, useEffect } from 'react';

import { SearchIcon } from '../components/Icons';
import { Masonry } from '../components/Masonry';
import { SegmentedControl } from '../components/SegmentedControl';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/VideoCardSkeleton';
import { useApp } from '../context/AppContext';
import { SortOption, TimeRange, Video } from '../types';

export const Discovery: React.FC<{ onVideoClick: (id: string) => void }> = ({ onVideoClick }) => {
  const { videos, isLoading } = useApp();
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.ALL);
  const [sort, setSort] = useState<SortOption>(SortOption.LATEST);
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  

  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // 1. 搜索
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    const now = new Date();
    if (timeRange === TimeRange.TODAY) {
      result = result.filter(v => {
        const d = new Date(v.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      });
    } else if (timeRange === TimeRange.WEEK) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(v => {
        const d = new Date(v.createdAt);
        return d >= sevenDaysAgo && d <= now;
      });
    } else if (timeRange === TimeRange.MONTH) {
      result = result.filter(v => {
        const d = new Date(v.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sort === SortOption.MOST_LIKED) return b.likeCount - a.likeCount;
      if (sort === SortOption.MOST_VIEWED) return b.viewCount - a.viewCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [videos, search, timeRange, sort]);

  const sortOptions = [
    { v: SortOption.LATEST, l: 'Latest' },
    { v: SortOption.MOST_VIEWED, l: 'Hot' },
    { v: SortOption.MOST_LIKED, l: 'Likes' }
  ];

  const timeOptions = [
    { v: TimeRange.ALL, l: '全部时间' },
    { v: TimeRange.TODAY, l: '今天' },
    { v: TimeRange.WEEK, l: '本周' },
    { v: TimeRange.MONTH, l: '本月' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 置顶筛选区 */}
      <div className="sticky top-0 z-30 bg-bg/95 dark:bg-gray-900/95 backdrop-blur-sm py-4 mb-6 -mx-6 px-6 border-b border-gray-200/50 dark:border-gray-700 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
        
        {/* 搜索 */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 h-[42px] border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
            placeholder="搜索创意、标签…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* 筛选 */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <SegmentedControl
            options={timeOptions.map(o => ({ value: o.v, label: o.l }))}
            value={timeRange}
            onChange={(v) => setTimeRange(v as TimeRange)}
          />

          <SegmentedControl
            options={sortOptions.map(o => ({ value: o.v, label: o.v === SortOption.LATEST ? '最新' : o.v === SortOption.MOST_VIEWED ? '热门' : '点赞数' }))}
            value={sort}
            onChange={(v) => setSort(v as SortOption)}
          />
        </div>
      </div>

      {/* 内容 */}
      {isLoading ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-64 animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <Masonry
          items={filteredVideos}
          responsive={{ base: 2, md: 3, lg: 4 }}
          estimateHeight={(video: Video, cw: number) => {
            const ratio = video.aspectRatio || 16 / 9;
            return cw / ratio + 100;
          }}
          renderItem={(video: Video) => {
            const showSkeleton = video.isHydrated === false || !video.uploader?.username || !video.coverUrl;
            return showSkeleton ? (
              <VideoCardSkeleton ratio={video.aspectRatio} />
            ) : (
              <VideoCard video={video} onClick={() => onVideoClick(video.id)} />
            );
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <SearchIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium">未找到视频</p>
            <p className="text-sm">请调整筛选或搜索条件。</p>
        </div>
      )}
    </div>
  );
};
