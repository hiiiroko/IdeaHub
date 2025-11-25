import React, { useEffect, useMemo, useRef, useState } from 'react'
import { TimeRange, SortOption } from '../types'
import { SearchIcon } from './Icons'

type Props = {
  timeRange: TimeRange
  sort: SortOption
  onTimeRangeChange: (next: TimeRange) => void
  onSortChange: (next: SortOption) => void
  onSearchChange: (debounced: string) => void
  defaultSearch?: string
}

export const FiltersBar: React.FC<Props> = ({ timeRange, sort, onTimeRangeChange, onSortChange, onSearchChange, defaultSearch }) => {
  const [searchInput, setSearchInput] = useState(defaultSearch || '')
  useEffect(() => {
    const t = setTimeout(() => {
      onSearchChange(searchInput.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput, onSearchChange])

  const sortOptions = useMemo(() => [
    { v: SortOption.LATEST, l: '最新' },
    { v: SortOption.MOST_VIEWED, l: '热门' },
    { v: SortOption.MOST_LIKED, l: '点赞数' }
  ], [])

  const sortContainerRef = useRef<HTMLDivElement | null>(null)
  const sortBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 })

  useEffect(() => {
    const activeBtn = sortBtnRefs.current[sort]
    const container = sortContainerRef.current
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
  }, [sort])

  useEffect(() => {
    const handler = () => {
      const activeBtn = sortBtnRefs.current[sort]
      const container = sortContainerRef.current
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
  }, [sort])

  return (
    <div className="sticky top-0 z-30 bg-bg/95 dark:bg-gray-900/95 backdrop-blur-sm py-4 mb-6 -mx-6 px-6 border-b border-gray-200/50 dark:border-gray-700 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
          placeholder="搜索创意、标签…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        <select 
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
        >
          <option value={TimeRange.ALL}>全部时间</option>
          <option value={TimeRange.TODAY}>今天</option>
          <option value={TimeRange.WEEK}>本周</option>
          <option value={TimeRange.MONTH}>本月</option>
        </select>

        <div ref={sortContainerRef} className="relative flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
          <div className="absolute bg-blue-50 dark:bg-blue-900/30 pointer-events-none" style={highlightStyle} />
          {sortOptions.map(opt => (
            <button
              key={opt.v}
              ref={el => { sortBtnRefs.current[opt.v] = el }}
              onClick={() => onSortChange(opt.v)}
              className={`relative z-10 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sort === opt.v ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100'
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}