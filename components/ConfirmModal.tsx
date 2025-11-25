import React from 'react'

export const ConfirmModal: React.FC<{
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
}> = ({ title = '确认', message, confirmText = '删除', cancelText = '取消', onConfirm, onClose }) => {
  const [working, setWorking] = React.useState(false)
  const handleConfirm = async () => {
    try {
      setWorking(true)
      await onConfirm()
    } finally {
      setWorking(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400">✕</button>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} disabled={working} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">{cancelText}</button>
          <button onClick={handleConfirm} disabled={working} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50">{confirmText}</button>
        </div>
        {working && (
          <div className="absolute left-6 bottom-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
            正在删除...
          </div>
        )}
      </div>
    </div>
  )
}