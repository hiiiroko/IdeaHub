import { supabase } from '../lib/supabase'

export const useUploadToBucket = () => {
  const uploadClientFallback = async (taskId: string, videoUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')
    const bucket = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'IdeaUploads'
    const path = `${user.id}/videos/ai-generated-${taskId}.mp4`
    const res = await fetch(videoUrl)
    if (!res.ok) throw new Error('下载视频失败')
    const blob = await res.blob()
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'video/mp4', upsert: false })
    if (uploadError) throw new Error(uploadError.message)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    return { taskId, videoPath: urlData.publicUrl as string }
  }

  const saveToBucket = async (taskId: string, videoUrl: string) => {
    const fn = (import.meta.env.VITE_GENERATE_FUNCTION_NAME as string) || 'generate-video'
    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { action: 'download', taskId, videoUrl }
      })
      if (error) throw new Error(error.message)
      return data as { taskId: string; videoPath: string }
    } catch {
      return await uploadClientFallback(taskId, videoUrl)
    }
  }

  return { saveToBucket }
}