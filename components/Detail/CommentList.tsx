import React from 'react'

import { Comment } from '../../types'
import { FakeAvatar } from '../FakeAvatar'

interface CommentListProps {
  comments: Comment[]
  onReply?: (comment: Comment) => void
}

const formatCommentTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const CommentList: React.FC<CommentListProps> = ({ comments, onReply }) => {
  const totalCount = (comments || []).reduce((acc, cur) => acc + 1 + (cur.replies?.length || 0), 0)

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'text-sm' : ''}`}>
      <FakeAvatar name={comment.user?.username || 'U'} size={isReply ? 28 : 32} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{comment.user?.username || '用户'}</p>
          <span className="text-xs text-gray-400">
            {formatCommentTime(comment.createdAt)}
          </span>
        </div>
        <div className="inline-block max-w-[85%] bg-gray-50 dark:bg-gray-700 pl-4 pr-4 py-2 rounded-2xl rounded-tl-none break-words">
          <p className="m-0 text-sm leading-snug text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-pretty">{comment.content}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <button
              type="button"
              className="hover:text-primary transition-colors"
              onClick={() => onReply && onReply(comment)}
            >
              回复
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h3 className="font-bold text-gray-900 dark:text-gray-100">评论（{totalCount}）</h3>
      {(!comments || comments.length === 0) ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          暂无评论，快来分享你的想法！
        </div>
      ) : (
        [...(comments || [])]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(parent => (
            <div key={parent.id} className="space-y-2">
              {renderComment(parent)}
              {parent.replies && parent.replies.length > 0 && (
                <div className="space-y-2 pl-10">
                  {parent.replies.map(reply => (
                    <div key={reply.id} className="border-l border-gray-200 dark:border-gray-700 pl-4">
                      {renderComment(reply, true)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
      )}
    </div>
  )
}
