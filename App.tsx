import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Discovery } from './pages/Discovery';
import { Detail } from './pages/Detail';
import { Create } from './pages/Create';
import { Manage } from './pages/Manage';
import { AuthModal } from './components/AuthModal';
import { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
  const [page, setPage] = useState('discovery');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const { refreshVideos } = useApp()

  const handleNavigate = (p: string) => {
    setPage(p);
    if (p === 'discovery') {
      refreshVideos()
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-bg flex font-sans text-gray-900">
      <Sidebar currentPage={page} onNavigate={handleNavigate} onRequireAuth={() => setAuthOpen(true)} />
      
      <main className="flex-1 ml-64 min-h-screen">
        {page === 'discovery' && (
          <Discovery onVideoClick={setSelectedVideoId} />
        )}
        {page === 'create' && (
          <Create onComplete={() => handleNavigate('discovery')} />
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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
      <Toaster position="top-center" />
    </AppProvider>
  );
};

export default App;