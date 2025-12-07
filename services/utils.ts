export const parseTags = (input: string): string[] => {
  const raw = (input || '')
    .split(/[，,；;。\.\s]+/)
    .map(t => t.trim())
    .filter(Boolean)

  // 去重，保持顺序
  return Array.from(new Set(raw))
}

import { notifyError, notifySuccess, notifyInfo } from '../utils/notify'

export const toastError = (msg: string) => notifyError(msg)
export const toastSuccess = (msg: string) => notifySuccess(msg)
export const toastInfo = (msg: string) => notifyInfo(msg)
