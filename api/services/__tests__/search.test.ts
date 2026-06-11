import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, getDb } from '../../db/storage';
import { SpeciesService } from '../speciesService';
import { ObservationService } from '../observationService';
import { UserService } from '../userService';
import { seedSpecies, seedUsers, seedObservations } from '../../db/seedData';

function createTestDb() {
  const now = new Date();
  const users = seedUsers.map((u, i) => ({
    id: i + 1,
    username: u.username,
    avatar: u.avatar,
    bio: u.bio,
    passwordHash: 'testhash',
    createdAt: new Date(now.getTime() - (i + 1) * 86400000).toISOString(),
  }));

  const species = seedSpecies.map((s, i) => ({
    ...s,
    id: i + 1,
  }));

  const observations = seedObservations.map((o, i) => {
    const obsDate = new Date(now.getTime() - o.daysAgo * 86400000);
    obsDate.setHours(o.hour, 0, 0, 0);
    return {
      id: i + 1,
      userId: o.userIdx + 1,
      speciesId: o.speciesId,
      speciesName: o.speciesName,
      latitude: o.lat,
      longitude: o.lng,
      locationName: o.locationName,
      observationTime: obsDate.toISOString(),
      weather: o.weather,
      behavior: o.behavior,
      photoUrls: [`https://picsum.photos/seed/bird${o.photo}/600/400`],
      thumbnailUrls: [],
      description: o.description,
      likes: Math.floor(Math.random() * 10),
      createdAt: new Date(now.getTime() - o.daysAgo * 86400000).toISOString(),
    };
  });

  return {
    users,
    species,
    observations,
    comments: [],
    follows: [],
    likes: [],
    notifications: [],
    collections: [],
    challenges: [],
    badges: [],
    userChallengeProgress: [],
    userBadges: [],
    activities: [],
    feedbacks: [],
    birdingEvents: [],
    birdingEventRegistrations: [],
    tags: [],
    observationTags: [],
    _counters: {
      users: users.length,
      species: species.length,
      observations: observations.length,
      comments: 0,
      follows: 0,
      likes: 0,
      notifications: 0,
      collections: 0,
      challenges: 0,
      badges: 0,
      userChallengeProgress: 0,
      userBadges: 0,
      activities: 0,
      feedbacks: 0,
      birdingEvents: 0,
      birdingEventRegistrations: 0,
      tags: 0,
      observationTags: 0,
    },
  };
}

describe('Search Service - Total Count Bug Fix', () => {
  beforeEach(() => {
    const testDb = createTestDb();
    resetDb(testDb);
  });

  describe('UserService.search()', () => {
    it('should return correct total count when no limit is applied', () => {
      const result = UserService.search({ q: '观' });
      expect(result.total).toBe(3);
      expect(result.data.length).toBe(3);
    });

    it('should return correct total count even when limit is smaller than total matches', () => {
      const result = UserService.search({ q: '观', limit: 1 });
      expect(result.total).toBe(3);
      expect(result.data.length).toBe(1);
    });

    it('should return total equal to data length when limit is larger than matches', () => {
      const result = UserService.search({ q: '观', limit: 100 });
      expect(result.total).toBe(3);
      expect(result.data.length).toBe(3);
    });

    it('should search in both username and bio', () => {
      const result1 = UserService.search({ q: '麻雀' });
      expect(result1.total).toBe(1);
      expect(result1.data[0].username).toBe('麻雀观察员');

      const result2 = UserService.search({ q: '上海' });
      expect(result2.total).toBe(1);
      expect(result2.data[0].username).toBe('麻雀观察员');
    });

    it('should return empty result with total 0 for no matches', () => {
      const result = UserService.search({ q: '不存在的用户' });
      expect(result.total).toBe(0);
      expect(result.data.length).toBe(0);
    });

    it('should return all users when no query is provided', () => {
      const result = UserService.search({ limit: 3 });
      expect(result.total).toBe(5);
      expect(result.data.length).toBe(3);
    });
  });

  describe('SpeciesService.getAll() - with search', () => {
    it('should return correct total count when no limit is applied', () => {
      const result = SpeciesService.getAll({ search: '鸟' });
      expect(result.total).toBeGreaterThan(5);
      expect(result.data.length).toBe(result.total);
    });

    it('should return correct total count even when limit is smaller than total matches', () => {
      const allMatches = SpeciesService.getAll({ search: '鸟' });
      const limitedResult = SpeciesService.getAll({ search: '鸟', limit: 3 });
      expect(limitedResult.total).toBe(allMatches.total);
      expect(limitedResult.data.length).toBe(3);
      expect(limitedResult.total).toBeGreaterThan(3);
    });

    it('should search in name, scientificName, and description', () => {
      const result1 = SpeciesService.getAll({ search: '麻雀' });
      expect(result1.total).toBe(1);
      expect(result1.data[0].name).toBe('麻雀');

      const result2 = SpeciesService.getAll({ search: 'Passer' });
      expect(result2.total).toBe(1);
      expect(result2.data[0].name).toBe('麻雀');

      const result3 = SpeciesService.getAll({ search: '常见' });
      expect(result3.total).toBeGreaterThan(1);
    });

    it('should work with combined filters and search', () => {
      const result = SpeciesService.getAll({ search: '城市', size: 'small', limit: 2 });
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.data.length).toBeLessThanOrEqual(2);
      result.data.forEach((s) => {
        expect(s.size).toBe('small');
      });
    });
  });

  describe('ObservationService.list() - with search', () => {
    it('should return correct total count when no limit is applied', () => {
      const result = ObservationService.list({ search: '麻雀' });
      expect(result.total).toBe(2);
      expect(result.data.length).toBe(2);
    });

    it('should return correct total count even when limit is smaller than total matches', () => {
      const result = ObservationService.list({ search: '麻雀', limit: 1 });
      expect(result.total).toBe(2);
      expect(result.data.length).toBe(1);
    });

    it('should search in speciesName, locationName, and description', () => {
      const result1 = ObservationService.list({ search: '北京' });
      expect(result1.total).toBeGreaterThan(1);

      const result2 = ObservationService.list({ search: '广场' });
      expect(result2.total).toBe(2);
      expect(result2.data.some((o) => o.locationName?.includes('广场'))).toBe(true);

      const result3 = ObservationService.list({ search: '觅食' });
      expect(result3.total).toBeGreaterThanOrEqual(1);
    });

    it('should work with combined filters and search', () => {
      const result = ObservationService.list({ search: '麻雀', userId: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
      expect(result.data[0].speciesName).toBe('麻雀');
      expect(result.data[0].user?.id).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string query', () => {
      const result = UserService.search({ q: '', limit: 2 });
      expect(result.total).toBe(5);
      expect(result.data.length).toBe(2);
    });

    it('should handle whitespace query', () => {
      const result = UserService.search({ q: '   ', limit: 2 });
      expect(result.total).toBe(5);
      expect(result.data.length).toBe(2);
    });

    it('should handle case-insensitive search', () => {
      const result1 = SpeciesService.getAll({ search: 'PASSER MONTANUS', limit: 5 });
      const result2 = SpeciesService.getAll({ search: 'passer montanus', limit: 5 });
      const result3 = SpeciesService.getAll({ search: '麻雀', limit: 5 });
      expect(result1.total).toBe(result2.total);
      expect(result1.total).toBe(1);
      expect(result3.total).toBe(1);
    });

    it('should handle partial matches', () => {
      const result = SpeciesService.getAll({ search: '雀', limit: 10 });
      expect(result.total).toBeGreaterThanOrEqual(1);
      const hasMatch = result.data.some((s) =>
        s.name.includes('雀') ||
        s.scientificName.toLowerCase().includes('雀') ||
        s.description.includes('雀'),
      );
      expect(hasMatch).toBe(true);
    });
  });
});
