import bcrypt from 'bcryptjs';
import { loadDb, nextId, resetDb } from './storage.js';
import { seedUsers, seedSpecies, seedObservations, seedComments } from './seedData.js';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function initializeDatabase(force = false) {
  const db = loadDb();
  if (db.users.length > 0 && !force) return;

  const users: any[] = [];
  const userPics = seedUsers.map((u, idx) => {
    const id = nextId('users');
    const user = {
      id,
      username: u.username,
      passwordHash: bcrypt.hashSync(u.password, 8),
      avatar: u.avatar,
      bio: u.bio,
      createdAt: new Date(Date.now() - (idx + 1) * 86400000 * 30).toISOString(),
    };
    users.push(user);
    return user;
  });

  const species: any[] = [];
  seedSpecies.forEach((s) => {
    const id = nextId('species');
    species.push({ id, ...s });
  });

  const observations: any[] = [];
  seedObservations.forEach((o) => {
    const id = nextId('observations');
    const daysAgo = o.daysAgo ?? rand(0, 30);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(o.hour ?? rand(6, 18), rand(0, 59), 0, 0);
    const time = d.toISOString();
    const obs = {
      id,
      userId: userPics[o.userIdx ?? 0].id,
      speciesId: o.speciesId ?? null,
      speciesName: o.speciesName,
      latitude: o.lat,
      longitude: o.lng,
      locationName: o.locationName,
      observationTime: time,
      weather: o.weather ?? 'sunny',
      behavior: o.behavior ?? '',
      photoUrls: [`https://picsum.photos/seed/bird${o.photo ?? id}/600/400`],
      description: o.description ?? '',
      likes: rand(0, 80),
      createdAt: time,
    };
    observations.push(obs);
  });

  const comments: any[] = [];
  seedComments.forEach((c) => {
    const id = nextId('comments');
    const d = new Date(observations[c.obsIdx]?.createdAt ?? Date.now());
    d.setMinutes(d.getMinutes() + rand(5, 300));
    comments.push({
      id,
      observationId: observations[c.obsIdx].id,
      userId: userPics[c.userIdx].id,
      content: c.content,
      createdAt: d.toISOString(),
    });
  });

  const follows: any[] = [];
  const followPairs = [[0, 1], [0, 2], [1, 0], [1, 3], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [4, 2]];
  followPairs.forEach(([a, b]) => {
    const id = nextId('follows');
    follows.push({
      id,
      followerId: userPics[a].id,
      followingId: userPics[b].id,
      createdAt: new Date(Date.now() - rand(1, 20) * 86400000).toISOString(),
    });
  });

  const likes: any[] = [];
  observations.forEach((obs) => {
    for (let i = 0; i < Math.min(obs.likes, 6); i++) {
      const id = nextId('likes');
      likes.push({
        id,
        userId: userPics[rand(0, userPics.length - 1)].id,
        observationId: obs.id,
        createdAt: new Date(Date.now() - rand(0, 7) * 86400000).toISOString(),
      });
    }
    obs.likes = likes.filter((l) => l.observationId === obs.id).length;
  });

  resetDb({
    users,
    species,
    observations,
    comments,
    follows,
    likes,
    notifications: [],
    collections: [],
    _counters: {
      users: users.length,
      species: species.length,
      observations: observations.length,
      comments: comments.length,
      follows: follows.length,
      likes: likes.length,
      notifications: 0,
      collections: 0,
    },
  });

  console.log(`[DB] 初始化完成: ${users.length} 用户, ${species.length} 物种, ${observations.length} 观测记录, ${comments.length} 评论, ${follows.length} 关注, ${likes.length} 点赞`);
}

if (process.argv[1] && process.argv[1].includes('init')) {
  initializeDatabase(true);
}
