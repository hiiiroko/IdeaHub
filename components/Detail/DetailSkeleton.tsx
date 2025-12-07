import React from 'react'

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="aigc-skeleton w-10 h-10 rounded-full" />
        <div className="aigc-skeleton h-4 w-32 rounded" />
      </div>
      <div className="aigc-skeleton h-6 w-2/3 rounded" />
      <div className="flex flex-wrap gap-2">
        <div className="aigc-skeleton h-5 w-16 rounded-full" />
        <div className="aigc-skeleton h-5 w-20 rounded-full" />
        <div className="aigc-skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <div className="aigc-skeleton h-4 w-20 rounded" />
        <div className="aigc-skeleton h-4 w-16 rounded" />
      </div>
      <div className="aigc-skeleton h-24 w-full rounded-lg" />
    </div>
  )
}

