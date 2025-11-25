export type Resolution = '480p' | '720p'
export type Ratio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9'

export interface GenerateVideoParams {
  prompt: string
  resolution: Resolution
  ratio: Ratio
  duration: 3 | 4 | 5
  fps?: 16 | 24
}

export interface VideoGenerationStatus {
  id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  content?: { video_url: string }
  error?: string
}