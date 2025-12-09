import React, { useEffect, useRef, useState } from 'react';

import { useApp } from '../context/AppContext';
import { useVideoGenerationTasks } from '../context/VideoGenerationTasksContext';

import { FakeAvatar } from './FakeAvatar';
import { HomeIcon, PlusSquareIcon, LayoutGridIcon, LogOutIcon, RefreshIcon, EyeIcon } from './Icons';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onRequireAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onRequireAuth }) => {
  const { currentUser, logout, isAuthLoading, theme, toggleTheme } = useApp();
  const { tasks, refreshTask, openPreview } = useVideoGenerationTasks();

  const navItems = [
    { id: 'discovery', label: '创意', icon: HomeIcon },
    { id: 'create', label: '发布', icon: PlusSquareIcon },
    { id: 'manage', label: '管理', icon: LayoutGridIcon },
  ];

  const navRef = useRef<HTMLDivElement | null>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 })

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

      {tasks.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">正在生成的视频</p>
          <div className="flex flex-wrap gap-2">
            {tasks.map(task => {
              const ready = task.status === 'succeeded' && !!task.videoUrl
              return (
                <div
                  key={task.taskId}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-100 dark:border-blue-800"
                >
                  <span className="text-xs font-mono">#{task.taskId.slice(-5)}</span>
                  <button
                    type="button"
                    className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-white/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 hover:bg-white dark:hover:bg-blue-900 transition"
                    onClick={() => ready ? openPreview(task.taskId) : refreshTask(task.taskId)}
                    title={ready ? '查看生成视频' : '刷新状态'}
                  >
                    {ready ? <EyeIcon className="w-3.5 h-3.5" /> : <RefreshIcon className={`w-3.5 h-3.5 ${task.loading ? 'animate-spin' : ''}`} />}
                  </button>
                </div>
              )
            })}
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
    </div>
  );
};