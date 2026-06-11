import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import MapHomePage from './pages/MapHomePage';
import NewObservationPage from './pages/NewObservationPage';
import BirdIdPage from './pages/BirdIdPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ObservationDetailPage from './pages/ObservationDetailPage';
import SpeciesDetailPage from './pages/SpeciesDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import ChallengesPage from './pages/ChallengesPage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import { useAuthStore } from './stores/authStore';
import { useLanguage } from './stores/languageStore';
import { offlineCache } from './lib/offlineCache';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useT } from './i18n';
import { Bird, Database, CheckCircle } from 'lucide-react';

function AppRoutes() {
  const restoreAuth = useAuthStore((s) => s.restoreAuth);
  const user = useAuthStore((s) => s.user);
  useLanguage((s) => s.lang);
  const isOnline = useOnlineStatus();
  const t = useT();
  const [preloading, setPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState<string[]>([]);
  const [showPreloadDone, setShowPreloadDone] = useState(false);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  useEffect(() => {
    if (!isOnline) return;

    let cancelled = false;
    const runPreload = async () => {
      const meta = offlineCache.getCacheMeta();
      const now = Date.now();
      const shouldRefresh = !meta || (now - meta.lastSyncTime > 30 * 60 * 1000);
      if (!shouldRefresh) return;

      setPreloading(true);
      setPreloadProgress([]);

      try {
        const result = await offlineCache.preloadAllData(user?.id);
        if (cancelled) return;

        const progress: string[] = [];
        if (result.speciesLoaded) progress.push(t('cache_preload_species'));
        if (result.observationsLoaded) progress.push(t('cache_preload_observations'));
        if (result.collectionsLoaded) progress.push(t('cache_preload_collections'));
        setPreloadProgress(progress);

        if (progress.length > 0) {
          setShowPreloadDone(true);
          setTimeout(() => setShowPreloadDone(false), 3000);
        }
      } finally {
        if (!cancelled) setPreloading(false);
      }
    };

    const timer = setTimeout(runPreload, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOnline, user?.id, t]);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MapHomePage />} />
          <Route path="/observe/new" element={<NewObservationPage />} />
          <Route path="/observe/:id/edit" element={<NewObservationPage />} />
          <Route path="/bird-id" element={<BirdIdPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/observe/:id" element={<ObservationDetailPage />} />
          <Route path="/species/:id" element={<SpeciesDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Routes>

      {(preloading || showPreloadDone) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
          <div className="card !shadow-card-hover !py-3 !px-5 flex items-center gap-3 max-w-md">
            {preloading ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">
                  <Bird className="w-5 h-5 text-forest-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-forest-800 text-sm">
                    {t('cache_preload_title')}
                  </div>
                  {preloadProgress.length > 0 && (
                    <div className="text-xs text-sage-500 mt-0.5 flex flex-wrap gap-1.5">
                      {preloadProgress.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 text-forest-600">
                          <CheckCircle className="w-3 h-3" />
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-5 h-5 border-2 border-forest-200 border-t-forest-600 rounded-full animate-spin shrink-0" />
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shrink-0 shadow-md">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-forest-800 text-sm">
                    {t('cache_preload_done')}
                  </div>
                  <div className="text-xs text-sage-500 mt-0.5 flex flex-wrap gap-1.5">
                    {preloadProgress.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 text-forest-600">
                        <CheckCircle className="w-3 h-3" />
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-forest-500 shrink-0" />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
