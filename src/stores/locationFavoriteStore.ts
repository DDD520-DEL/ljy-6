import { create } from 'zustand';
import type { LocationFavorite } from '../../shared/types';
import { offlineCache } from '../lib/offlineCache';

interface LocationFavoriteState {
  favorites: LocationFavorite[];
  loading: boolean;
  loadFavorites: (userId: number) => void;
  addFavorite: (userId: number, data: Omit<LocationFavorite, 'id' | 'userId' | 'createdAt'>) => LocationFavorite;
  removeFavorite: (userId: number, favoriteId: number) => void;
  isFavorite: (lat: number, lng: number, userId?: number) => boolean;
  clearFavorites: () => void;
}

export const useLocationFavoriteStore = create<LocationFavoriteState>((set, get) => ({
  favorites: [],
  loading: false,

  loadFavorites(userId: number) {
    const cached = offlineCache.getLocationFavorites(userId);
    if (cached) {
      set({ favorites: cached });
    }
  },

  addFavorite(userId: number, data) {
    const newFavorite: LocationFavorite = {
      id: Date.now(),
      userId,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const favorites = [...get().favorites, newFavorite];
    set({ favorites });
    offlineCache.setLocationFavorites(userId, favorites);
    return newFavorite;
  },

  removeFavorite(userId: number, favoriteId: number) {
    const favorites = get().favorites.filter((f) => f.id !== favoriteId);
    set({ favorites });
    offlineCache.setLocationFavorites(userId, favorites);
  },

  isFavorite(lat: number, lng: number, userId?: number) {
    if (!userId) return false;
    return get().favorites.some(
      (f) => Math.abs(f.latitude - lat) < 0.000001 && Math.abs(f.longitude - lng) < 0.000001
    );
  },

  clearFavorites() {
    set({ favorites: [] });
  },
}));

export default useLocationFavoriteStore;
