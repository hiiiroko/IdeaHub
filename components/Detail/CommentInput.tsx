import React from 'react'

import { User } from '../../types'

interface CommentInputProps {
  commentText: string
  setCommentText: (text: string) => void
  commentSending: boolean
  onSubmit: (e: React.FormEvent) => void
  currentUser: User | null
  replyToUsername?: string | null
  onCancelReply?: () => void
}

export const CommentInput: React.FC<CommentInputProps> = ({
  commentText,
  setCommentText,
  commentSending,
  onSubmit,
  currentUser,
  replyToUsername,
  onCancelReply,
}) => {
  const placeholder = replyToUsername ? `回复：${replyToUsername}` : currentUser ? '添加评论…' : '登录后可评论'

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
      {replyToUsername && (
        <div className="flex items-center justify-between mb-2 text-xs text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full">
          <span>回复：{replyToUsername}</span>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-100"
            onClick={onCancelReply}
            aria-label="取消回复"
          >
            ✕
          </button>
        </div>
      )}
      <form onSubmit={onSubmit} className="relative">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-primary border rounded-full text-sm transition-all outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
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
  )
}
