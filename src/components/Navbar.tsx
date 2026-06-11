import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Bird, MapPin, Sparkles, BarChart3, Users, User, LogOut, Plus, Menu, Bell, Trophy, Search, Star, MessageSquare, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useT } from '../i18n';
import { useLanguage } from '../stores/languageStore';
import { Globe } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const t = useT();
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(() => fetchUnreadCount(), 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  const navItems = [
    { to: '/', label: t('nav_map'), icon: MapPin, end: true },
    { to: '/bird-id', label: t('nav_bird_id'), icon: Sparkles },
    { to: '/analytics', label: t('nav_analytics'), icon: BarChart3 },
    { to: '/challenges', label: t('nav_challenges'), icon: Trophy },
    { to: '/community', label: t('nav_community'), icon: Users },
    { to: '/favorites', label: t('nav_favorites'), icon: Star },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-sage-100 shadow-soft">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center shadow-card group-hover:scale-105 transition-transform">
            <Bird className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-xl font-semibold text-forest-800 leading-none">{t('app_name')}</div>
            <div className="text-[11px] text-sage-500 tracking-wider">{t('app_subname')}</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link flex items-center gap-2 ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate('/search')}
          className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-sage-200 bg-sage-50/60 hover:bg-sage-100 text-sage-400 hover:text-sage-600 transition text-sm min-w-[180px]"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>{t('search_placeholder')}</span>
          <kbd className="ml-auto text-[10px] bg-white border border-sage-200 rounded px-1.5 py-0.5 text-sage-400 font-mono">⌘K</kbd>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/search')}
            className="lg:hidden p-2 rounded-xl hover:bg-sage-50 transition"
            aria-label={t('search_title')}
          >
            <Search className="w-5 h-5 text-sage-600" />
          </button>

          <button
            onClick={() => {
              if (!user) {
                navigate('/login');
              } else {
                navigate('/observe/new');
              }
            }}
            className="btn-primary hidden sm:flex items-center gap-1.5 text-sm py-2 px-4"
          >
            <Plus className="w-4 h-4" />
            {t('nav_record')}
          </button>

          {user && (
            <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-sage-50 transition">
              <Bell className="w-5 h-5 text-sage-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </Link>
          )}

          <div className="relative hidden sm:block">
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-sage-50 transition text-sage-600 text-sm"
            >
              <Globe className="w-4 h-4" />
              <span>{lang === 'zh' ? t('lang_en') : t('lang_zh')}</span>
            </button>
          </div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-sage-50 transition"
              >
                <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full border-2 border-forest-200 bg-white object-cover" />
                <span className="hidden md:inline text-sm font-medium text-sage-700 max-w-[100px] truncate">{user.username}</span>
                <Menu className="w-4 h-4 text-sage-500 md:hidden" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 card py-2 animate-slide-up">
                  <Link
                    to="/notifications"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sage-700 hover:bg-forest-50 transition"
                  >
                    <Bell className="w-4 h-4" />
                    {t('nav_notifications')}
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sage-700 hover:bg-forest-50 transition"
                  >
                    <Star className="w-4 h-4" />
                    {t('nav_favorites')}
                  </Link>
                  <Link
                    to={`/profile/${user.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sage-700 hover:bg-forest-50 transition"
                  >
                    <User className="w-4 h-4" />
                    {t('nav_profile')}
                  </Link>
                  <Link
                    to="/feedback"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sage-700 hover:bg-forest-50 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('feedback_nav')}
                  </Link>
                  <Link
                    to="/admin/feedback"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sage-700 hover:bg-forest-50 transition"
                  >
                    <Shield className="w-4 h-4" />
                    {t('feedback_admin_title')}
                  </Link>
                  <button
                    onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sage-700 hover:bg-forest-50 transition"
                  >
                    <Globe className="w-4 h-4" />
                    {lang === 'zh' ? t('lang_en') : t('lang_zh')}
                  </button>
                  <div className="border-t border-sage-100 my-1" />
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav_logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-secondary text-sm py-2 px-4 hidden sm:block">
              {t('nav_login')}
            </Link>
          )}

          <button
            className="lg:hidden p-2 rounded-xl hover:bg-sage-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t('nav_menu')}
          >
            <Menu className="w-5 h-5 text-sage-700" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-sage-100 bg-white px-4 py-3 grid grid-cols-2 gap-2">
          <Link
            to="/search"
            onClick={() => setMenuOpen(false)}
            className="nav-link flex items-center gap-2 col-span-2 justify-center"
          >
            <Search className="w-4 h-4" />
            {t('search_title')}
          </Link>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `nav-link flex items-center gap-2 ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => { setLang(lang === 'zh' ? 'en' : 'zh'); setMenuOpen(false); }}
            className="nav-link flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {lang === 'zh' ? t('lang_en') : t('lang_zh')}
          </button>
          {!user && (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2 col-span-2 justify-center">
              <User className="w-4 h-4" />
              {t('nav_login_register')}
            </Link>
          )}
          {user && (
            <Link to="/notifications" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2 relative">
              <Bell className="w-4 h-4" />
              {t('nav_notifications')}
              {unreadCount > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          )}
          {user && (
            <Link to="/feedback" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t('feedback_nav')}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
