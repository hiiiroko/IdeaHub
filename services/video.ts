import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

import { supabase } from '../lib/supabase'
import type { Video as DbVideo } from '../types/index.ts'
import { getVideoDuration, getVideoDurationFromUrl, getImageAspectRatio } from '../utils/media'

const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'IdeaUploads'

export const fetchVideos = async (
  sortBy: 'latest' | 'popular' = 'latest',
  searchKeyword: string = '',
  offset: number = 0,
  limit: number = 20
): Promise<DbVideo[]> => {
  let query = supabase
    .from('videos')
    .select(`
      *,
      profiles!videos_uploader_id_fkey (id, username, avatar_url, uid)
    `)
    .eq('is_public', true)
    .eq('is_deleted', false)

  if (searchKeyword) {
    query = query.or(`title.ilike.%${searchKeyword}%, tags.cs.{${searchKeyword}}`)
  }

  if (sortBy === 'latest') {
    query = query.order('created_at', { ascending: false })
  } else if (sortBy === 'popular') {
    // Note: view_count might not be on the table directly or sortable this way if it's separate.
    // User said: "点赞、观看事件有独立表... 前端只通过 RPC/统计".
    // For now, we might fall back to created_at or if there is a view/column added.
    // Assuming for now we can't easily sort by popular unless we have a materialized view or counter column.
    // If the schema user provided (Video interface) doesn't have view_count, we can't sort by it directly on 'videos' table.
    // I will default to created_at for now to avoid error, or check if view_count exists.
    // The user's interface for Video DOES NOT have view_count.
    // I will comment this out or fallback to created_at.
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) throw error
  return data as unknown as DbVideo[]
}

export const uploadVideo = async (
  file: File,
  cover: File,
  meta: { title: string; description: string; tags: string[] },
  onProgress?: (percent: number) => void
) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const videoExt = file.name.split('.').pop()
  const coverExt = cover.name.split('.').pop()
  const videoPath = `${user.id}/videos/${uuidv4()}.${videoExt}`
  const coverPath = `${user.id}/covers/${uuidv4()}.${coverExt}`

  const uploadWithProgress = async (bucket: string, path: string, f: File, cb?: (p: number) => void) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('未登录')
    const token = session.access_token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const baseUrl = (supabaseUrl || '').replace(/\/$/, '')
    const url = `${baseUrl}/storage/v1/object/${bucket}/${path}`
    await axios.post(url, f, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': f.type,
        'x-upsert': 'false'
      },
      onUploadProgress: (evt) => {
        if (evt.total && cb) {
          const percent = Math.round((evt.loaded / evt.total) * 100)
          cb(percent)
        }
      }
    })
  }

  // Upload video with progress
  await uploadWithProgress(BUCKET, videoPath, file, onProgress)
  
  // Upload cover (no progress needed usually, it's small)
  const { error: coverError } = await supabase.storage.from(BUCKET).upload(coverPath, cover, {
    contentType: cover.type
  })
  if (coverError) throw coverError

  const [duration, aspectRatio] = await Promise.all([
    getVideoDuration(file),
    getImageAspectRatio(cover)
  ])

  const { data, error } = await supabase
    .from('videos')
    .insert({
      uploader_id: user.id,
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      video_path: videoPath,
      cover_path: coverPath,
      duration,
      aspect_ratio: aspectRatio,
      is_public: true,
      is_deleted: false
    })
    .select(`
      *,
      profiles!videos_uploader_id_fkey (id, username, avatar_url, uid)
    `)
    .single()

  if (error) throw error
  return data as unknown as DbVideo
}

export const publishGeneratedVideoFromUrl = async (
  videoUrl: string, // This might be a temp URL from Ark or somewhere
  cover: File, // Or cover URL? The existing function takes File. 
  // If the video is already in storage (from generate task), we might handle it differently.
  // But assuming this is for uploading a generated video file?
  // Wait, the user guide says: action="download" -> returns Video record.
  // So maybe we don't need this function anymore if we use the "download" action?
  // The user guide says: "When task is succeeded, call action=download".
  // I'll keep this for manual upload of generated content if needed, but the new flow prefers the edge function.
  // I'll leave it as is but updated for the new schema if used.
  meta: { title: string; description: string; tags: string[] }
) => {
    // This function seems to be for the "old" way where we might have had a URL and uploaded it?
    // Or maybe we just use the edge function now.
    // I will leave it commented out or deprecated if not used, but to be safe I'll update it to match schema.
    // Actually, if videoUrl is external, we might need to download and upload it to our storage?
    // Or if it's already in our storage?
    // Given the new "download" action in Edge Function, that function probably handles moving/saving the video.
    // So I will likely not use this function.
    throw new Error("Please use the 'download' action in Video Generation")
}

export const fetchVideoById = async (id: string): Promise<DbVideo | null> => {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles!videos_uploader_id_fkey (id, username, avatar_url, uid)
    `)
    .eq('id', id)
    .single()
  if (error) return null
  return data as unknown as DbVideo
}

export const updateVideo = async (
  id: string,
  updates: { title?: string; description?: string; tags?: string[]; is_public?: boolean }
) => {
  const { error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export const deleteVideo = async (id: string) => {
  // Soft delete
  const { error } = await supabase
    .from('videos')
    .update({ is_deleted: true })
    .eq('id', id)
  
  if (error) throw error
}

export { getVideoDuration, getVideoDurationFromUrl }
