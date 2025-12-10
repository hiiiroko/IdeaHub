import React, { useEffect, useState, useRef } from 'react';

import { CommentInput } from '../components/Detail/CommentInput';
import { CommentList } from '../components/Detail/CommentList';
import { DetailSkeleton } from '../components/Detail/DetailSkeleton';
import { VideoInfo } from '../components/Detail/VideoInfo';
import { VideoPlayer } from '../components/Detail/VideoPlayer';
import { useApp } from '../context/AppContext';
import { fetchComments, sendComment as postComment } from '../services/interaction';
import { fetchVideoEngagementStats } from '../services/video';
import { Comment, Video } from '../types';

const formatTime = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })
}

interface DetailProps {
  videoId: string;
  onClose: () => void;
  onRequireAuth?: () => void;
}

export const Detail: React.FC<DetailProps> = ({ videoId, onClose, onRequireAuth }) => {
  const { videos, currentUser, toggleLike, addComment, incrementView, updateVideo } = useApp();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const hasIncremented = useRef(false);
  const commentsFetched = useRef(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(true);
  
  const video = videos.find(v => v.id === videoId);

  useEffect(() => {
    hasIncremented.current = false;
    commentsFetched.current = false;
    setCommentsLoading(true);
    setReplyTo(null);
    setCommentText('');
  }, [videoId]);

  useEffect(() => {
    setIsLoading(!video);
  }, [video]);

  useEffect(() => {
    if (video && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementView(video.id);

      // Fetch fresh stats including hot_score
      fetchVideoEngagementStats(video.id).then((stats) => {
        if (stats) {
          updateVideo(video.id, {
            viewCount: stats.total_views,
            likeCount: stats.total_likes,
            commentCount: stats.total_comments,
            hot_score: stats.hot_score,
          });
        }
      });
    }
  }, [videoId, video, incrementView, updateVideo]);

  useEffect(() => {
      const loadComments = async () => {
          if (!videoId || commentsFetched.current) return;
          try {
              setCommentsLoading(true);
              const uiComments = await fetchComments(videoId);
              // Update context with fetched comments
              updateVideo(videoId, { comments: uiComments });
              commentsFetched.current = true;
          } catch (e) {
              console.error('Failed to load comments', e);
          } finally {
              setCommentsLoading(false);
          }
      };
      
      if (video && (!video.comments || video.comments.length === 0)) {
          loadComments();
      } else if (video && video.comments && video.comments.length > 0) {
          commentsFetched.current = true;
          setCommentsLoading(false);
      }
  }, [videoId, video, updateVideo]);

  if (!video) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-6xl h-full md:h-[90vh] bg-white dark:bg-gray-800 md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
          <div className="w-full md:w-1/3 p-6">
            <DetailSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!currentUser) { onRequireAuth && onRequireAuth(); return }
    setCommentSending(true);
    try {
      await addComment(video.id, commentText, replyTo ? replyTo.id : null);
      setCommentText('');
      setReplyTo(null);
    } finally {
      setCommentSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
       <div className="relative w-full max-w-6xl flex md:flex-row flex-col">
         <div className="relative w-full h-full md:h-[90vh] bg-white dark:bg-gray-800 md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
           <VideoPlayer videoUrl={video.videoUrl} coverUrl={video.coverUrl} />

           {/* 右：交互 */}
           <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-gray-800 h-full">
              {isLoading ? (
                <div className="p-6">
                  <DetailSkeleton />
                </div>
              ) : (
                <VideoInfo 
                  video={video} 
                  currentUser={currentUser} 
                  onRequireAuth={onRequireAuth} 
                  toggleLike={toggleLike} 
                />
              )}

              <CommentList
                comments={video.comments || []}
                loading={commentsLoading}
                onReply={(comment) => {
                  if (!currentUser) {
                    onRequireAuth && onRequireAuth();
                    return;
                  }
                  setReplyTo(comment);
                }}
              />

              <CommentInput
                commentText={commentText}
                setCommentText={setCommentText}
                commentSending={commentSending}
                onSubmit={handleComment}
                currentUser={currentUser}
                replyToUsername={replyTo?.user?.username || null}
                onCancelReply={() => setReplyTo(null)}
              />
           </div>
         </div>

         {/* 关闭按钮：桌面端在右侧外，移动端在右上方外 */}
         <button 
            onClick={onClose}
            className="absolute md:static top-0 right-0 md:ml-4 mb-4 md:mb-0 z-[60] w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors flex-shrink-0 translate-y-[-120%] md:translate-y-0"
            aria-label="关闭"
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
         </button>
       </div>
    </div>
  );
};
