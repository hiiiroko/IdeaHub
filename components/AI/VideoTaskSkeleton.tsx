import React from 'react'

import { SkeletonBlock } from '../common/SkeletonBlock'

export const VideoTaskSkeleton: React.FC = () => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-700/60 border border-gray-100 dark:border-gray-700">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-5 w-20 rounded-md" />
          <SkeletonBlock className="h-5 w-16 rounded-md" />
        </div>
        <SkeletonBlock className="h-4 w-4/5 rounded" />
        <SkeletonBlock className="h-3 w-3/4 rounded" />
      </div>
    </div>
  )
}
