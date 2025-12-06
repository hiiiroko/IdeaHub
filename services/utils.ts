export const parseTags = (input: string): string[] => {
  const raw = (input || '')
    .split(/[，,；;。\.\s]+/)
    .map(t => t.trim())
    .filter(Boolean)

  // 去重，保持顺序
  return Array.from(new Set(raw))
}

import { toast } from 'react-hot-toast'

export const toastError = (msg: string) => toast.error(msg)
export const toastSuccess = (msg: string) => toast.success(msg)
export const toastInfo = (msg: string) => toast(msg)