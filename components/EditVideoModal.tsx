import React, { useState } from 'react'

import { useApp } from '../context/AppContext'
import { parseTags } from '../services/utils'
import { updateVideo as updateVideoSvc } from '../services/video'
import type { Video } from '../types'

export const EditVideoModal: React.FC<{ video: Video; onClose: () => void }> = ({ video, onClose }) => {
  const { updateVideo } = useApp()
  const [title, setTitle] = useState(video.title || '')
  const [description, setDescription] = useState(video.description || '')
  const [tagsInput, setTagsInput] = useState((video.tags || []).join(', '))
  const [working, setWorking] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setWorking(true)
    try {
      const updates = {
        title: title.trim(),
        description: description.trim(),
        tags: parseTags(tagsInput)
      }
      await updateVideoSvc(video.id, updates)
      updateVideo(video.id, updates)
      onClose()
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">编辑视频</h2>
          <button onClick={onClose} disabled={working} className="text-gray-500 dark:text-gray-400">✕</button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签</label>
            <input value={tagsInput} onChange={e=>setTagsInput(e.target.value)} placeholder="用逗号分隔" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={working} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">取消</button>
            <button type="submit" disabled={working || !title.trim()} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">保存</button>
          </div>
        </form>
        {working && (
          <div className="absolute left-6 bottom-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
            正在保存…
          </div>
        )}
      </div>
    </div>
  )
}