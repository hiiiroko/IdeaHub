/**
 * Media utility functions for handling video and image processing
 */

/**
 * Get the duration of a video file in seconds
 */
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

/**
 * Get the aspect ratio (width/height) of an image file
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
      resolve(1.77) // Default to 16:9 if error
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Capture the first frame of a video from a URL as a Blob
 */
export const captureFirstFrame = async (url: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    ;(video as any).playsInline = true
    video.src = url
    
    video.onloadedmetadata = () => {
      try {
        video.currentTime = 0.001
      } catch (e) {
        console.warn('Seek to first frame failed', e)
      }
    }
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Capture frame failed'))
      }, 'image/jpeg')
    }
    
    video.onerror = () => reject(new Error('Video load error'))
  })
}
