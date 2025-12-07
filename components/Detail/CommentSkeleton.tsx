import React from 'react'

export const CommentSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="p-6 space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-3 w-24 rounded" />
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 w-3/4 rounded-2xl" />
            <div className="flex items-center gap-3">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-3 w-20 rounded" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-3 w-12 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

