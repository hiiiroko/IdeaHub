import React from 'react'

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} />
}
