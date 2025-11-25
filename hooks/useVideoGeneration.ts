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
      const tick = async () => {
        try {
          attempt += 1
          const res = await fetch(url.toString(), {
            method: 'POST', headers,
            body: JSON.stringify({ action: 'query', taskId: effectiveId })
          })
          if (!res.ok) {
            const text = await res.text()
            console.error('[useVideoGeneration] poll → non-ok:', res.status, text)
            throw new Error(`query failed: ${res.status} ${text}`)
          }
          const json = await res.json() as VideoGenerationStatus
          console.log('[useVideoGeneration] poll → attempt', attempt, 'json:', json)
          if (json.status === 'succeeded' && json.content?.video_url) {
            setVideoUrl(json.content.video_url)
            console.log('[useVideoGeneration] poll → succeeded video_url:', json.content.video_url)
            clearInterval(pollTimer.current!)
            resolve(json)
          } else if (json.status === 'failed') {
            clearInterval(pollTimer.current!)
            setError(json.error || '生成失败')
            reject(new Error(json.error || '生成失败'))
          } else {
            elapsed += 2000
            if (elapsed >= 120000) {
              clearInterval(pollTimer.current!)
              setError('生成超时')
              reject(new Error('生成超时'))
            }
          }
        } catch (e: any) {
          clearInterval(pollTimer.current!)
          setError(e?.message || '生成失败')
          console.error('[useVideoGeneration] poll → error:', e)
          reject(e)
        }
      }
      pollTimer.current = window.setInterval(tick, 2000)
      tick()
    })
  }, [taskId])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setVideoUrl('')
    setTaskId('')
    if (pollTimer.current) clearInterval(pollTimer.current)
  }, [])

  return { create, poll, loading, error, videoUrl, taskId, reset }
}