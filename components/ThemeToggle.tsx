import React from 'react'

export const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; onToggle: () => void }> = ({ theme, onToggle }) => {
  return (
    <button
      aria-label="Toggle dark mode"
      onClick={onToggle}
      className="ml-auto relative inline-flex items-center w-12 h-6 rounded-full border select-none border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)] overflow-hidden"
    >
      <span
        className={"absolute top-1/2 -translate-y-1/2 inline-block w-5 h-5 rounded-full bg-white dark:bg-gray-200 shadow"}
        style={{ left: theme === 'dark' ? 'calc(100% - 21px)' : '1px', transition: 'left 300ms ease-in-out' }}
      ></span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="absolute w-3 h-3 text-gray-500 dark:text-gray-400 pointer-events-none"
        style={{
          left: theme === 'light' ? 'calc(100% - 16px)' : 'calc(100% + 12px)',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: theme === 'light' ? 1 : 0,
          transition: 'left 300ms ease-in-out, opacity 300ms ease-in-out'
        }}
      >
        <path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="absolute w-3 h-3 text-gray-500 dark:text-gray-400 pointer-events-none"
        style={{
          left: theme === 'dark' ? '6px' : '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: theme === 'dark' ? 1 : 0,
          transition: 'left 300ms ease-in-out, opacity 300ms ease-in-out'
        }}
      >
        <circle cx="12" cy="12" r="5" fill="currentColor"/>
        <g stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="4"/>
          <line x1="12" y1="20" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="4" y2="12"/>
          <line x1="20" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
          <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
        </g>
      </svg>
    </button>
  )
}
