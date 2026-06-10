import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { Observation, Comment } from '../../shared/types.js';
import { UserService } from './userService.js';

function enrichUser(userId?: number) {
  const { UserService } = require('./userService.js');
  return (row: any): Observation => {
    const db = getDb();
    const user = db.users.find((u) => u.id === row.userId);
    const species = row.speciesId ? db.species.find((s) => s.id === row.speciesId) || null : null;
    const comments: Comment[] = db.comments
      .filter((c) => c.observationId === row.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((c) => {
        const cu = db.users.find((u) => u.id === c.userId)!;
        return {
          id: c.id,
          observationId: c.observationId,
          userId: c.userId,
          content: c.content,
          createdAt: c.createdAt,
          user: UserService.findById(c.userId, userId),
        };
      });
    const isLiked = userId ? db.likes.some((l) => l.userId === userId && l.observationId === row.id) : false;
    return {
      ...row,
      user: user ? UserService.findById(user.id, userId) : undefined,
      species,
      comments,
      isLiked,
    };
  };
}

export const ObservationService = {
  enrichObservation: enrichUser as any as (row: any, userId?: number) => Observation,

  list(options: {
    speciesId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
    search?: string;
    currentUserId?: number;
  } = {}) {
    const db = getDb();
    let list = [...db.observations];
    if (options.speciesId) list = list.filter((o) => o.speciesId === options.speciesId);
    if (options.userId) list = list.filter((o) => o.userId === options.userId);
    if (options.startDate) list = list.filter((o) => o.observationTime >= options.startDate);
    if (options.endDate) list = list.filter((o) => o.observationTime <= options.endDate);
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.speciesName.toLowerCase().includes(q) ||
          (o.locationName?.toLowerCase().includes(q)) ||
          (o.description?.toLowerCase().includes(q)),
      );
    }
    if (options.lat && options.lng) {
      const R = 6371;
      const rad = (deg: number) => (deg * Math.PI) / 180;
      const rLat = rad(options.lat);
      const rLng = rad(options.lng);
      const radiusKm = options.radius ?? 50;
      list = list.filter((o) => {
        const dLat = rLat - rad(o.latitude);
        const dLng = rLng - rad(o.longitude);
        const a =
          Math.sin(dLat / 2) ** 2 + Math.cos(rad(o.latitude)) * Math.cos(rLat) * Math.sin(dLng / 2) ** 2;
        const d = 2 * R * Math.asin(Math.sqrt(a));
        return d <= radiusKm;
      });
    }
    list.sort((a, b) => b.observationTime.localeCompare(a.observationTime));
    if (options.limit) list = list.slice(0, options.limit);
    const enrich = enrichUser(options.currentUserId);
    return { data: list.map(enrich), total: list.length };
  },

  getById(id: number, currentUserId?: number) {
    const db = getDb();
    const obs = db.observations.find((o) => o.id === id);
    return obs ? enrichUser(currentUserId)(obs) : null;
  },

  create(data: {
    userId: number;
    speciesId?: number | null;
    speciesName: string;
    latitude: number;
    longitude: number;
    locationName?: string;
    observationTime: string;
    weather?: string;
    behavior?: string;
    photoUrls?: string[];
    description?: string;
  }) {
    const id = nextId('observations');
    const db = getDb();
    const obs = {
      id,
      userId: data.userId,
      speciesId: data.speciesId ?? null,
      speciesName: data.speciesName,
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: data.locationName ?? '',
      observationTime: data.observationTime,
      weather: data.weather ?? 'sunny',
      behavior: data.behavior ?? '',
      photoUrls: data.photoUrls ?? [],
      description: data.description ?? '',
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    db.observations.push(obs);
    scheduleSave();
    return this.getById(id, data.userId);
  },

  like(userId: number, observationId: number) {
    const db = getDb();
    const obs = db.observations.find((o) => o.id === observationId);
    if (!obs) return null;
    const existing = db.likes.find((l) => l.userId === userId && l.observationId === observationId);
    if (existing) {
      db.likes = db.likes.filter((l) => !(l.userId === userId && l.observationId === observationId));
      obs.likes = Math.max(0, obs.likes - 1);
    } else {
      const id = nextId('likes');
      db.likes.push({ id, userId, observationId, createdAt: new Date().toISOString() });
      obs.likes += 1;
    }
    scheduleSave();
    return { likes: obs.likes, liked: !existing };
  },

  addComment(userId: number, observationId: number, content: string) {
    const db = getDb();
    const id = nextId('comments');
    const c = { id, observationId, userId, content, createdAt: new Date().toISOString() };
    db.comments.push(c);
    scheduleSave();
    return this.getById(observationId, userId);
  },

  getFeed(userId: number) {
    const db = getDb();
    const followingIds = db.follows.filter((f) => f.followerId === userId).map((f) => f.followingId);
    if (followingIds.length === 0) return this.list({ currentUserId: userId, limit: 30 });
    return this.list({ currentUserId: userId });
  },
};
