import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useApp } from '../context/AppContext';
import { useVideoGeneration } from '../hooks/useVideoGeneration';
import { toastError, toastSuccess } from '../services/utils';
import { discardVideoGenerationTask } from '../services/videoGeneration';
import type { VideoGenerationTask } from '../types/video';

import { VideoGenerateResult } from './AI/VideoGenerateResult';
import { VideoTaskSkeleton } from './AI/VideoTaskSkeleton';
import { FakeAvatar } from './FakeAvatar';
import { HomeIcon, PlusSquareIcon, LayoutGridIcon, LogOutIcon, EyeIcon, RefreshIcon } from './Icons';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onRequireAuth?: () => void;
  onUseGeneratedVideo?: (payload: { taskId: string; videoUrl: string; coverUrl: string | null }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onRequireAuth, onUseGeneratedVideo }) => {
  const { currentUser, logout, isAuthLoading, theme, toggleTheme, generationTasks, isGenerationTasksLoading, updateGenerationTask, removeGenerationTask } = useApp();
  const { refresh } = useVideoGeneration();

  const navItems = [
    { id: 'discovery', label: '创意', icon: HomeIcon },
    { id: 'create', label: '发布', icon: PlusSquareIcon },
    { id: 'manage', label: '管理', icon: LayoutGridIcon },
  ];

  const navRef = useRef<HTMLDivElement | null>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 })
  const [refreshingTaskId, setRefreshingTaskId] = useState<string | null>(null)
  const [viewTask, setViewTask] = useState<VideoGenerationTask | null>(null)
  const [usingFromSidebar, setUsingFromSidebar] = useState(false)
  const [discardingTask, setDiscardingTask] = useState(false)

  useEffect(() => {
    const activeBtn = btnRefs.current[currentPage]
    const navEl = navRef.current
    if (!activeBtn || !navEl) return
    const a = activeBtn.getBoundingClientRect()
    const n = navEl.getBoundingClientRect()
    const top = a.top - n.top
    const left = a.left - n.left
    setHighlightStyle({
      top,
      left,
      width: a.width,
      height: a.height,
      borderRadius: 12,
      transition: 'all 500ms cubic-bezier(0.2, 0.6, 0.2, 1)',
      opacity: 1
    })
  }, [currentPage])

  useEffect(() => {
    const handle = () => {
      const activeBtn = btnRefs.current[currentPage]
      const navEl = navRef.current
      if (!activeBtn || !navEl) return
      const a = activeBtn.getBoundingClientRect()
      const n = navEl.getBoundingClientRect()
      setHighlightStyle(s => ({ ...s, top: a.top - n.top, left: a.left - n.left, width: a.width, height: a.height }))
    }
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [currentPage])

  const visibleTasks = useMemo(() => {
    const threshold = Date.now() - 12 * 60 * 60 * 1000
    return generationTasks.filter(task => {
      const created = new Date(task.created_at).getTime()
      return (
        !task.is_discarded &&
        ['queued', 'running', 'succeeded'].includes(task.status) &&
        created >= threshold
      )
    })
  }, [generationTasks])

  const formatRelativeTime = (value: string) => {
    const date = new Date(value)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} 小时前`
    return date.toLocaleString()
  }

  const handleRefreshTask = async (task: VideoGenerationTask) => {
    setRefreshingTaskId(task.external_task_id)
    try {
      const updated = await refresh(task.external_task_id)
      if (updated) {
        updateGenerationTask(updated.id, updated)
        if (updated.status === 'succeeded' && updated.video_url) {
          toastSuccess('生成完成')
        }
      }
    } catch (e: any) {
      console.error(e)
      toastError(e?.message || '刷新任务失败')
    } finally {
      setRefreshingTaskId(null)
    }
  }

  const handleDiscardTask = async (task: VideoGenerationTask) => {
    if (!currentUser) {
      toastError('请先登录后再操作')
      return
    }
    console.log('[discard] task from UI:', task)
    console.log('[discard] identifier:', {
      id: task.id,
      externalTaskId: task.external_task_id,
      userId: currentUser.id,
    })
    setDiscardingTask(true)
    try {
      await discardVideoGenerationTask(task.external_task_id, currentUser.id)
      removeGenerationTask(task.id)
      toastSuccess('任务已丢弃')
      setViewTask(null)
    } catch (e: any) {
      console.error(e)
      toastError(e?.message || '丢弃任务失败')
    } finally {
      setDiscardingTask(false)
    }
  }

  const handleUseTask = async () => {
    if (!viewTask || !viewTask.video_url) {
      toastError('暂无可用视频')
      return
    }
    if (!onUseGeneratedVideo) {
      toastError('当前页面暂不支持直接使用视频')
      return
    }
    setUsingFromSidebar(true)
    try {
      onUseGeneratedVideo({
        taskId: viewTask.external_task_id,
        videoUrl: viewTask.video_url,
        coverUrl: viewTask.last_frame_url,
      })
      toastSuccess('已载入到发布页')
      setViewTask(null)
    } catch (e: any) {
      console.error(e)
      toastError(e?.message || '使用视频失败')
    } finally {
      setUsingFromSidebar(false)
    }
  }

  const handleViewTask = (task: VideoGenerationTask) => {
    if (task.status !== 'succeeded' || !task.video_url) {
      toastError('视频尚未生成完成')
      return
    }
    setViewTask(task)
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 flex flex-col z-40 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold select-none">I</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">IdeaHub</h1>
        <button
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          className="ml-auto relative inline-flex items-center w-12 h-6 rounded-full border select-none border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)] overflow-hidden"
        >
          <span
            className={"absolute top-1/2 -translate-y-1/2 inline-block w-5 h-5 rounded-full bg-white dark:bg-gray-200 shadow"}
            style={{ left: theme === 'dark' ? 'calc(100% - 22px)' : '2px', transition: 'left 300ms ease-in-out' }}
          ></span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="absolute w-3 h-3 text-gray-500 dark:text-gray-400 pointer-events-none"
            style={{
              left: theme === 'light' ? 'calc(100% - 14px)' : 'calc(100% + 10px)',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: theme === 'light' ? 1 : 0,
              transition: 'left 300ms ease-in-out, opacity 300ms ease-in-out'
            }}
          >
            <path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="absolute w-3 h-3 text-gray-500 dark:text-gray-400 pointer-events-none"
            style={{
              left: theme === 'dark' ? '6px' : '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: theme === 'dark' ? 1 : 0,
              transition: 'left 300ms ease-in-out, opacity 300ms ease-in-out'
            }}
          >
            <circle cx="12" cy="12" r="5" fill="currentColor"/>
            <g stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="4"/>
              <line x1="12" y1="20" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="4" y2="12"/>
              <line x1="20" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
              <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
            </g>
          </svg>
        </button>
      </div>

      <nav ref={navRef} className="relative flex-1 px-3 py-4 space-y-1">
        <div className="absolute bg-blue-50 dark:bg-blue-900/30" style={highlightStyle} />
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              ref={el => { btnRefs.current[item.id] = el }}
              onClick={() => {
                if ((item.id === 'create' || item.id === 'manage') && !currentUser) {
                  onRequireAuth && onRequireAuth();
                } else {
                  onNavigate(item.id);
                }
              }}
              className={`relative z-10 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {currentUser && (
        <div className="px-4 pb-2">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI 视频生成任务</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{visibleTasks.length}</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto px-1">
              {isGenerationTasksLoading ? (
                <VideoTaskSkeleton />
              ) : visibleTasks.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">最近暂无生成任务</p>
              ) : (
                visibleTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-700/60 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-[11px] rounded-md capitalize ${
                          task.status === 'succeeded'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}
                      >
                        {task.status}
                      </span>
                      {['queued', 'running'].includes(task.status) ? (
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                          onClick={() => handleRefreshTask(task)}
                          disabled={refreshingTaskId === task.external_task_id}
                        >
                          <RefreshIcon className={`w-4 h-4 ${refreshingTaskId === task.external_task_id ? 'animate-spin' : ''}`} />
                          刷新
                        </button>
                      ) : (
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                          onClick={() => handleViewTask(task)}
                          disabled={!task.video_url}
                        >
                          <EyeIcon className="w-4 h-4" />
                          查看
                        </button>
                      )}
                    </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={task.prompt}>{task.prompt}</p>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                        <span>{formatRelativeTime(task.created_at)}</span>
                        <span>{`${task.resolution} · ${task.ratio} · ${task.duration}s`}</span>
                      </div>
                    </div>
                    
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isAuthLoading ? (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse"></div>
        </div>
      ) : currentUser ? (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
          {(() => {
            const displayName = currentUser.username || '未命名用户'
            const displayUid = currentUser.uid || currentUser.id?.slice(0, 8) || ''
            return (
              <div className="flex items-center gap-3 mb-3">
                <FakeAvatar name={displayName} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{displayName}</p>
                  {displayUid && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">ID: {displayUid}</p>
                  )}
                </div>
              </div>
            )
          })()}
          <button
            onClick={async () => { await logout(); onNavigate('discovery'); }}
            className="group w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-md transition-colors"
          >
            <span className="flex items-center gap-2 transition-all duration-500 ease-in-out -ml-3 group-hover:ml-0">
              <LogOutIcon className="w-4 h-4 text-red-600 dark:text-red-800" />
              <span>退出登录</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
          <button
            onClick={onRequireAuth}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors"
          >
            登录 / 注册
          </button>
        </div>
      )}

      {viewTask && viewTask.video_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setViewTask(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              aria-label="关闭预览"
            >
              ✕
            </button>
            <div className="p-6">
              <VideoGenerateResult
                videoUrl={viewTask.video_url}
                saving={usingFromSidebar}
                onClose={() => setViewTask(null)}
                onSave={handleUseTask}
                onDiscard={() => handleDiscardTask(viewTask)}
                discarding={discardingTask}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
