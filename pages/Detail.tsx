import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { HeartIcon, EyeIcon } from '../components/Icons';
import { FakeAvatar } from '../components/FakeAvatar';

interface DetailProps {
  videoId: string;
  onClose: () => void;
  onRequireAuth?: () => void;
}

export const Detail: React.FC<DetailProps> = ({ videoId, onClose, onRequireAuth }) => {
  const { videos, currentUser, toggleLike, addComment, incrementView } = useApp();
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const hasIncremented = useRef(false);
  
  const video = videos.find(v => v.id === videoId);

  useEffect(() => {
    if (video && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementView(video.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, video]);

  if (!video) return null;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!currentUser) { onRequireAuth && onRequireAuth(); return }
    setCommentSending(true);
    try {
      await addComment(video.id, commentText);
      setCommentText('');
    } finally {
      setCommentSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
       <div className="relative w-full max-w-6xl h-full md:h-[90vh] bg-white dark:bg-gray-800 md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
         
         {/* 关闭按钮 */}
         <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:left-auto md:right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
         </button>

         {/* 左：播放器 */}
         <div className="w-full md:w-2/3 bg-black flex items-center justify-center">
            <video 
                src={video.videoUrl} 
                poster={video.coverUrl}
                controls 
                autoPlay 
                className="w-full h-full max-h-[80vh] object-contain"
            />
         </div>

         {/* 右：交互 */}
         <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-gray-800 h-full">
            {/* 信息头部 */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">{video.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{video.viewCount.toLocaleString()} 次观看</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {video.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FakeAvatar name={video.uploader?.username || 'U'} size={40} />
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{video.uploader?.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">作者</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { if (!currentUser) { onRequireAuth && onRequireAuth(); return } toggleLike(video.id) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                            video.isLiked 
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <HeartIcon className="w-5 h-5" fill={video.isLiked} />
                        <span className="font-semibold">{video.likeCount}</span>
                    </button>
                </div>
                
                {video.description && (
                    <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {video.description}
                    </p>
                )}
            </div>

            {/* 评论列表 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <h3 className="font-bold text-gray-900">评论（{video.commentCount}）</h3>
                {(!video.comments || video.comments.length === 0) ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        暂无评论，快来分享你的想法！
                    </div>
                ) : (
                    [...(video.comments || [])]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(comment => (
                        <div key={comment.id} className="flex gap-3">
                            <FakeAvatar name={comment.user?.username || 'U'} size={32} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-bold text-gray-900">{comment.user?.username}</p>
                                    <span className="text-xs text-gray-400">
                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="inline-block max-w-[85%] bg-gray-50 pl-4 pr-4 py-2 rounded-2xl rounded-tl-none break-words">
                                    <p className="m-0 text-sm leading-snug text-gray-700 whitespace-pre-wrap text-pretty">{comment.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 评论输入 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                <form onSubmit={handleComment} className="relative">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={currentUser ? "添加评论…" : "登录后可评论"}
                        className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-primary border rounded-full text-sm transition-all outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button 
                        type="submit"
                        disabled={!commentText.trim() || commentSending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-blue-50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
                    >
                        {commentSending ? (
                          <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        )}
                    </button>
                </form>
            </div>
         </div>
       </div>
    </div>
  );
};
