export const parseTags = (input: string): string[] => {
  return (input || '')
    .split(/[，,；;。\.\s]+/)
    .map(t => t.trim())
    .filter(Boolean)
}

import { toast } from 'react-hot-toast'

export const toastError = (msg: string) => toast.error(msg)
export const toastSuccess = (msg: string) => toast.success(msg)
export const toastInfo = (msg: string) => toast(msg)