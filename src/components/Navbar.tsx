import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Bird, MapPin, Search, Sparkles, BarChart3, Users, User, LogOut, Plus, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: '观测地图', icon: MapPin, end: true },
    { to: '/bird-id', label: '识鸟助手', icon: Sparkles },
    { to: '/analytics', label: '物种分析', icon: BarChart3 },
    { to: '/community', label: '观鸟社区', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-sage-100 shadow-soft">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center shadow-card group-hover:scale-105 transition-transform">
            <Bird className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-xl font-semibold text-forest-800 leading-none">飞羽寻踪</div>
            <div className="text-[11px] text-sage-500 tracking-wider">BIRD WATCHING</div>
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

        <div className="flex items-center gap-2">
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
            记录观测
          </button>

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
                    to={`/profile/${user.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sage-700 hover:bg-forest-50 transition"
                  >
                    <User className="w-4 h-4" />
                    我的主页
                  </Link>
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
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-secondary text-sm py-2 px-4 hidden sm:block">
              登录
            </Link>
          )}

          <button
            className="lg:hidden p-2 rounded-xl hover:bg-sage-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <Menu className="w-5 h-5 text-sage-700" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-sage-100 bg-white px-4 py-3 grid grid-cols-2 gap-2">
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
          {!user && (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2 col-span-2 justify-center">
              <User className="w-4 h-4" />
              登录 / 注册
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
