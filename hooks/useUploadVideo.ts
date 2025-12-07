import { useCallback, useState } from 'react'

import { useApp } from '../context/AppContext'
import { toUiVideo } from '../services/adapters'
import { uploadVideo, fetchVideoById } from '../services/video'
import { notifySuccess, notifyError } from '../utils/notify'

type Meta = { title: string; description: string; tags: string[] }

export const useUploadVideo = () => {
  const { addVideo, updateVideo, currentUser } = useApp()
  const [progress, setProgress] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const upload = useCallback(async (file: File, cover: File, meta: Meta) => {
    setLoading(true)
    setProgress(0)
    let timer: any = null
    const startSimulate = () => {
      timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + 1.2
          return next >= 95 ? 95 : next
        })
      }, 150)
    }
    startSimulate()
    try {
      const dbVideo = await uploadVideo(
        file,
        cover,
        meta,
        (p) => setProgress(p),
        true
      )

      const uiVideo = toUiVideo(dbVideo)
      if (currentUser) {
        uiVideo.isHydrated = false
      }

      addVideo(uiVideo)

      notifySuccess('上传成功', { id: 'video-upload' })

      const hydrated = await fetchVideoById(dbVideo.id)
      if (hydrated) {
        updateVideo(dbVideo.id, toUiVideo(hydrated))
      }

      return dbVideo
    } catch (e: any) {
      notifyError(e?.message || '上传失败', { id: 'video-upload-error' })
      throw e
    } finally {
      if (timer) clearInterval(timer)
      setProgress(prev => (prev < 100 ? 100 : prev))
      setLoading(false)
    }
  }, [addVideo, updateVideo, currentUser])

  return { upload, progress, loading }
}
