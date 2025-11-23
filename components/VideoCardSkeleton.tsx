import React from 'react'

export const VideoCardSkeleton: React.FC<{ ratio?: number }> = ({ ratio = 1.77 }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 mb-4 break-inside-avoid">
      <div className="relative bg-gray-200 animate-pulse" style={{ aspectRatio: ratio }} />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
        </div>
      </div>
    </div>
  )
}