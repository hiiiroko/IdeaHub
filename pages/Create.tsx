import React, { useEffect, useState } from 'react';

import { VideoGenerateModal } from '../components/AI/VideoGenerateModal';
import { UploadIcon, PlayIcon } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { useVideoGenerationTasks } from '../context/VideoGenerationTasksContext';
import { useUploadVideo } from '../hooks/useUploadVideo';
import { useVideoGeneration } from '../hooks/useVideoGeneration';
import { toUiVideo } from '../services/adapters';
import { parseTags, toastError } from '../services/utils';
import { uploadVideo, fetchVideoById, updateVideoAspectRatio } from '../services/video';
import { Video } from '../types';
import { getVideoDuration, getImageAspectRatioFromUrl } from '../utils/media';
import { notifySuccess } from '../utils/notify';

export const Create: React.FC<{
  onComplete: () => void
  pendingAiResult?: { taskId: string; videoUrl: string; coverUrl: string | null }
  onPendingAiResultConsumed?: () => void
}> = ({ onComplete, pendingAiResult, onPendingAiResultConsumed }) => {
  const { currentUser, addVideo, updateVideo } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // 进度统一由 useUploadVideo 提供

  const { publish } = useVideoGeneration();
  const { upload, progress, loading } = useUploadVideo();
  const { removeTask } = useVideoGenerationTasks();

  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
  });
  
  const [files, setFiles] = useState<{ video: File | null; cover: File | null }>({
    video: null,
    cover: null,
  });

  const [invalid, setInvalid] = useState<{ video: boolean; cover: boolean }>({
    video: false,
    cover: false,
  })

  const MAX_VIDEO_SIZE = 15 * 1024 * 1024
  const MAX_COVER_SIZE = 3 * 1024 * 1024

  const [previews, setPreviews] = useState<{ video: string; cover: string }>({
    video: '',
    cover: '',
  });
  const [durationPreview, setDurationPreview] = useState<number | null>(null)
  const [previewLoadingVideo, setPreviewLoadingVideo] = useState(false)
  const [previewLoadingCover, setPreviewLoadingCover] = useState(false)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiTaskId, setAiTaskId] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  const applyAiResult = (result: { taskId: string; videoUrl: string; coverUrl: string | null }) => {
    setAiTaskId(result.taskId)
    setAiGenerating(false)
    setPreviews(prev => ({ ...prev, video: result.videoUrl, cover: result.coverUrl || '' }))
    setFiles(prev => ({ ...prev, video: null, cover: null }))
    setInvalid({ video: false, cover: false })
    setPreviewLoadingVideo(true)
    if (result.coverUrl) {
      setPreviewLoadingCover(true)
    } else {
      setPreviewLoadingCover(false)
    }
  }

  useEffect(() => {
    if (!pendingAiResult) return
    applyAiResult(pendingAiResult)
    onPendingAiResultConsumed?.()
  }, [pendingAiResult, onPendingAiResultConsumed])
  


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'cover') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const tooLarge =
        (type === 'video' && file.size > MAX_VIDEO_SIZE) ||
        (type === 'cover' && file.size > MAX_COVER_SIZE)

      if (tooLarge) {
        if (type === 'video') {
          toastError('视频大小超过 15MB，请压缩后重试')
          setInvalid(prev => ({ ...prev, video: true }))
          setFiles(prev => ({ ...prev, video: null }))
          setPreviews(prev => ({ ...prev, video: '' }))
        } else {
          toastError('封面大小超过 3MB，请选择更小的图片')
          setInvalid(prev => ({ ...prev, cover: true }))
          setFiles(prev => ({ ...prev, cover: null }))
          setPreviews(prev => ({ ...prev, cover: '' }))
        }
        e.target.value = ''
        return
      }

      const url = URL.createObjectURL(file);

      setFiles(prev => ({ ...prev, [type]: file }));
      setPreviews(prev => ({ ...prev, [type]: url }));
      setInvalid(prev => ({ ...prev, [type]: false }))
      if (type === 'video') {
        setAiTaskId('')
        setPreviewLoadingVideo(true)
      }
      if (type === 'cover') {
        setPreviewLoadingCover(true)
      }
      if (type === 'video') {
        getVideoDuration(file).then(d => setDurationPreview(d)).catch(() => setDurationPreview(null))
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAi = !!aiTaskId
    if (!isAi && (!files.video || !files.cover)) return;

    setIsSubmitting(true);
    let succeeded = false;

    try {
      const meta = { title: form.title, description: form.description, tags: parseTags(form.tags) }
      
      let dbVideo;
      let publishResult: any = null
      
      if (isAi) {
          // Use publish action for AI video
          const result = await publish(aiTaskId, meta)
          publishResult = result
          dbVideo = result.video // Assuming result contains the video record or we need to fetch it?
          // The user guide says: returns { taskId, video: Video, ... }
          // So result.video should be the DbVideo
      } else {
          await upload(files.video!, files.cover!, meta)
          dbVideo = null as any
      }
      
      if (!isAi) {
        // 手动上传路径已在 hook 内完成添加与补全，这里无需重复处理
      } else {
        if (!dbVideo) throw new Error('发布后未获取到视频信息')
        let uiVideo: Video = toUiVideo(dbVideo)
        if (currentUser) {
          uiVideo = {
            ...uiVideo,
            uploader: currentUser,
            isHydrated: false
          }
        }
        addVideo(uiVideo)
        const full = await fetchVideoById(dbVideo.id)
        if (full) {
          const hydrated = toUiVideo(full)
          updateVideo(dbVideo.id, { ...hydrated, isHydrated: true })
        }
        const coverUrl = publishResult?.coverPublicUrl || uiVideo.coverUrl
        if (coverUrl) {
          try {
            const ratio = await getImageAspectRatioFromUrl(coverUrl)
            await updateVideoAspectRatio(dbVideo.id, ratio)
            updateVideo(dbVideo.id, { aspectRatio: ratio })
          } catch {}
        }
      }
      succeeded = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发布失败'
      console.error(err)
      toastError(msg)
    }
    setIsSubmitting(false);
    if (succeeded) {
      onComplete();
    }
  };

  const onAiSaved = async (result: { taskId: string, videoUrl: string, coverUrl: string | null }) => {
    applyAiResult(result)
    removeTask(result.taskId)
  }

  return (
    <div className="max-w-3xl mx-auto p-8">

      <form onSubmit={handleSubmit} className="relative space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
        
        {/* 文件上传区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 视频上传 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">视频文件（MP4）</label>
                <div className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center h-48 transition-colors ${previews.video ? 'border-primary bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <button
                      type="button"
                      onClick={() => setAiOpen(true)}
                      className="aigc-btn absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded"
                    ><span>AI 生成视频</span></button>
                    {previews.video ? (
                        <div className="relative w-full h-full flex items-center justify-center group">
                            <video src={previews.video} className="h-full max-w-full object-contain rounded-lg" onLoadedData={() => setPreviewLoadingVideo(false)} />
                            {typeof previewLoadingVideo !== 'undefined' && previewLoadingVideo && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="aigc-skeleton w-11/12 h-5/6 rounded-lg flex items-center justify-center">
                                  <div className="aigc-spinner"></div>
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 pointer-events-none opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <span className="text-xs px-2 py-1 rounded bg-white/70 dark:bg-gray-200/70 text-gray-800 dark:text-gray-800">Change</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <UploadIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">点击上传视频</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">MP4 不超过 15MB</p>
                            {aiGenerating && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="aigc-skeleton w-11/12 h-5/6 rounded-lg flex items-center justify-center">
                                  <div className="aigc-spinner"></div>
                                </div>
                              </div>
                            )}
                        </>
                    )}
                    <input 
                        type="file" 
                        accept="video/mp4" 
                        onChange={(e) => handleFileChange(e, 'video')}
                        className="absolute inset-0 opacity-0 cursor-pointer z-0"
                    />
                </div>
            <div className="mt-2 h-6 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">{durationPreview != null ? `时长：${durationPreview}s` : ''}</p>
              {previews.video && durationPreview != null ? (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="预览播放"
                >
                  <PlayIcon className="w-3 h-3" /> 预览播放
                </button>
              ) : null}
            </div>
            </div>

            {/* 封面上传 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">封面图片（JPG/PNG）</label>
                <div className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center h-48 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)] ${previews.cover ? 'border-primary bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {previews.cover ? (
                         <div className="relative w-full h-full flex items-center justify-center">
                            <img src={previews.cover} className="h-full max-w-full object-cover rounded-lg" alt="preview" onLoad={() => setPreviewLoadingCover(false)} />
                            {typeof previewLoadingCover !== 'undefined' && previewLoadingCover && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="aigc-skeleton w-11/12 h-5/6 rounded-lg flex items-center justify-center">
                                  <div className="aigc-spinner"></div>
                                </div>
                              </div>
                            )}
                         </div>
                    ) : (
                        <>
                            <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">点击上传封面</p>
                            <p className="text-xs text-gray-400 mt-1">推荐 16:9 或 9:16 · 不超过 3MB</p>
                        </>
                    )}
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg"
                        onChange={(e) => handleFileChange(e, 'cover')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
            </div>
        </div>

        {/* 输入项 */}
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题 <span className="text-red-500">*</span></label>
                <input 
                    type="text" 
                    required
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
                    placeholder="示例：暑期活动方案 V1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                <textarea 
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)] resize-none"
                    placeholder="简要描述创意概念…"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签</label>
                <input 
                    type="text" 
                    value={form.tags}
                    onChange={(e) => setForm({...form, tags: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]"
                    placeholder="用逗号分隔：3D、搞笑、推广"
                />
            </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
            <button 
                type="button" 
                onClick={onComplete}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
                取消
            </button>
            <button 
                type="submit" 
                disabled={
                  isSubmitting ||
                  !form.title ||
                  (!files.video && !aiTaskId) || // Allow if aiTaskId is present
                  (!files.cover && !aiTaskId) || // Allow if aiTaskId is present (backend handles cover)
                  !currentUser ||
                  invalid.video ||
                  invalid.cover
                }
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {isSubmitting || loading ? '正在上传…' : '发布视频'}
              </button>
        </div>
        {(isSubmitting || loading) && (
          <div className="absolute left-8 bottom-6 text-sm w-[280px] md:w-[360px]">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="mt-2 flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>正在上传…</span>
              <span>{Math.floor(progress)}%</span>
            </div>
          </div>
        )}
      </form>
      {previewOpen && previews.video && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              aria-label="关闭预览"
            >
              ✕
            </button>
            <div className="w-full bg-black flex items-center justify-center">
              <video
                src={previews.video}
                controls
                autoPlay
                className="w-full h-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
      <style>{`
      .aigc-btn{position:absolute;overflow:hidden;border-radius:0.375rem;color:#fff}
      .aigc-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#22d3ee 0%,#ef4444 50%,#22d3ee 100%);background-size:200% 100%;opacity:1;z-index:0;animation:aigcFlow 3s linear infinite}
      .aigc-btn>span{position:relative;z-index:1}
      .aigc-btn{box-shadow:0 0 0 1px rgba(0,0,0,.1)}
      @keyframes aigcFlow{0%{background-position:0% 0%}100%{background-position:200% 0%}}
      .aigc-skeleton{width:100%;max-width:420px;background:linear-gradient(90deg,rgba(34,211,238,.25),rgba(239,68,68,.25),rgba(34,211,238,.25));background-size:200% 100%;animation:aigcFlow 2s linear infinite}
      .aigc-spinner{width:28px;height:28px;border:3px solid rgba(255,255,255,.6);border-top-color:#22d3ee;border-right-color:#ef4444;border-radius:50%;animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <VideoGenerateModal open={aiOpen} onClose={() => setAiOpen(false)} onSaved={onAiSaved} onStart={(p)=>{ setAiGenerating(true) }} onReset={()=> setAiGenerating(false)} />
    </div>
  );
};
