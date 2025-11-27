import { useCallback, useRef, useState } from 'react'

import { supabase } from '../lib/supabase'
import type { GenerateVideoParams, VideoGenerationStatus } from '../types/video'

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('未登录')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  }
}

export const useVideoGeneration = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const pollTimer = useRef<number | null>(null)
  const [taskId, setTaskId] = useState<string>('')
  const inFlightRef = useRef(false)
  const terminalRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const create = useCallback(async (params: GenerateVideoParams) => {
    setError(null)
    setLoading(true)
    const headers = await getHeaders()
    const base = import.meta.env.VITE_SUPABASE_URL as string
    const fn = (import.meta.env.VITE_GENERATE_FUNCTION_NAME as string) || 'generate-video'
    const url = new URL(`/functions/v1/${fn}`, base.replace(/\/$/, ''))
    console.log('[useVideoGeneration] create → url:', url.toString())
    console.log('[useVideoGeneration] create → body:', { action: 'create', ...params })
    const res = await fetch(url.toString(), {
      method: 'POST', headers,
      body: JSON.stringify({ action: 'create', ...params })
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[useVideoGeneration] create → non-ok:', res.status, text)
      throw new Error(`create failed: ${res.status} ${text}`)
    }
    const json = await res.json()
    console.log('[useVideoGeneration] create → response json:', json)
    const id = (json?.id) || (json?.task_id) || (json?.data?.id) || (json?.data?.task_id)
    if (!id) throw new Error('任务创建返回缺少 id')
    setTaskId(id)
    console.log('[useVideoGeneration] create → taskId:', id)
    return { id }
  }, [])

  const poll = useCallback(async (taskIdArg?: string) => {
    setError(null)
    terminalRef.current = false
    const effectiveId = taskIdArg || taskId
    if (!effectiveId) throw new Error('任务未创建')
    const headers = await getHeaders()
    const base = import.meta.env.VITE_SUPABASE_URL as string
    const fn = (import.meta.env.VITE_GENERATE_FUNCTION_NAME as string) || 'generate-video'
    const url = new URL(`/functions/v1/${fn}`, base.replace(/\/$/, ''))
    console.log('[useVideoGeneration] poll → url:', url.toString(), 'taskId:', effectiveId)
    return new Promise<VideoGenerationStatus>((resolve, reject) => {
      let elapsed = 0
      let attempt = 0
      let stopped = false

      const run = async () => {
        if (stopped || terminalRef.current) return
        if (videoUrl) {
          terminalRef.current = true
          stopped = true
          if (pollTimer.current) {
            clearTimeout(pollTimer.current)
            pollTimer.current = null
          }
          return
        }
        try {
          if (inFlightRef.current) return
          inFlightRef.current = true
          abortControllerRef.current?.abort()
          abortControllerRef.current = new AbortController()
          attempt += 1
          const res = await fetch(url.toString(), {
            method: 'POST', headers,
            body: JSON.stringify({ action: 'query', taskId: effectiveId }),
            signal: abortControllerRef.current.signal
          })
          if (!res.ok) {
            const text = await res.text()
            console.error('[useVideoGeneration] poll → non-ok:', res.status, text)
            if (videoUrl) {
              stopped = true
              terminalRef.current = true
              if (pollTimer.current) {
                clearTimeout(pollTimer.current)
                pollTimer.current = null
              }
              abortControllerRef.current?.abort()
              resolve({ id: effectiveId, status: 'succeeded', content: { video_url: videoUrl } })
              return
            }
            throw new Error(`query failed: ${res.status} ${text}`)
          }
          const json = await res.json() as VideoGenerationStatus
          console.log('[useVideoGeneration] poll → attempt', attempt, 'json:', json)
          if (json.status === 'succeeded' && json.content?.video_url) {
            setVideoUrl(json.content.video_url)
            console.log('[useVideoGeneration] poll → succeeded video_url:', json.content.video_url)
            stopped = true
            terminalRef.current = true
            if (pollTimer.current) {
              clearTimeout(pollTimer.current)
              pollTimer.current = null
            }
            abortControllerRef.current?.abort()
            resolve(json)
            return
          }
          if (json.status === 'failed') {
            stopped = true
            terminalRef.current = true
            if (pollTimer.current) {
              clearTimeout(pollTimer.current)
              pollTimer.current = null
            }
            setError(json.error || '生成失败')
            abortControllerRef.current?.abort()
            reject(new Error(json.error || '生成失败'))
            return
          }
          elapsed += 2000
          if (elapsed >= 120000) {
            stopped = true
            terminalRef.current = true
            if (pollTimer.current) {
              clearTimeout(pollTimer.current)
              pollTimer.current = null
            }
            setError('生成超时')
            abortControllerRef.current?.abort()
            reject(new Error('生成超时'))
            return
          }
        } catch (e: any) {
          stopped = true
          terminalRef.current = true
          if (pollTimer.current) {
            clearTimeout(pollTimer.current)
            pollTimer.current = null
          }
          setError(e?.message || '生成失败')
          console.error('[useVideoGeneration] poll → error:', e)
          abortControllerRef.current?.abort()
          reject(e)
          return
        } finally {
          inFlightRef.current = false
        }
        const baseDelay = 2000
        const maxDelay = 10000
        const nextDelay = Math.min(baseDelay * Math.pow(2, Math.min(attempt, 3)), maxDelay)
        pollTimer.current = window.setTimeout(run, nextDelay)
      }

      run()
    })
  }, [taskId])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setVideoUrl('')
    setTaskId('')
    if (pollTimer.current) clearTimeout(pollTimer.current)
    pollTimer.current = null
    terminalRef.current = false
    inFlightRef.current = false
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  return { create, poll, loading, error, videoUrl, taskId, reset }
}
