import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Statically load pages for instantaneous bottom tab switching in Telegram Mini App
import LessonsPage from './pages/LessonsPage';
import LessonDetailPage from './pages/LessonDetailPage';
import WordDetailPage from './pages/WordDetailPage';
import LearnPage from './pages/LearnPage';
import LeitnerBoxPage from './pages/LeitnerBoxPage';
import RankingPage from './pages/RankingPage';
import ProfilePage from './pages/ProfilePage';
import WordShooterPage from './pages/WordShooterPage';

import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import MobileBottomNav from './components/MobileBottomNav';
import { Send, Copy, Check } from 'lucide-react';

/* ── "Open in Telegram" gate ── */
function TelegramRestrictedScreen() {
  const [copied, setCopied] = React.useState(false);
  const botLink = 'https://t.me/eng504_bot';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(botLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--tg-theme-bg-color, #ffffff)' }}
    >
      <div className="max-w-sm w-full text-center space-y-6">
        <div
          className="mx-auto h-20 w-20 flex items-center justify-center rounded-full animate-pulse"
          style={{ background: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 12%, transparent)' }}
        >
          <Send
            className="h-9 w-9 transform rotate-45 -translate-x-0.5 -translate-y-0.5"
            style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>
            Open in Telegram
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>
            This app is exclusively available as a Telegram Mini App.
          </p>
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>
            BOT LINK
          </p>
          <p className="text-sm font-medium select-all" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>
            @eng504_bot
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={botLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full py-3 text-base"
          >
            Open Bot
          </a>
          <button onClick={copyToClipboard} className="btn btn-outline w-full py-3">
            {copied ? (
              <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
            ) : (
              <><Copy className="w-4 h-4 mr-2" />Copy Link</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page loading fallback ── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function AppContent() {
  const { loading, isTelegramWebApp } = useAuth();
  const location = useLocation();
  const hideNav = location.pathname === '/shooter';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--tg-theme-bg-color, #ffffff)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isTelegramWebApp) {
    return <TelegramRestrictedScreen />;
  }

  return (
    /* page bg = secondary (slightly off-white in Telegram light, dark in dark mode) */
    <div className="tg-page">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Always redirect root to lessons */}
          <Route path="/"         element={<Navigate to="/lessons" replace />} />
          <Route path="/login"    element={<Navigate to="/lessons" replace />} />
          <Route path="/register" element={<Navigate to="/lessons" replace />} />

          {/* Protected Routes */}
          <Route path="/lessons" element={<ProtectedRoute><LessonsPage /></ProtectedRoute>} />
          <Route path="/lessons/:lessonNumber" element={<ProtectedRoute><LessonDetailPage /></ProtectedRoute>} />
          <Route path="/words/:wordId" element={<ProtectedRoute><WordDetailPage /></ProtectedRoute>} />
          <Route path="/learn"   element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
          <Route path="/leitner" element={<ProtectedRoute><LeitnerBoxPage /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/shooter" element={<ProtectedRoute><WordShooterPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/lessons" replace />} />
        </Routes>
      </Suspense>

      {!hideNav && <MobileBottomNav />}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--tg-theme-bg-color, #ffffff)',
            color: 'var(--tg-theme-text-color, #212121)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
