import type { UserLevel, UserLevelProgress } from '../../shared/types.js';
import { getDb } from '../db/storage.js';

export const LEVEL_CONFIG: UserLevel[] = [
  { level: 1, name: '新手观鸟者', icon: '🐣', color: 'from-gray-400 to-gray-500', minExp: 0, maxExp: 99 },
  { level: 2, name: '入门观鸟人', icon: '🐦', color: 'from-green-400 to-green-500', minExp: 100, maxExp: 299 },
  { level: 3, name: '观鸟爱好者', icon: '🦜', color: 'from-teal-400 to-teal-600', minExp: 300, maxExp: 599 },
  { level: 4, name: '资深观鸟者', icon: '🦅', color: 'from-blue-400 to-blue-600', minExp: 600, maxExp: 999 },
  { level: 5, name: '观鸟达人', icon: '🦉', color: 'from-purple-400 to-purple-600', minExp: 1000, maxExp: 1499 },
  { level: 6, name: '观鸟专家', icon: '🕊️', color: 'from-amber-400 to-amber-600', minExp: 1500, maxExp: 2199 },
  { level: 7, name: '鸟类学者', icon: '🔬', color: 'from-orange-400 to-orange-600', minExp: 2200, maxExp: 2999 },
  { level: 8, name: '观鸟大师', icon: '👑', color: 'from-rose-400 to-rose-600', minExp: 3000, maxExp: 3999 },
  { level: 9, name: '鸟类守护者', icon: '🏆', color: 'from-red-400 to-red-600', minExp: 4000, maxExp: 5499 },
  { level: 10, name: '飞羽传说', icon: '⭐', color: 'from-yellow-400 to-yellow-600', minExp: 5500, maxExp: 999999 },
];

export const EXP_CONFIG = {
  PER_OBSERVATION: 10,
  PER_COMMENT: 5,
  PER_LIKE_RECEIVED: 2,
};

export function getLevelByExp(exp: number): UserLevel {
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_CONFIG[i].minExp) {
      return LEVEL_CONFIG[i];
    }
  }
  return LEVEL_CONFIG[0];
}

export function calculateUserExp(userId: number): number {
  const db = getDb();
  
  const observations = db.observations.filter((o) => o.userId === userId);
  const obsExp = observations.length * EXP_CONFIG.PER_OBSERVATION;
  
  const comments = db.comments.filter((c) => c.userId === userId);
  const commentExp = comments.length * EXP_CONFIG.PER_COMMENT;
  
  const userObsIds = observations.map((o) => o.id);
  const likesReceived = db.likes.filter((l) => userObsIds.includes(l.observationId));
  const likeExp = likesReceived.length * EXP_CONFIG.PER_LIKE_RECEIVED;
  
  return obsExp + commentExp + likeExp;
}

export function getLevelProgress(exp: number): UserLevelProgress {
  const levelInfo = getLevelByExp(exp);
  const currentLevelExp = levelInfo.minExp;
  const nextLevelExp = levelInfo.maxExp + 1;
  const isMaxLevel = levelInfo.level === LEVEL_CONFIG[LEVEL_CONFIG.length - 1].level;
  
  const progressToNext = isMaxLevel
    ? 100
    : Math.min(100, Math.round(((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100));
  
  return {
    level: levelInfo.level,
    levelName: levelInfo.name,
    levelIcon: levelInfo.icon,
    levelColor: levelInfo.color,
    experiencePoints: exp,
    nextLevelExp: isMaxLevel ? levelInfo.maxExp : nextLevelExp,
    currentLevelExp,
    progressToNext,
  };
}

export function getAllLevels(): UserLevel[] {
  return LEVEL_CONFIG;
}
