import toast from 'react-hot-toast'

type NotifyOptions = {
  id?: string
  dedupeMs?: number
}

const lastShown = new Map<string, number>()

const now = () => Date.now()

const shouldDedupe = (id: string | undefined, windowMs: number) => {
  if (!id) return false
  const last = lastShown.get(id) || 0
  return now() - last < windowMs
}

const markShown = (id: string | undefined) => {
  if (!id) return
  lastShown.set(id, now())
}

export const notifySuccess = (message: string, opts: NotifyOptions = {}) => {
  const { id, dedupeMs = 2000 } = opts
  if (shouldDedupe(id, dedupeMs)) return
  toast.success(message, id ? { id } : undefined)
  markShown(id)
}

export const notifyError = (message: string, opts: NotifyOptions = {}) => {
  const { id, dedupeMs = 2000 } = opts
  if (shouldDedupe(id, dedupeMs)) return
  toast.error(message, id ? { id } : undefined)
  markShown(id)
}

export const notifyInfo = (message: string, opts: NotifyOptions = {}) => {
  const { id, dedupeMs = 2000 } = opts
  if (shouldDedupe(id, dedupeMs)) return
  toast(message, id ? { id } : undefined)
  markShown(id)
}

