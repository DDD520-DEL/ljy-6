import { create } from 'zustand';
import api from '../lib/api';
import type { Notification } from '../../shared/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  async fetchNotifications() {
    set({ loading: true });
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        set({ notifications: data.data || [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  async fetchUnreadCount() {
    try {
      const { data } = await api.get('/notifications/unread-count');
      if (data.success) {
        set({ unreadCount: data.count });
      }
    } catch {
      /* ignore */
    }
  },

  async markAsRead(id: number) {
    try {
      const { data } = await api.put(`/notifications/${id}/read`);
      if (data.success) {
        const notifications = get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        );
        const unreadCount = Math.max(0, get().unreadCount - 1);
        set({ notifications, unreadCount });
      }
    } catch {
      /* ignore */
    }
  },

  async markAllAsRead() {
    try {
      const { data } = await api.put('/notifications/read-all');
      if (data.success) {
        const notifications = get().notifications.map((n) => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });
      }
    } catch {
      /* ignore */
    }
  },
}));
