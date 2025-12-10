import React, { useEffect, useMemo, useState } from 'react'

import { TimeRange, SortOption } from '../types'

import { SearchIcon } from './Icons'
import { SegmentedControl } from './SegmentedControl'

type Props = {
  timeRange: TimeRange
  sort: SortOption
  onTimeRangeChange: (next: TimeRange) => void
  onSortChange: (next: SortOption) => void
  onSearchChange: (debounced: string) => void
  defaultSearch?: string
  showDivider?: boolean
}

export const FiltersBar: React.FC<Props> = ({ timeRange, sort, onTimeRangeChange, onSortChange, onSearchChange, defaultSearch, showDivider = true }) => {
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

  const timeOptions = useMemo(() => [
    { v: TimeRange.ALL, l: '全部时间' },
    { v: TimeRange.TODAY, l: '今天' },
    { v: TimeRange.WEEK, l: '本周' },
    { v: TimeRange.MONTH, l: '本月' }
  ], [])

  

  return (
    <div className={`sticky top-0 z-30 bg-bg/95 dark:bg-gray-900/95 backdrop-blur-sm py-4 mb-6 -mx-6 px-6 ${showDivider ? 'border-b border-gray-200/50 dark:border-gray-700' : ''} space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]`}>
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 h-[42px] border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
          placeholder="搜索创意、标签…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        <SegmentedControl
          options={timeOptions.map(o => ({ value: o.v, label: o.l }))}
          value={timeRange}
          onChange={onTimeRangeChange}
        />

        <SegmentedControl
          options={sortOptions.map(o => ({ value: o.v, label: o.l }))}
          value={sort}
          onChange={onSortChange}
        />
      </div>
    </div>
  )
}
