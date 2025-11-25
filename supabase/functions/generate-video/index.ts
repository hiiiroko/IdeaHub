// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VOLCANO_API_BASE = "https://ark.cn-beijing.volces.com/api/v3"
const VOLCANO_API_KEY = Deno.env.get('VOLCANO_API_KEY') || ""

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface GenerateVideoRequest {
  prompt: string
  resolution: '480p' | '720p'
  ratio: '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9'
  duration: 3 | 4 | 5
  fps?: 16 | 24
}

interface VideoGenerationTask {
  id: string
  model: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  content?: {
    video_url: string
  }
  created_at: number
  updated_at: number
  resolution?: string
  ratio?: string
  duration?: number
  framespersecond?: number
  seed?: number
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()
    console.log('[generate-video] action:', action, 'params:', params)

    if (action === 'create') {
      return await createTask(params as GenerateVideoRequest)
    } else if (action === 'query') {
      return await queryTask(params.taskId as string)
    } else if (action === 'download') {
      const authHeader = req.headers.get('Authorization')
      return await downloadAndUpload(params.taskId as string, params.videoUrl as string, authHeader || '')
    } else {
      throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function createTask(params: GenerateVideoRequest): Promise<Response> {
  const { prompt, resolution, ratio, duration, fps = 16 } = params

  // 构建完整的提示词
  const fullPrompt = `${prompt} --rs ${resolution} --rt ${ratio} --dur ${duration} --fps ${fps}`
  console.log('[generate-video] createTask prompt:', fullPrompt)

  const response = await fetch(`${VOLCANO_API_BASE}/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOLCANO_API_KEY}`
    },
    body: JSON.stringify({
      content: [{
        text: fullPrompt,
        type: 'text'
      }],
      model: 'doubao-seedance-1-0-pro-fast-251015'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[generate-video] createTask non-ok:', response.status, errorText)
    throw new Error(`Failed to create task: ${errorText}`)
  }

  const data = await response.json()
  console.log('[generate-video] createTask response:', data)

  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function queryTask(taskId: string): Promise<Response> {
  console.log('[generate-video] queryTask taskId:', taskId)
  const response = await fetch(
    `${VOLCANO_API_BASE}/contents/generations/tasks/${taskId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOLCANO_API_KEY}`
      }
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[generate-video] queryTask non-ok:', response.status, errorText)
    throw new Error(`Failed to query task: ${errorText}`)
  }

  const data: VideoGenerationTask = await response.json()
  console.log('[generate-video] queryTask response:', data)

  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function downloadAndUpload(taskId: string, videoUrl: string, authHeader: string): Promise<Response> {
  // 1. 下载视频
  console.log('[generate-video] downloadAndUpload taskId:', taskId, 'videoUrl:', videoUrl)
  const videoResponse = await fetch(videoUrl, { redirect: 'follow' })
  if (!videoResponse.ok) {
    const text = await videoResponse.text().catch(()=> '')
    console.error('[generate-video] download non-ok:', videoResponse.status, text)
    throw new Error('Failed to download video')
  }

  const videoBlob = await videoResponse.blob()
  const videoArrayBuffer = await videoBlob.arrayBuffer()

  // 2. 提取首帧（简化版：我们将在前端处理首帧提取）
  // Deno 环境中处理视频首帧比较复杂，建议在前端完成

  // 3. 初始化 Supabase 客户端
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 4. 获取用户 ID（从请求头中）
  if (!authHeader) {
    throw new Error('No authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)

  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  // 5. 上传视频到 Supabase Storage
  const bucket = Deno.env.get('VITE_SUPABASE_BUCKET') || 'IdeaUploads'
  const videoPath = `${user.id}/videos/ai-generated-${taskId}.mp4`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(videoPath, videoArrayBuffer, {
      contentType: 'video/mp4',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Failed to upload video: ${uploadError.message}`)
  }

  // 6. 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(videoPath)
  console.log('[generate-video] uploaded videoPath:', urlData.publicUrl)

  return new Response(
    JSON.stringify({
      taskId,
      videoPath: urlData.publicUrl
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-video' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
