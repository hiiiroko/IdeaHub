import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { HomeIcon, PlusSquareIcon, LayoutGridIcon, LogOutIcon } from './Icons';
import { FakeAvatar } from './FakeAvatar';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onRequireAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onRequireAuth }) => {
  const { currentUser, logout, isAuthLoading } = useApp();

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
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold select-none">I</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">IdeaHub</h1>
      </div>

      <nav ref={navRef} className="relative flex-1 px-3 py-4 space-y-1">
        <div className="absolute bg-blue-50" style={highlightStyle} />
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
                isActive ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {isAuthLoading ? (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-100 rounded-md animate-pulse"></div>
        </div>
      ) : currentUser ? (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
             <FakeAvatar name={currentUser.username} size={40} />
             <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.username}</p>
                <p className="text-xs text-gray-500 truncate">ID: {currentUser.uid}</p>
             </div>
          </div>
          <button
            onClick={async () => { await logout(); onNavigate('discovery'); }}
            className="group w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <span className="flex items-center gap-2 transition-all duration-500 ease-in-out -ml-3 group-hover:ml-0">
              <LogOutIcon className="w-4 h-4" />
              <span>退出登录</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100">
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