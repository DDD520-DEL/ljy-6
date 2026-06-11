import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { OfflineBanner } from './OfflineBanner';
import { useT } from '../i18n';

export function Layout() {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-forest-50/20 to-white">
      <OfflineBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-sage-100 bg-white/50 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 text-center text-sage-500 text-sm">
          <div className="font-display text-lg text-forest-700 mb-2">{t('app_name')} · {t('app_tagline')}</div>
          <div>{t('footer_tagline')}</div>
          <div className="mt-4 text-xs text-sage-400">
            © {new Date().getFullYear()} Bird Watching Community · {t('footer_copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
