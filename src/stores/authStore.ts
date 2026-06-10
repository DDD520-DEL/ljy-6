import { create } from 'zustand';
import api from '../lib/api';
import type { User } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;

  restoreAuth: () => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, password: string, bio?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const getStored = () => {
  try {
    const t = localStorage.getItem('bird_token');
    const u = localStorage.getItem('bird_user');
    return { token: t, user: u ? (JSON.parse(u) as User) : null };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStored().user,
  token: getStored().token,
  loading: false,

  restoreAuth() {
    const s = getStored();
    set({ token: s.token, user: s.user });
  },

  async login(username, password) {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { username, password });
      if (data.success) {
        localStorage.setItem('bird_token', data.token);
        localStorage.setItem('bird_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, loading: false });
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: data.message };
    } catch (e: any) {
      set({ loading: false });
      return { success: false, message: e?.response?.data?.message || '登录失败' };
    }
  },

  async register(username, password, bio) {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { username, password, bio });
      if (data.success) {
        localStorage.setItem('bird_token', data.token);
        localStorage.setItem('bird_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, loading: false });
        return { success: true };
      }
      set({ loading: false });
      return { success: false, message: data.message };
    } catch (e: any) {
      set({ loading: false });
      return { success: false, message: e?.response?.data?.message || '注册失败' };
    }
  },

  logout() {
    localStorage.removeItem('bird_token');
    localStorage.removeItem('bird_user');
    set({ user: null, token: null });
  },

  async refreshMe() {
    if (!get().token) return;
    try {
      const { data } = await api.get('/auth/me');
      if (data.success && data.user) {
        localStorage.setItem('bird_user', JSON.stringify(data.user));
        set({ user: data.user });
      }
    } catch {
      /* ignore */
    }
  },
}));
