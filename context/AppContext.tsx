import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Video, Comment } from '../types.ts';
import { fetchVideos } from '../services/video';
import { getCurrentUserProfile, loginUser, registerUser, logoutUser } from '../services/auth';
import { toggleLikeVideo, sendComment, incrementViewCount } from '../services/interaction';
import { toUiVideo } from '../services/adapters';

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
/**
 * 应用状态（只读数据快照）
 * @property currentUser 当前登录用户；未登录时为 null
 * @property videos 当前页面展示的视频列表（已映射为 UI 所需结构）
 * @property isLoading 普通数据加载状态（如列表刷新）
 * @property isAuthLoading 鉴权相关加载状态（登录/注册/获取用户信息）
 */
interface AppState {
  currentUser: User | null;
  videos: Video[];
  isLoading: boolean;
  isAuthLoading: boolean;
  theme: 'light' | 'dark';
}

/**
 * 应用上下文类型（向组件暴露的操作集合）
 * 继承 AppState，并追加可调用的方法。
 */
interface AppContextType extends AppState {
  login: () => void;
  logout: () => void;
  addVideo: (video: Video) => void;
  deleteVideo: (id: string) => void;
  updateVideo: (id: string, data: Partial<Video>) => void;
  toggleLike: (videoId: string) => void;
  addComment: (videoId: string, content: string) => void;
  incrementView: (videoId: string) => void;
  authLogin: (email: string, password: string) => Promise<void>;
  authRegister: (email: string, password: string, username: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (next: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * 应用上下文提供者（Provider）
 * @param children 需要访问上下文的子节点
 * @remarks 在挂载时执行初始化流程：尝试获取用户信息与点赞列表，并拉取最新视频列表。
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      setIsAuthLoading(true)
      // 1 尝试获取当前用户信息（含点赞过的视频 ID 列表）
      try {
        const profile = await getCurrentUserProfile().catch(() => null)
        let likedIds: string[] = []
        if (profile) {
          likedIds = profile.liked_video_ids || []
          // 将鉴权返回的基本字段映射到 UI 用户结构
          setCurrentUser({
            id: profile.id,
            email: '',
            username: profile.username,
            uid: profile.uid,
            avatar: undefined,
            createdAt: ''
          })
        }
        // 2 拉取视频列表并按点赞数据映射到 UI 结构
        try {
          const list = await fetchVideos('latest')
          const uiList = list.map(v => toUiVideo(v, likedIds))
          setVideos(uiList)
        } catch {
          // 拉取失败兜底为空列表，避免页面崩溃
          setVideos([])
        }
      } finally {
        // 3 复位加载状态（无论成功或失败）
        setIsAuthLoading(false)
        setIsLoading(false)
      }
    }
    init()
  }, [])

  /**
   * 登录后刷新当前用户与点赞状态
   * @remarks 成功后以 likedIds 同步本地视频的 `isLiked` 标记。
   */
  const login = useCallback(async () => {
    const profile = await getCurrentUserProfile().catch(() => null)
    if (profile) {
      setCurrentUser({
        id: profile.id,
        email: '',
        username: profile.username,
        uid: profile.uid,
        avatar: undefined,
        createdAt: ''
      })
      const likedIds = profile.liked_video_ids || []
      setVideos(prev => prev.map(v => ({ ...v, isLiked: likedIds.includes(v.id) })))
    }
  }, [])

  // 登出并重置与用户相关的本地状态
  const logout = useCallback(async () => {
    await logoutUser()
    setCurrentUser(null)
    setVideos(prev => prev.map(v => ({ ...v, isLiked: false })))
  }, [])


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
   * @param id 视频 ID
   * @param data 需要覆盖的字段（Partial）
   */
  const updateVideo = useCallback((id: string, data: Partial<Video>) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  }, []);

  /**
   * 切换点赞状态（乐观更新 + 失败回滚）
   * @param videoId 视频 ID
   * @remarks 先本地切换 `isLiked` 与计数，再调用后端；若失败则回滚。
   */
  const toggleLike = useCallback(async (videoId: string) => {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, isLiked: !v.isLiked, likeCount: !v.isLiked ? v.likeCount + 1 : Math.max(0, v.likeCount - 1) } : v))
    try {
      await toggleLikeVideo(videoId)
    } catch {
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, isLiked: !v.isLiked, likeCount: !v.isLiked ? v.likeCount + 1 : Math.max(0, v.likeCount - 1) } : v))
    }
  }, [])

  /**
   * 发送评论并在本地拼接评论列表（头部追加）
   * @param videoId 视频 ID
   * @param content 评论内容
   * @remarks 依赖当前用户；服务端返回后映射为 UI 评论结构并更新计数。
   */
  const addComment = useCallback(async (videoId: string, content: string) => {
    if (!currentUser) return
    const created = await sendComment(videoId, content)
    const uiComment: Comment = {
      id: created.cid,
      content: created.content,
      userId: created.uid,
      videoId,
      createdAt: created.created_at,
      user: {
        id: created.uid,
        email: '',
        username: created.username,
        uid: created.uid,
        avatar: undefined,
        createdAt: ''
      }
    }
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, commentCount: v.commentCount + 1, comments: [uiComment, ...(v.comments || [])] } : v))
  }, [currentUser])


  // 增加浏览计数（乐观更新 + 异步上报）
  const incrementView = useCallback(async (videoId: string) => {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, viewCount: v.viewCount + 1 } : v))
    await incrementViewCount(videoId)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const setTheme = useCallback((next: 'light' | 'dark') => {
    setThemeState(next)
  }, [])

  /**
   * 账号登录
   * @param email 邮箱
   * @param password 密码
   * @remarks 管理 `isAuthLoading` 状态，并在登录成功后调用 `login()` 刷新本地用户与点赞状态。
   */
  const authLogin = useCallback(async (email: string, password: string) => {
    setIsAuthLoading(true)
    await loginUser(email, password)
    await login()
    setIsAuthLoading(false)
  }, [login])

  /**
   * 账号注册
   * @param email 邮箱
   * @param password 密码
   * @param username 用户名
   */
  const authRegister = useCallback(async (email: string, password: string, username: string) => {
    await registerUser(email, password, username)
  }, [])

  /**
   * 刷新视频列表
   * @remarks 拉取最新列表，并依据用户 `likedIds` 映射 UI 字段。
   */
  const refreshVideos = useCallback(async () => {
    setIsLoading(true)
    try {
      const profile = await getCurrentUserProfile().catch(() => null)
      const likedIds = profile ? profile.liked_video_ids || [] : []
      const list = await fetchVideos('latest')
      const uiList = list.map(v => toUiVideo(v, likedIds))
      setVideos(uiList)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentUser,
        videos,
        isLoading,
        isAuthLoading,
        theme,
        login,
        logout,
        addVideo,
        deleteVideo,
        updateVideo,
        toggleLike,
        addComment,
        incrementView
        ,authLogin
        ,authRegister
        ,refreshVideos
        ,toggleTheme
        ,setTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/**
 * 访问应用上下文（Hook）
 * @throws 未在 `AppProvider` 内使用时抛错
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};