import React from 'react'

import { SkeletonBlock } from '../common/SkeletonBlock'

export const CommentSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="p-6 space-y-6">
      <SkeletonBlock className="h-5 w-28 rounded" />
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <SkeletonBlock className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-24 rounded" />
            <SkeletonBlock className="h-3 w-4/5 rounded" />
            <SkeletonBlock className="h-3 w-3/5 rounded" />
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-3 w-20 rounded" />
              <SkeletonBlock className="h-3 w-12 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
