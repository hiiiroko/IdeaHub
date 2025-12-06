import React from 'react'

import { Comment } from '../../types'
import { FakeAvatar } from '../FakeAvatar'

interface CommentListProps {
  comments: Comment[]
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h3 className="font-bold text-gray-900 dark:text-gray-100">评论（{comments?.length || 0}）</h3>
      {(!comments || comments.length === 0) ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          暂无评论，快来分享你的想法！
        </div>
      ) : (
        [...(comments || [])]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(comment => (
            <div key={comment.id} className="flex gap-3">
              <FakeAvatar name={comment.user?.username || 'U'} size={32} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{comment.user?.username}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="inline-block max-w-[85%] bg-gray-50 dark:bg-gray-700 pl-4 pr-4 py-2 rounded-2xl rounded-tl-none break-words">
                  <p className="m-0 text-sm leading-snug text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-pretty">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
      )}
    </div>
  )
}
