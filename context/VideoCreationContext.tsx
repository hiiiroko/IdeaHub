import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CreateFormState {
  title: string;
  description: string;
  tags: string;
}

interface FileState {
  video: File | null;
  cover: File | null;
}

interface PreviewState {
  video: string;
  cover: string;
}

interface VideoCreationContextType {
  // State
  form: CreateFormState;
  files: FileState;
  previews: PreviewState;
  invalid: { video: boolean; cover: boolean };
  isSubmitting: boolean;
  aiTaskId: string;
  durationPreview: number | null;
  previewLoadingVideo: boolean;
  previewLoadingCover: boolean;
  
  // Actions
  setForm: (form: CreateFormState | ((prev: CreateFormState) => CreateFormState)) => void;
  setFiles: (files: FileState | ((prev: FileState) => FileState)) => void;
  setPreviews: (previews: PreviewState | ((prev: PreviewState) => PreviewState)) => void;
  setInvalid: (invalid: { video: boolean; cover: boolean } | ((prev: { video: boolean; cover: boolean }) => { video: boolean; cover: boolean })) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setAiTaskId: (id: string) => void;
  setDurationPreview: (duration: number | null) => void;
  setPreviewLoadingVideo: (loading: boolean) => void;
  setPreviewLoadingCover: (loading: boolean) => void;
  reset: () => void;
}

const VideoCreationContext = createContext<VideoCreationContextType | undefined>(undefined);

export const VideoCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [form, setForm] = useState<CreateFormState>({
    title: '',
    description: '',
    tags: '',
  });

  const [files, setFiles] = useState<FileState>({
    video: null,
    cover: null,
  });

  const [previews, setPreviews] = useState<PreviewState>({
    video: '',
    cover: '',
  });

  const [invalid, setInvalid] = useState({
    video: false,
    cover: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiTaskId, setAiTaskId] = useState('');
  const [durationPreview, setDurationPreview] = useState<number | null>(null);
  const [previewLoadingVideo, setPreviewLoadingVideo] = useState(false);
  const [previewLoadingCover, setPreviewLoadingCover] = useState(false);

  const reset = useCallback(() => {
    setForm({ title: '', description: '', tags: '' });
    setFiles({ video: null, cover: null });
    setPreviews({ video: '', cover: '' });
    setInvalid({ video: false, cover: false });
    setIsSubmitting(false);
    setAiTaskId('');
    setDurationPreview(null);
    setPreviewLoadingVideo(false);
    setPreviewLoadingCover(false);
  }, []);

  return (
    <VideoCreationContext.Provider
      value={{
        form,
        setForm,
        files,
        setFiles,
        previews,
        setPreviews,
        invalid,
        setInvalid,
        isSubmitting,
        setIsSubmitting,
        aiTaskId,
        setAiTaskId,
        durationPreview,
        setDurationPreview,
        previewLoadingVideo,
        setPreviewLoadingVideo,
        previewLoadingCover,
        setPreviewLoadingCover,
        reset,
      }}
    >
      {children}
    </VideoCreationContext.Provider>
  );
};

export const useVideoCreation = () => {
  const context = useContext(VideoCreationContext);
  if (context === undefined) {
    throw new Error('useVideoCreation must be used within a VideoCreationProvider');
  }
  return context;
};
