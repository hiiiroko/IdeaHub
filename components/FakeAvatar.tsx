import React from 'react'

const hashHue = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 360
}

export const FakeAvatar: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 40, className }) => {
  const hue = hashHue(name || 'User')
  const bg = `hsl(${hue} 65% 55%)`
  const style: React.CSSProperties = { width: size, height: size, background: bg, fontSize: Math.round(size * 0.5) }
  const initial = (name || 'U').trim().charAt(0).toUpperCase()
  return (
    <div style={style} className={`rounded-full flex items-center justify-center text-white font-bold select-none ${className || ''}`}>{initial}</div>
  )
}