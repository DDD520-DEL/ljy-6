import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-forest-50/20 to-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-sage-100 bg-white/50 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 text-center text-sage-500 text-sm">
          <div className="font-display text-lg text-forest-700 mb-2">飞羽寻踪 · 城市野鸟观测社区</div>
          <div>每一次驻足，都是与自然的相遇 🐦</div>
          <div className="mt-4 text-xs text-sage-400">
            © {new Date().getFullYear()} Bird Watching Community · 用热爱守护城市飞羽
          </div>
        </div>
      </footer>
    </div>
  );
}
