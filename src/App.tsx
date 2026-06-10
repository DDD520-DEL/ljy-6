import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
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
import { useAuthStore } from './stores/authStore';
import { useLanguage } from './stores/languageStore';

function AppRoutes() {
  const restoreAuth = useAuthStore((s) => s.restoreAuth);
  useLanguage((s) => s.lang);
  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MapHomePage />} />
        <Route path="/observe/new" element={<NewObservationPage />} />
        <Route path="/observe/:id/edit" element={<NewObservationPage />} />
        <Route path="/bird-id" element={<BirdIdPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/observe/:id" element={<ObservationDetailPage />} />
        <Route path="/species/:id" element={<SpeciesDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
