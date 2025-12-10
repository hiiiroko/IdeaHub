import React, { useState } from 'react';

import { Video } from '../types';

import { FakeAvatar } from './FakeAvatar';
import { HeartIcon, PlayIcon } from './Icons';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const [tilt, setTilt] = useState<string>('')
  const [lightPos, setLightPos] = useState<{x:number;y:number}>({ x: 0, y: 0 })
  const [coverLoaded, setCoverLoaded] = useState(false)
  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x / rect.width - 0.5
    const dy = y / rect.height - 0.5
    const mdx = -dx
    const mdy = -dy
    const rx = -mdy * 12
    const ry = mdx * 12
    setTilt(`perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px) scale(1.03)`)
    setLightPos({ x: rect.width - x, y: rect.height - y })
  }
  const handleMouseLeave = () => {
    setTilt('perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)')
  }
  return (
    <div 
        className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer break-inside-avoid transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform: tilt, transition: 'transform 150ms cubic-bezier(0.2, 0.6, 0.2, 1), background-color 500ms cubic-bezier(0.2, 0.6, 0.2, 1), border-color 500ms cubic-bezier(0.2, 0.6, 0.2, 1)', willChange: 'transform', transformStyle: 'preserve-3d' }}
    >
      {/* 缩略图容器 - 使用 aspect-ratio 预留高度 */}
      <div className="relative bg-gray-100 dark:bg-gray-700 overflow-hidden" style={{ aspectRatio: video.aspectRatio }}>
        {!coverLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          </div>
        )}
        <img
          src={video.coverUrl}
          alt={video.title}
          className={`w-full h-full object-cover block ${coverLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          loading="lazy"
          decoding="async"
          onLoad={() => setCoverLoaded(true)}
          onError={() => setCoverLoaded(true)}
        />
        
        

        {/* 时长标记 */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-md">
            {formatDuration(video.duration)}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {video.title}
        </h3>
        
        <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
                <FakeAvatar name={video.uploader?.username || 'U'} size={20} />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{video.uploader?.username}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <HeartIcon className={`w-3 h-3 ${video.isLiked ? 'fill-red-500 text-red-500' : ''}`} fill={video.isLiked} />
                <span>{video.likeCount}</span>
            </div>
      </div>
      </div>
    </div>
  );
};

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}
