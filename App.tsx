import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { VideoTaskPreview } from './components/AI/VideoTaskPreview';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { VideoGenerationTasksProvider, useVideoGenerationTasks } from './context/VideoGenerationTasksContext';
import { Create } from './pages/Create';
import { Detail } from './pages/Detail';
import { Discovery } from './pages/Discovery';
import { Manage } from './pages/Manage';

const AppContent: React.FC = () => {
  const [page, setPage] = useState('discovery');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const { refreshVideos } = useApp()
  const { previewTask, closePreview, removeTask, setPendingUseResult, pendingUseResult } = useVideoGenerationTasks()

  const handleNavigate = (p: string) => {
    setPage(p);
    if (p === 'discovery') {
      refreshVideos()
    }
    window.scrollTo(0, 0);
  };

  const handleUsePreviewVideo = () => {
    if (!previewTask || !previewTask.videoUrl) return
    setPendingUseResult({
      taskId: previewTask.taskId,
      videoUrl: previewTask.videoUrl,
      coverUrl: previewTask.coverUrl ?? null,
    })
    removeTask(previewTask.taskId)
    closePreview()
    setPage('create')
  }

  const handleClosePreview = () => {
    if (previewTask) {
      removeTask(previewTask.taskId)
    }
    closePreview()
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-gray-900 flex font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
      <Sidebar currentPage={page} onNavigate={handleNavigate} onRequireAuth={() => setAuthOpen(true)} />
      
      <main className="flex-1 ml-64 min-h-screen bg-bg dark:bg-gray-900 transition-colors duration-500 ease-[cubic-bezier(0.2,0.6,0.2,1)]">
        {page === 'discovery' && (
          <Discovery onVideoClick={setSelectedVideoId} />
        )}
        {page === 'create' && (
          <Create
            onComplete={() => handleNavigate('discovery')}
            pendingAiResult={pendingUseResult}
            onPendingAiResultConsumed={() => setPendingUseResult(null)}
          />
        )}
        {page === 'manage' && (
          <Manage />
        )}
      </main>

      {/* 详情弹窗路由 */}
      {selectedVideoId && (
        <Detail 
            videoId={selectedVideoId} 
            onClose={() => setSelectedVideoId(null)} 
            onRequireAuth={() => setAuthOpen(true)}
        />
      )}
      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} />
      )}
      <VideoTaskPreview
        open={!!previewTask?.videoUrl}
        videoUrl={previewTask?.videoUrl || ''}
        onUse={handleUsePreviewVideo}
        onClose={handleClosePreview}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <VideoGenerationTasksProvider>
        <AppContent />
        <Toaster position="top-center" />
      </VideoGenerationTasksProvider>
    </AppProvider>
  );
};

export default App;