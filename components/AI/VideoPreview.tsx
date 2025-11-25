import React from 'react'

export const VideoPreview: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className="w-full bg-black flex items-center justify-center">
      <video src={url} controls className="w-full h-full max-h-[60vh] object-contain" />
    </div>
  )
}