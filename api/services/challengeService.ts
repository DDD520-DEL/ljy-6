import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { Challenge, Badge, UserChallengeProgress, UserBadge, ChallengeRankingItem, ChallengeType } from '../../shared/types.js';
import { NotificationService } from './notificationService.js';
import { UserService } from './userService.js';

const BADGE_DEFINITIONS: Omit<Badge, 'id'>[] = [
  { name: '观鸟新手', description: '完成首次月度挑战', icon: '🌱', rarity: 'common', color: 'bg-green-500' },
  { name: '物种探索者', description: '月度观测 5 种不同鸟类', icon: '🔍', rarity: 'common', color: 'bg-blue-500' },
  { name: '城市游侠', description: '在 3 个不同城市观测', icon: '🏙️', rarity: 'rare', color: 'bg-purple-500' },
  { name: '勤奋观鸟人', description: '月度记录 10 次观测', icon: '📝', rarity: 'common', color: 'bg-amber-500' },
  { name: '稀有猎手', description: '累计稀有度达到 200', icon: '💎', rarity: 'rare', color: 'bg-rose-500' },
  { name: '生态专家', description: '在 4 种不同栖息地观测', icon: '🌿', rarity: 'epic', color: 'bg-emerald-500' },
  { name: '观鸟大师', description: '连续完成 3 个月挑战', icon: '🏆', rarity: 'epic', color: 'bg-yellow-500' },
  { name: '飞羽传奇', description: '完成所有类型挑战', icon: '👑', rarity: 'legendary', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
];

const CHALLENGE_TEMPLATES: { type: ChallengeType; titles: string[]; descriptions: string[]; targets: number[]; units: string[]; badgeIndex: number }[] = [
  {
    type: 'species_count',
    titles: ['本月观测到 {n} 种不同鸟类', '发现 {n} 种新鸟种', '{n} 种鸟类识别挑战'],
    descriptions: ['在本月内记录 {n} 种不同的鸟类物种', '挑战自己识别 {n} 种不同的鸟', '扩展你的观鸟清单至 {n} 种'],
    targets: [5, 8, 10],
    units: ['种', '种', '种'],
    badgeIndex: 1,
  },
  {
    type: 'city_count',
    titles: ['在 {n} 个不同城市观测', '城市观鸟之旅：{n} 城', '跨城观鸟挑战'],
    descriptions: ['本月在 {n} 个不同城市留下观鸟足迹', '探索 {n} 个城市的鸟类世界', '在 {n} 个城市完成观测记录'],
    targets: [3, 5, 8],
    units: ['个', '个', '个'],
    badgeIndex: 2,
  },
  {
    type: 'observation_count',
    titles: ['本月记录 {n} 次观测', '{n} 次观鸟打卡挑战', '坚持记录 {n} 天'],
    descriptions: ['本月共记录 {n} 条有效的观测记录', '坚持观鸟，完成 {n} 次打卡', '保持热情，记录 {n} 次美好瞬间'],
    targets: [10, 15, 20],
    units: ['次', '次', '次'],
    badgeIndex: 3,
  },
  {
    type: 'rarity_sum',
    titles: ['累计稀有度达到 {n}', '稀有鸟类收集家', '珍稀鸟种猎手'],
    descriptions: ['本月观测鸟类的稀有度总和达到 {n}', '寻找并记录稀有鸟类，累计 {n} 点稀有度', '挑战观测更稀有的鸟类，累计 {n} 点'],
    targets: [200, 300, 500],
    units: ['点', '点', '点'],
    badgeIndex: 4,
  },
  {
    type: 'habitat_variety',
    titles: ['在 {n} 种不同栖息地观测', '生态多样性挑战', '探索 {n} 种栖息地'],
    descriptions: ['在 {n} 种不同类型的栖息地完成观测', '体验多样生态环境，探索 {n} 种栖息地', '在城市、森林、湿地等 {n} 种环境中观鸟'],
    targets: [4, 5, 6],
    units: ['种', '种', '种'],
    badgeIndex: 5,
  },
];

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export const ChallengeService = {
  initializeBadges(): Badge[] {
    const db = getDb();
    if (db.badges.length > 0) return db.badges;

    const badges: Badge[] = BADGE_DEFINITIONS.map((def) => {
      const id = nextId('badges');
      const badge = { id, ...def };
      db.badges.push(badge);
      return badge;
    });

    scheduleSave();
    return badges;
  },

  getBadges(): Badge[] {
    this.initializeBadges();
    return getDb().badges;
  },

  getBadgeById(id: number): Badge | undefined {
    return this.getBadges().find((b) => b.id === id);
  },

  generateMonthlyChallenges(year: number, month: number): Challenge[] {
    const db = getDb();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    const existing = db.challenges.filter((c) => c.year === year && c.month === monthStr);
    if (existing.length >= 3) return existing;

    this.initializeBadges();

    const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    const challenges: Challenge[] = selected.map((template) => {
      const targetIdx = Math.floor(Math.random() * template.targets.length);
      const target = template.targets[targetIdx];
      const titleIdx = Math.floor(Math.random() * template.titles.length);
      const descIdx = Math.floor(Math.random() * template.descriptions.length);
      const badge = db.badges[template.badgeIndex];

      const id = nextId('challenges');
      const challenge: Challenge = {
        id,
        month: monthStr,
        year,
        type: template.type,
        title: template.titles[titleIdx].replace('{n}', String(target)),
        description: template.descriptions[descIdx].replace('{n}', String(target)),
        target,
        unit: template.units[targetIdx],
        badgeId: badge.id,
        createdAt: new Date().toISOString(),
      };

      db.challenges.push(challenge);
      return challenge;
    });

    scheduleSave();
    return challenges;
  },

  ensureCurrentMonthChallenges(): Challenge[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return this.generateMonthlyChallenges(year, month);
  },

  getChallenges(options: { year?: number; month?: number; userId?: number } = {}): { data: (Challenge & { progress?: UserChallengeProgress | null })[]; total: number } {
    const db = getDb();
    this.ensureCurrentMonthChallenges();

    let challenges = [...db.challenges];

    if (options.year !== undefined) {
      challenges = challenges.filter((c) => c.year === options.year);
    }
    if (options.month !== undefined) {
      const monthStr = `${options.year || new Date().getFullYear()}-${String(options.month + 1).padStart(2, '0')}`;
      challenges = challenges.filter((c) => c.month === monthStr);
    }

    challenges.sort((a, b) => b.month.localeCompare(a.month) || b.createdAt.localeCompare(a.createdAt));

    let result = challenges;
    if (options.userId !== undefined) {
      result = challenges.map((c) => {
        const progress = db.userChallengeProgress.find((p) => p.challengeId === c.id && p.userId === options.userId) || null;
        return { ...c, progress };
      });
    }

    return { data: result, total: result.length };
  },

  getChallengeById(id: number): Challenge | undefined {
    return getDb().challenges.find((c) => c.id === id);
  },

  calculateProgress(userId: number, challenge: Challenge): number {
    const db = getDb();
    const [year, month] = challenge.month.split('-').map(Number);

    const monthStart = new Date(year, month - 1, 1).toISOString();
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const userObservations = db.observations.filter(
      (o) => o.userId === userId && o.observationTime >= monthStart && o.observationTime <= monthEnd,
    );

    switch (challenge.type) {
      case 'species_count': {
        const speciesIds = new Set(userObservations.filter((o) => o.speciesId).map((o) => o.speciesId));
        return speciesIds.size;
      }
      case 'city_count': {
        const cities = new Set(
          userObservations
            .filter((o) => o.locationName)
            .map((o) => {
              const match = o.locationName.match(/^(.+?)[·•]/);
              return match ? match[1] : o.locationName;
            }),
        );
        return cities.size;
      }
      case 'observation_count':
        return userObservations.length;
      case 'rarity_sum': {
        let sum = 0;
        userObservations.forEach((o) => {
          if (o.speciesId) {
            const species = db.species.find((s) => s.id === o.speciesId);
            if (species) sum += species.rarity;
          }
        });
        return sum;
      }
      case 'habitat_variety': {
        const habitats = new Set<string>();
        userObservations.forEach((o) => {
          if (o.speciesId) {
            const species = db.species.find((s) => s.id === o.speciesId);
            if (species?.habitat) {
              species.habitat.forEach((h: string) => habitats.add(h));
            }
          }
        });
        return habitats.size;
      }
      default:
        return 0;
    }
  },

  updateProgress(userId: number, challengeId: number): UserChallengeProgress | null {
    const db = getDb();
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) return null;

    const currentValue = this.calculateProgress(userId, challenge);
    let progress = db.userChallengeProgress.find((p) => p.challengeId === challengeId && p.userId === userId);

    const wasCompleted = progress?.completed || false;
    const nowCompleted = currentValue >= challenge.target;

    if (!progress) {
      const id = nextId('userChallengeProgress');
      progress = {
        id,
        userId,
        challengeId,
        currentValue,
        completed: nowCompleted,
        completedAt: nowCompleted ? new Date().toISOString() : null,
        badgeAwarded: false,
      };
      db.userChallengeProgress.push(progress);
    } else {
      progress.currentValue = currentValue;
      if (!wasCompleted && nowCompleted) {
        progress.completed = true;
        progress.completedAt = new Date().toISOString();
      }
    }

    if (progress.completed && !progress.badgeAwarded) {
      this.awardBadge(userId, challengeId, challenge.badgeId);
      progress.badgeAwarded = true;
    }

    scheduleSave();
    return progress;
  },

  updateAllProgressForUser(userId: number): UserChallengeProgress[] {
    const db = getDb();
    const challenges = db.challenges;
    const results: UserChallengeProgress[] = [];

    challenges.forEach((challenge) => {
      const progress = this.updateProgress(userId, challenge.id);
      if (progress) results.push(progress);
    });

    return results;
  },

  awardBadge(userId: number, challengeId: number, badgeId: number): UserBadge | null {
    const db = getDb();

    const existing = db.userBadges.find((ub) => ub.userId === userId && ub.badgeId === badgeId && ub.challengeId === challengeId);
    if (existing) return existing;

    const id = nextId('userBadges');
    const userBadge: UserBadge = {
      id,
      userId,
      badgeId,
      challengeId,
      awardedAt: new Date().toISOString(),
    };

    db.userBadges.push(userBadge);

    const badge = db.badges.find((b) => b.id === badgeId);
    if (badge) {
      NotificationService.create({
        type: 'badge_earned',
        fromUserId: 0,
        toUserId: userId,
      });
    }

    scheduleSave();
    return userBadge;
  },

  getUserBadges(userId: number): { data: UserBadge[]; total: number } {
    const db = getDb();
    const userBadges = db.userBadges
      .filter((ub) => ub.userId === userId)
      .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt))
      .map((ub) => ({
        ...ub,
        badge: db.badges.find((b) => b.id === ub.badgeId),
        challenge: db.challenges.find((c) => c.id === ub.challengeId),
      }));

    return { data: userBadges, total: userBadges.length };
  },

  getRankings(options: { year?: number; month?: number } = {}): { data: ChallengeRankingItem[]; total: number } {
    const db = getDb();
    const now = new Date();
    const year = options.year ?? now.getFullYear();
    const month = options.month ?? now.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthChallenges = db.challenges.filter((c) => c.month === monthStr);
    const users = db.users;

    const rankings = users.map((user) => {
      let completedCount = 0;
      let totalProgress = 0;

      monthChallenges.forEach((challenge) => {
        const progress = db.userChallengeProgress.find(
          (p) => p.challengeId === challenge.id && p.userId === user.id,
        );

        if (progress) {
          if (progress.completed) completedCount++;
          const pct = Math.min(100, (progress.currentValue / challenge.target) * 100);
          totalProgress += pct;
        }
      });

      const userData = UserService.findById(user.id);

      return {
        userId: user.id,
        user: userData!,
        completedCount,
        totalProgress: Math.round(totalProgress),
        rank: 0,
      };
    });

    rankings.sort((a, b) => {
      if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
      return b.totalProgress - a.totalProgress;
    });

    rankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return { data: rankings, total: rankings.length };
  },

  getMonthName(month: number): string {
    return MONTH_NAMES[month];
  },
};
