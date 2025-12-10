import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

import { notifySuccess, notifyError } from '../utils/notify';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { toUiVideo } from '@/services/adapters';
import { toggleLikeVideo, sendComment, incrementViewCount, fetchLikesForVideos, fetchComments, fetchLikeStats, fetchLikeCountsForVideos, fetchViewCountsForVideos } from '@/services/interaction';
import { fetchVideos, fetchMyVideosWithStats } from '@/services/video';
import { fetchRecentVideoGenerationTasks } from '@/services/videoGeneration';
import type { VideoGenerationTask } from '@/types/video';
import { User, Video, Comment, SortOption } from '@/types.ts';

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
  generationTasks: VideoGenerationTask[];
  isGenerationTasksLoading: boolean;
}

interface AppContextType extends AppState {
  login: () => void;
  logout: () => void;
  addVideo: (video: Video) => void;
  deleteVideo: (id: string) => void;
  updateVideo: (id: string, data: Partial<Video>) => void;
  toggleLike: (videoId: string) => void;
  addComment: (videoId: string, content: string, parentId?: string | null) => Promise<void>;
  incrementView: (videoId: string) => void;
  authLogin: (email: string, password: string) => Promise<void>;
  authRegister: (email: string, password: string, username: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (next: 'light' | 'dark') => void;
  setGenerationTasks: (tasks: VideoGenerationTask[]) => void;
  updateGenerationTask: (id: number, patch: Partial<VideoGenerationTask>) => void;
  removeGenerationTask: (id: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const viewIncrementLimiter = new Map<string, number>();

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
  const [generationTasks, setGenerationTasks] = useState<VideoGenerationTask[]>([]);
  const [isGenerationTasksLoading, setIsGenerationTasksLoading] = useState<boolean>(false);

  /**
   * 刷新视频列表并补全点赞状态
   */
  const refreshVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchVideos(SortOption.LATEST);
      const baseUiList = list.map(v => toUiVideo(v));
      let uiList = baseUiList;

      // 如果当前用户已登录，且没有从公开列表获取到所有数据（或为了确保最新统计），尝试获取当前用户视频的详细统计信息
      // 并合并到列表中，或者如果这是管理页面的话可能更倾向于在管理页面单独获取。
      // 但为了保持全局状态的一致性，这里我们暂且不直接替换 uiList 为 fetchMyVideosWithStats 的结果，
      // 因为 videos 是给首页用的公开视频列表。
      // 
      // 修正策略：AppContext 中的 videos 主要是「发现页」的数据源。
      // 「管理页」的数据源之前是复用 videos 并 filter(uploaderId)，这会导致只能看到“已发布且在首页列表中”的视频。
      // 实际上管理页应该能看到私密视频、已删除视频（如果未软删）等。
      // 
      // 用户需求是“管理页列表数据源切换”。
      // 因此，我们需要在 AppContext 中提供一个新的状态或方法，或者让 Manage 页面自己去 fetch。
      // 考虑到 AppContext 已经有点臃肿，且这个数据只属于管理页，
      // 最佳实践是在 Manage.tsx 中使用 fetchMyVideosWithStats，而不是污染全局 videos。
      // 
      // 但是，Manage.tsx 目前依赖 useApp().videos。
      // 方案 A：在 AppContext 增加 myVideos 状态。（改动较大）
      // 方案 B：在 Manage.tsx 中独立获取数据，不再依赖 useApp().videos。
      // 
      // 考虑到用户指令是“管理页列表数据源切换”，我将采用方案 B。
      // AppContext 保持负责全局发现页数据。
      // Manage.tsx 将改为自己维护数据状态。
      // 
      // 不过，为了兼容 deleteVideo / updateVideo 等操作能同时更新全局列表（如果该视频也在发现页），
      // 我们可能需要保留全局操作对 myVideos 的影响，或者在操作后刷新。
      
      const videoIds = baseUiList.map(v => v.id);
      const likeMap = await fetchLikesForVideos(videoIds);
      if (Object.keys(likeMap).length > 0) {
        uiList = baseUiList.map(v => ({
          ...v,
          isLiked: !!likeMap[v.id],
        }));
      }

      const likeCounts = await fetchLikeCountsForVideos(videoIds)
      if (Object.keys(likeCounts).length > 0) {
        uiList = uiList.map(v => ({
          ...v,
          likeCount: likeCounts[v.id] ?? v.likeCount
        }))
      }

      const viewCounts = await fetchViewCountsForVideos(videoIds)
      if (Object.keys(viewCounts).length > 0) {
        uiList = uiList.map(v => ({
          ...v,
          viewCount: viewCounts[v.id] ?? v.viewCount
        }))
      }

      setVideos(uiList);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const replaceGenerationTasks = useCallback((tasks: VideoGenerationTask[]) => {
    setGenerationTasks(tasks);
  }, []);

  const updateGenerationTask = useCallback((id: number, patch: Partial<VideoGenerationTask>) => {
    setGenerationTasks(prev => prev.map(task => (task.id === id ? { ...task, ...patch } : task)));
  }, []);

  const removeGenerationTask = useCallback((id: number) => {
    setGenerationTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const loadRecentGenerationTasks = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsGenerationTasksLoading(true);
      const tasks = await fetchRecentVideoGenerationTasks(currentUser.id);
      replaceGenerationTasks(tasks);
    } catch (e) {
      console.error('Failed to load recent AI generation tasks', e);
    }
    finally {
      setIsGenerationTasksLoading(false);
    }
  }, [currentUser, replaceGenerationTasks]);

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
          await refreshVideos();
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
  }, [fetchCurrentUser, setIsAuthLoading, refreshVideos]);

  useEffect(() => {
    if (currentUser) {
      void loadRecentGenerationTasks();
    } else {
      replaceGenerationTasks([]);
    }
  }, [currentUser, loadRecentGenerationTasks, replaceGenerationTasks]);

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
    replaceGenerationTasks([]);
  }, [performLogout, replaceGenerationTasks]);


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
    let snapshot: Video | undefined;
    setVideos(prev => {
      snapshot = prev.find(v => v.id === videoId);
      return toggleLikeInList(prev, videoId);
    });
    try {
      await toggleLikeVideo(videoId);
      const stats = await fetchLikeStats(videoId);
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, isLiked: stats.isLiked, likeCount: stats.likeCount } : v));
      notifySuccess(stats.isLiked ? '点赞成功' : '已取消点赞');
    } catch (e) {
      console.error('toggleLike failed', e);
      setVideos(prev => snapshot
        ? prev.map(v => v.id === videoId ? { ...v, isLiked: snapshot?.isLiked ?? v.isLiked, likeCount: snapshot?.likeCount ?? v.likeCount } : v)
        : toggleLikeInList(prev, videoId)
      );
      notifyError('点赞失败，请稍后重试');
    }
  }, []);

  /**
   * 发送评论并在本地拼接评论列表（头部追加）
   */
  const addComment = useCallback(async (videoId: string, content: string, parentId: string | null = null) => {
    if (!currentUser) {
      notifyError('请先登录后再评论');
      return;
    }
    try {
      await sendComment(videoId, content, parentId);
      const refreshed = await fetchComments(videoId);
      setVideos(prev => prev.map(v => {
        if (v.id !== videoId) return v;
        const total = refreshed.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
        return {
          ...v,
          comments: refreshed,
          commentCount: total,
        };
      }));
      notifySuccess('评论已发送');
    } catch (e: any) {
      console.error('Failed to send comment', e);
      notifyError(e?.message || '评论发送失败');
    }
  }, [currentUser, fetchComments]);


  // 增加浏览计数（乐观更新 + 异步上报），对短时间重复调用做节流防止重复计数
  const incrementView = useCallback(async (videoId: string) => {
    const now = Date.now();
    const last = viewIncrementLimiter.get(videoId);
    if (last && now - last < 1500) {
      return;
    }
    viewIncrementLimiter.set(videoId, now);
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, viewCount: v.viewCount + 1 } : v));
    try {
      await incrementViewCount(videoId);
    } catch (e) {
      console.error('incrementView failed', e);
    }
  }, []);

  /**
   * 账号登录
   */
  const authLogin = useCallback(async (email: string, password: string) => {
    await performLogin(email, password);
    await refreshVideos();
    await loadRecentGenerationTasks();
  }, [performLogin, refreshVideos, loadRecentGenerationTasks]);

  /**
   * 账号注册
   */
  const authRegister = useCallback(async (email: string, password: string, username: string) => {
    await performRegister(email, password, username);
  }, [performRegister]);

  const value = useMemo(() => ({
    currentUser,
    videos,
    isLoading,
    isAuthLoading: authLoading,
    generationTasks,
    isGenerationTasksLoading,
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
    setTheme,
    setGenerationTasks: replaceGenerationTasks,
    updateGenerationTask,
    removeGenerationTask
  }), [
    currentUser,
    videos,
    isLoading,
    authLoading,
    generationTasks,
    isGenerationTasksLoading,
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
    setTheme,
    replaceGenerationTasks,
    updateGenerationTask,
    removeGenerationTask
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
