import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { User } from '../../shared/types.js';
import { ObservationService } from './observationService.js';
import { NotificationService } from './notificationService.js';

function countUserStats(userId: number) {
  const db = getDb();
  const observations = db.observations.filter((o) => o.userId === userId);
  const speciesSet = new Set(observations.map((o) => o.speciesId).filter((s) => s !== null));
  return {
    observationsCount: observations.length,
    speciesCount: speciesSet.size,
    followersCount: db.follows.filter((f) => f.followingId === userId).length,
    followingCount: db.follows.filter((f) => f.followerId === userId).length,
  };
}

function toPublicUser(user: any, currentUserId?: number): User {
  const stats = countUserStats(user.id);
  const db = getDb();
  const isFollowing = currentUserId
    ? db.follows.some((f) => f.followerId === currentUserId && f.followingId === user.id)
    : false;
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    isFollowing,
    ...stats,
  };
}

export const UserService = {
  findById(id: number, currentUserId?: number) {
    const db = getDb();
    const user = db.users.find((u) => u.id === id);
    return user ? toPublicUser(user, currentUserId) : null;
  },

  findByUsername(username: string) {
    const db = getDb();
    return db.users.find((u) => u.username === username) || null;
  },

  getFullUser(id: number) {
    const db = getDb();
    return db.users.find((u) => u.id === id) || null;
  },

  getAll(currentUserId?: number) {
    const db = getDb();
    return db.users.map((u) => toPublicUser(u, currentUserId));
  },

  search(options: { q?: string; limit?: number; currentUserId?: number } = {}) {
    const db = getDb();
    let list = db.users;
    if (options.q) {
      const ql = options.q.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(ql) ||
          (u.bio && u.bio.toLowerCase().includes(ql)),
      );
    }
    if (options.limit) list = list.slice(0, options.limit);
    return { data: list.map((u) => toPublicUser(u, options.currentUserId)), total: list.length };
  },

  create(data: { username: string; passwordHash: string; avatar?: string; bio?: string }) {
    const id = nextId('users');
    const db = getDb();
    const user = {
      id,
      username: data.username,
      passwordHash: data.passwordHash,
      avatar: data.avatar || '',
      bio: data.bio || '',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    scheduleSave();
    return toPublicUser(user);
  },

  follow(followerId: number, followingId: number) {
    const db = getDb();
    const existing = db.follows.find((f) => f.followerId === followerId && f.followingId === followingId);
    if (existing) return false;
    const id = nextId('follows');
    db.follows.push({
      id,
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    });
    NotificationService.create({
      type: 'follow',
      fromUserId: followerId,
      toUserId: followingId,
    });
    scheduleSave();
    return true;
  },

  unfollow(followerId: number, followingId: number) {
    const db = getDb();
    const before = db.follows.length;
    db.follows = db.follows.filter((f) => !(f.followerId === followerId && f.followingId === followingId));
    if (db.follows.length < before) {
      scheduleSave();
      return true;
    }
    return false;
  },

  getFollowers(userId: number, currentUserId?: number) {
    const db = getDb();
    return db.follows
      .filter((f) => f.followingId === userId)
      .map((f) => this.findById(f.followerId, currentUserId)!);
  },

  getFollowing(userId: number, currentUserId?: number) {
    const db = getDb();
    return db.follows
      .filter((f) => f.followerId === userId)
      .map((f) => this.findById(f.followingId, currentUserId)!);
  },

  getYearList(userId: number, year = new Date().getFullYear()) {
    const db = getDb();
    const start = new Date(year, 0, 1).toISOString();
    const end = new Date(year, 11, 31, 23, 59, 59).toISOString();
    const userObs = db.observations.filter(
      (o) => o.userId === userId && o.observationTime >= start && o.observationTime <= end,
    );
    const speciesMap = new Map<number, { count: number; firstDate: string }>();
    userObs.forEach((o) => {
      if (!o.speciesId) return;
      const cur = speciesMap.get(o.speciesId);
      if (!cur) {
        speciesMap.set(o.speciesId, { count: 1, firstDate: o.observationTime });
      } else {
        cur.count++;
        if (o.observationTime < cur.firstDate) cur.firstDate = o.observationTime;
      }
    });
    const data = Array.from(speciesMap.entries())
      .map(([speciesId, v]) => {
        const sp = db.species.find((s) => s.id === speciesId)!;
        return {
          speciesId,
          speciesName: sp.name,
          scientificName: sp.scientificName,
          count: v.count,
          firstDate: v.firstDate,
          imageUrl: sp.imageUrl,
        };
      })
      .sort((a, b) => a.firstDate.localeCompare(b.firstDate));
    return { data, total: data.length };
  },

  getUserObservations(userId: number, currentUserId?: number) {
    const db = getDb();
    return db.observations
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((o) => ObservationService.enrichObservation(o, currentUserId));
  },
};
