import { supabase } from '../lib/supabase'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import type { Video as DbVideo } from '../types/index.ts'

const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'IdeaUploads'

export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const element = document.createElement('video')
    element.preload = 'metadata'
    element.onloadedmetadata = () => {
      window.URL.revokeObjectURL(element.src)
      resolve(Math.round(element.duration))
    }
    element.src = window.URL.createObjectURL(file)
  })
}

export const getVideoDurationFromUrl = (url: string): Promise<number> => {
  return new Promise((resolve) => {
    const element = document.createElement('video')
    element.preload = 'metadata'
    element.onloadedmetadata = () => {
      resolve(Math.round(element.duration))
    }
    element.src = url
  })
}

/**
 * 获取图片的宽高比（宽度/高度）
 */
export const getImageAspectRatio = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      URL.revokeObjectURL(img.src)
      resolve(ratio)
    }
    img.onerror = () => {
      resolve(1.77)
    }
    img.src = URL.createObjectURL(file)
  })
}

export const fetchVideos = async (
  sortBy: 'latest' | 'popular' = 'latest',
  searchKeyword: string = ''
): Promise<DbVideo[]> => {
  let query = supabase
    .from('videos')
    .select('*, profiles(username, uid)')

  if (searchKeyword) {
    query = query.or(`title.ilike.%${searchKeyword}%, tags.cs.{${searchKeyword}}`)
  }

  if (sortBy === 'latest') {
    query = query.order('created_at', { ascending: false })
  } else if (sortBy === 'popular') {
    query = query.order('view_count', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw error
  return data as DbVideo[]
}

export const uploadVideo = async (
  file: File,
  cover: File,
  meta: { title: string; description: string; tags: string[] },
  onProgress?: (percent: number) => void
) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const uploadToStorage = async (f: File, folder: 'videos' | 'covers') => {
    const ext = f.name.split('.').pop()
    const path = `${user.id}/${folder}/${uuidv4()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, f)
    if (error) {
      const msg = (error as any)?.message || 'Upload failed'
      if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')) {
        throw new Error(`存储桶 ${BUCKET} 未找到，请在 Supabase 创建并设为 public`)
      }
      throw error
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

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
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const videoExt = file.name.split('.').pop()
  const videoPath = `${user.id}/videos/${uuidv4()}.${videoExt}`
  const [videoUrl, coverUrl] = await Promise.all([
    uploadWithProgress(BUCKET, videoPath, file, onProgress),
    uploadToStorage(cover, 'covers')
  ])

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
      video_path: videoUrl,
      cover_path: coverUrl,
      duration,
      aspect_ratio: aspectRatio
    })
    .select()
    .single()

  if (error) throw error
  return data as DbVideo
}

export const publishGeneratedVideoFromUrl = async (
  videoUrl: string,
  cover: File,
  meta: { title: string; description: string; tags: string[] }
) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  const { data: coverUpload } = supabase.storage.from(BUCKET)
  const ext = cover.name.split('.').pop()
  const coverPath = `${user.id}/covers/${uuidv4()}.${ext}`
  const { error: coverErr } = await supabase.storage.from(BUCKET).upload(coverPath, cover)
  if (coverErr) throw coverErr
  const { data: coverPublic } = supabase.storage.from(BUCKET).getPublicUrl(coverPath)
  const [duration, aspectRatio] = await Promise.all([
    getVideoDurationFromUrl(videoUrl),
    getImageAspectRatio(cover)
  ])
  const { data, error } = await supabase
    .from('videos')
    .insert({
      uploader_id: user.id,
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      video_path: videoUrl,
      cover_path: coverPublic.publicUrl,
      duration,
      aspect_ratio: aspectRatio
    })
    .select()
    .single()
  if (error) throw error
  return data as DbVideo
}

export const fetchVideoById = async (id: string): Promise<DbVideo | null> => {
  const { data, error } = await supabase
    .from('videos')
    .select('*, profiles(username, uid)')
    .eq('id', id)
    .single()
  if (error) return null
  return data as DbVideo
}

export const updateVideo = async (
  id: string,
  updates: { title?: string; description?: string; tags?: string[] }
) => {
  const { error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export const deleteVideo = async (id: string, videoPath: string, coverPath: string) => {
  const { error: dbError } = await supabase
    .from('videos')
    .delete()
    .eq('id', id)
  if (dbError) throw dbError

  const bucket = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'IdeaUploads'
  const getPathFromUrl = (url: string) => {
    const parts = url.split('/' + bucket + '/')
    return parts[1] ? parts[1] : null
  }
  const vPath = getPathFromUrl(videoPath)
  const cPath = getPathFromUrl(coverPath)
  const files: string[] = []
  if (vPath) files.push(vPath)
  if (cPath) files.push(cPath)
  if (files.length > 0) {
    await supabase.storage.from(bucket).remove(files)
  }
}