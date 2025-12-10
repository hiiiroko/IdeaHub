import React from 'react'

import { Comment } from '../../types'
import { FakeAvatar } from '../FakeAvatar'

interface CommentListProps {
  comments: Comment[]
  loading?: boolean
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

import { CommentSkeleton } from './CommentSkeleton'
export const CommentList: React.FC<CommentListProps> = ({ comments, loading = false, onReply }) => {
  const byId = new Map<string, any>()
  for (const c of comments || []) byId.set((c as any).id, c)

  const isTop = (c: any) => !c.parentId
  const topLevel = [...(comments || [])]
    .filter(isTop)
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const findRootId = (c: any): string => {
    let cur: any = c
    while (cur && cur.parentId) {
      const parent = byId.get(cur.parentId)
      if (!parent) break
      cur = parent
    }
    return cur?.id || c.id
  }

  const repliesByRoot = new Map<string, any[]>()
  for (const c of (comments || []).filter((x: any) => !!x.parentId)) {
    const rootId = findRootId(c)
    if (!repliesByRoot.has(rootId)) repliesByRoot.set(rootId, [])
    repliesByRoot.get(rootId)!.push(c)
  }
  for (const [, list] of repliesByRoot) {
    list.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  const totalCount = (comments || []).length

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'text-sm' : ''}`}>
      <FakeAvatar name={comment.user?.username || 'U'} size={isReply ? 24 : 32} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{comment.user?.username || '用户'}</p>
        </div>
        {(() => {
          const c = comment.content || ''
          const hasPrefix = c.startsWith('回复 @') && c.includes('：')
          if (!hasPrefix) {
            return (
              <p className="m-0 text-sm leading-snug text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words text-pretty">{c}</p>
            )
          }
          const idx = c.indexOf('：')
          const prefix = c.slice(0, idx + 1)
          const rest = c.slice(idx + 1)
          return (
            <p className="m-0 text-sm leading-snug text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words text-pretty">
              <span className="text-gray-400 dark:text-gray-500">{prefix}</span>
              <span>{rest}</span>
            </p>
          )
        })()}
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <span>{formatCommentTime(comment.createdAt)}</span>
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
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h3 className="font-bold text-gray-900 dark:text-gray-100">评论（{totalCount}）</h3>
      {loading ? (
        <CommentSkeleton />
      ) : (!comments || comments.length === 0) ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          暂无评论，快来分享你的想法！
        </div>
      ) : (
        topLevel.map((root: any) => (
          <div key={root.id} className="space-y-2">
            {renderComment(root)}
            {(repliesByRoot.get(root.id) || []).length > 0 && (
              <div className="space-y-2 pl-8 md:pl-10 lg:pl-12">
                {repliesByRoot.get(root.id)!.map((reply: any) => {
                  const parent = byId.get(reply.parentId)
                  const isDirect = reply.parentId === root.id
                  const replyToName = parent?.user?.username || ''
                  const display = isDirect ? reply.content : `回复 @${replyToName}：${reply.content}`
                  const payload = isDirect ? reply : { ...reply, content: display }
                  return (
                    <div key={reply.id} className="pl-0">
                      {renderComment(payload, true)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
