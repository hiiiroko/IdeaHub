import React, { useEffect, useRef, useState } from 'react'

type Size = 'sm' | 'md'

type Option<T extends string | number> = {
  value: T
  label: string
}

type Props<T extends string | number> = {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: Size
  disabled?: boolean
  ariaLabel?: string
  ariaLabelledBy?: string
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  disabled = false,
  ariaLabel,
  ariaLabelledBy
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 })

  useEffect(() => {
    const key = String(value)
    const activeBtn = btnRefs.current[key]
    const container = containerRef.current
    if (!activeBtn || !container) return
    setHighlightStyle({
      top: activeBtn.offsetTop,
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      height: activeBtn.offsetHeight,
      borderRadius: 6,
      transition: 'all 500ms cubic-bezier(0.2, 0.6, 0.2, 1)',
      opacity: 1
    })
  }, [value])

  useEffect(() => {
    const handler = () => {
      const key = String(value)
      const activeBtn = btnRefs.current[key]
      const container = containerRef.current
      if (!activeBtn || !container) return
      setHighlightStyle(prev => ({
        ...prev,
        top: activeBtn.offsetTop,
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight
      }))
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [value])

  const padClass = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`relative flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)] ${className || ''}`}
    >
      <div className="absolute bg-blue-50 dark:bg-blue-900/30 pointer-events-none" style={highlightStyle} />
      {options.map(opt => {
        const selected = opt.value === value
        return (
          <button
            key={String(opt.value)}
            ref={el => { btnRefs.current[String(opt.value)] = el }}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => !disabled && onChange(opt.value)}
            className={`relative z-10 ${padClass} text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              selected ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100'
            } ${disabledClass}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

