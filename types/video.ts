export type Resolution = '480p' | '720p'
export type Ratio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9'

export interface GenerateVideoParams {
  prompt: string
  resolution: Resolution
  ratio: Ratio
  duration: number
  fps?: 16 | 24
}

export interface VideoGenerationTask {
  id: number
  user_id: string
  external_task_id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'uploaded'
  is_discarded: boolean
  prompt: string
  resolution: string
  ratio: string
  duration: number
  fps: number | null
  video_url: string | null
  last_frame_url: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// Keep this for compatibility if needed, or map to VideoGenerationTask
export interface VideoGenerationStatus {
  id: string // This might map to external_task_id or id
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  content?: { video_url: string }
  error?: string
}
