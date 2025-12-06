import React from 'react'

interface VideoPlayerProps {
  videoUrl: string
  coverUrl: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, coverUrl }) => {
  return (
    <div className="w-full md:w-2/3 bg-black flex items-center justify-center">
      <video 
        src={videoUrl} 
        poster={coverUrl}
        controls 
        autoPlay 
        className="w-full h-full max-h-[80vh] object-contain"
      />
    </div>
  )
}
