import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { toUiVideo } from '../services/adapters';
import { toggleLikeVideo, sendComment, incrementViewCount } from '../services/interaction';
import { fetchVideos } from '../services/video';
import { User, Video, Comment, SortOption } from '../types.ts';

/**
 * 应用上下文（AppContext）模块
 *
 * 负责在 React 应用中集中管理：
 * 用户鉴权状态与当前用户信息
 * 视频列表与其交互状态（点赞、评论、浏览计数）
 * 数据的初始化与刷新流程
 * 向组件树提供统一的 API（登录、登出、列表更新与交互操作）
 *
 */

interface AppState {
  currentUser: User | null;
  videos: Video[];
  isLoading: boolean;
  isAuthLoading: boolean;
  theme: 'light' | 'dark';
}

interface AppContextType extends AppState {
  login: () => void;
  logout: () => void;
  addVideo: (video: Video) => void;
  deleteVideo: (id: string) => void;
  updateVideo: (id: string, data: Partial<Video>) => void;
  toggleLike: (videoId: string) => void;
  addComment: (videoId: string, content: string, parentId?: string | null) => void;
  incrementView: (videoId: string) => void;
  authLogin: (email: string, password: string) => Promise<void>;
  authRegister: (email: string, password: string, username: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (next: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { 
    currentUser, 
    isAuthLoading: authLoading, 
    setIsAuthLoading, 
    fetchCurrentUser, 
    login: performLogin, 
    register: performRegister, 
    logout: performLogout 
  } = useAuth();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync auth loading state
  // useAuth manages its own loading, but AppContext exposed isAuthLoading
  // We initialize it to true in useAuth, so it matches.

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setIsAuthLoading(true);
      
      try {
        await fetchCurrentUser();

        try {
          const list = await fetchVideos(SortOption.LATEST);
          const uiList = list.map(v => toUiVideo(v));
          setVideos(uiList);
        } catch (e) {
          console.error('Failed to fetch videos', e);
          setVideos([]);
        }
      } finally {
        setIsAuthLoading(false);
        setIsLoading(false);
      }
    };
    void init();
  }, [fetchCurrentUser, setIsAuthLoading]);

  /**
   * 登录后刷新当前用户与点赞状态
   * Legacy login method exposed to context, essentially refreshes user data
   */
  const login = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 登出并重置与用户相关的本地状态
  const logout = useCallback(async () => {
    await performLogout();
    setVideos(prev => prev.map(v => ({ ...v, isLiked: false })));
  }, [performLogout]);


  // 在列表头部插入新视频（前置添加，便于用户立即看到）
  const addVideo = useCallback((video: Video) => {
    setVideos((prev) => [video, ...prev]);
  }, []);


  // 按 ID 从列表中移除视频（本地状态）
  const deleteVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  /**
   * 按 ID 局部更新视频字段（保持不可变数据模式）
   */
  const updateVideo = useCallback((id: string, data: Partial<Video>) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  }, []);

  /**
   * 切换点赞状态（乐观更新 + 失败回滚）
   */
  const toggleLike = useCallback(async (videoId: string) => {
    setVideos(prev => toggleLikeInList(prev, videoId));
    try {
      await toggleLikeVideo(videoId);
    } catch {
      setVideos(prev => toggleLikeInList(prev, videoId));
    }
  }, []);

  /**
   * 发送评论并在本地拼接评论列表（头部追加）
   */
  const addComment = useCallback(async (videoId: string, content: string, parentId: string | null = null) => {
    if (!currentUser) return;
    const created = await sendComment(videoId, content, parentId);
    const baseComment: Comment = {
      id: created.id,
      content: created.content,
      userId: created.user_id,
      videoId,
      createdAt: created.created_at,
      parentId,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        uid: currentUser.uid,
        avatar: currentUser.avatar,
        createdAt: currentUser.createdAt,
      },
      replies: [],
    };

    setVideos(prev => prev.map(v => {
      if (v.id !== videoId) return v;
      const existingComments = v.comments || [];

      if (!parentId) {
        return {
          ...v,
          commentCount: (v.commentCount ?? 0) + 1,
          comments: [baseComment, ...existingComments],
        };
      }

      let attached = false;
      const updatedComments = existingComments.map(c => {
        if (c.id !== parentId) return c;
        const replies = c.replies || [];
        attached = true;
        return {
          ...c,
          replies: [...replies, baseComment],
        };
      });

      const finalComments = attached ? updatedComments : [baseComment, ...existingComments];

      return {
        ...v,
        commentCount: (v.commentCount ?? 0) + 1,
        comments: finalComments,
      };
    }));
  }, [currentUser]);


  // 增加浏览计数（乐观更新 + 异步上报）
  const incrementView = useCallback(async (videoId: string) => {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, viewCount: v.viewCount + 1 } : v));
    await incrementViewCount(videoId);
  }, []);

  /**
   * 账号登录
   */
  const authLogin = useCallback(async (email: string, password: string) => {
    await performLogin(email, password);
  }, [performLogin]);

  /**
   * 账号注册
   */
  const authRegister = useCallback(async (email: string, password: string, username: string) => {
    await performRegister(email, password, username);
  }, [performRegister]);

  /**
   * 刷新视频列表
   */
  const refreshVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Re-fetch profile to get latest likes if needed, or use current user?
      // Original logic fetched profile again.
      const list = await fetchVideos(SortOption.LATEST);
      const uiList = list.map(v => toUiVideo(v));
      setVideos(uiList);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  const value = useMemo(() => ({
    currentUser,
    videos,
    isLoading,
    isAuthLoading: authLoading,
    theme,
    login,
    logout,
    addVideo,
    deleteVideo,
    updateVideo,
    toggleLike,
    addComment,
    incrementView,
    authLogin,
    authRegister,
    refreshVideos,
    toggleTheme,
    setTheme
  }), [
    currentUser,
    videos,
    isLoading,
    authLoading,
    theme,
    login,
    logout,
    addVideo,
    deleteVideo,
    updateVideo,
    toggleLike,
    addComment,
    incrementView,
    authLogin,
    authRegister,
    refreshVideos,
    toggleTheme,
    setTheme
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

function toggleLikeInList(prev: Video[], videoId: string): Video[] {
  return prev.map(v => v.id === videoId
    ? { ...v, isLiked: !v.isLiked, likeCount: !v.isLiked ? v.likeCount + 1 : Math.max(0, v.likeCount - 1) }
    : v)
}
