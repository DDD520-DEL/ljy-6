import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bird, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useT } from '../i18n';

export default function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const { login, register, loading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = mode === 'login' ? await login(username, password) : await register(username, password, bio);
    if (res.success) {
      setMessage({ type: 'success', text: mode === 'login' ? t('login_success_login') : t('login_success_register') });
      setTimeout(() => navigate('/'), 800);
    } else {
      setMessage({ type: 'error', text: res.message || t('login_failed') });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-forest-50 via-white to-sky-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-forest-500 to-forest-700 shadow-card-hover mb-5 animate-float">
            <Bird className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-forest-800">{t('login_title')}</h1>
          <p className="text-sage-600 mt-2">{t('login_subtitle')}</p>
        </div>

        <form onSubmit={submit} className="card p-7 animate-slide-up">
          <div className="flex mb-6 p-1 rounded-2xl bg-sage-50">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl font-medium transition ${mode === 'login' ? 'bg-white text-forest-700 shadow-card' : 'text-sage-600'}`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                {t('login_tab_login')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl font-medium transition ${mode === 'register' ? 'bg-white text-forest-700 shadow-card' : 'text-sage-600'}`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                {t('login_tab_register')}
              </span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-sage-700">{t('login_username')}</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login_username_placeholder')}
                className="input-base mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-sage-700">{t('login_password')}</label>
              <div className="relative mt-1">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? t('login_password_placeholder_login') : t('login_password_placeholder_register')}
                  className="input-base pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-sage-400 hover:text-sage-600 transition"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="text-sm font-medium text-sage-700">{t('login_bio_label')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('login_bio_placeholder')}
                  rows={3}
                  className="input-base mt-1 resize-none"
                />
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-xl text-sm ${message.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-forest-50 text-forest-700'}`}>
                {message.text}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-base disabled:opacity-50">
              {loading ? t('login_processing') : mode === 'login' ? t('login_submit_login') : t('login_submit_register')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-sage-500">
          <p className="mb-2">{t('login_demo_accounts')}</p>
        </div>
        <div className="card p-4 text-xs text-sage-500 space-y-2">
          <div className="flex justify-between">
            <span>观鸟达人 / 123456</span>
          </div>
          <div className="flex justify-between">
            <span>林间寻羽 / 123456</span>
          </div>
          <div className="flex justify-between">
            <span>麻雀观察员 / 123456</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-forest-600 hover:underline underline-offset-2">{t('login_back_home')}</Link>
        </div>
      </div>
    </div>
  );
}
