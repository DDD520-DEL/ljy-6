import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, getDb } from '../../db/storage';
import { ObservationService } from '../observationService';
import { seedUsers, seedSpecies } from '../../db/seedData';

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

  return {
    users,
    species,
    observations: [],
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
    _counters: {
      users: users.length,
      species: species.length,
      observations: 0,
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
    },
  };
}

describe('Observation Service - Weather Fields (Temperature & Wind Direction)', () => {
  beforeEach(() => {
    const testDb = createTestDb();
    resetDb(testDb);
  });

  describe('create() - temperature and windDirection fields', () => {
    it('should store temperature when provided', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 25,
        windDirection: 'NE',
        behavior: '在地面啄食',
      });

      expect(obs).toBeDefined();
      expect(obs.temperature).toBe(25);
      expect(obs.windDirection).toBe('NE');

      const db = getDb();
      const savedObs = db.observations.find((o: any) => o.id === obs!.id);
      expect(savedObs.temperature).toBe(25);
      expect(savedObs.windDirection).toBe('NE');
    });

    it('should store zero temperature correctly', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'snowy',
        temperature: 0,
        windDirection: 'N',
      });

      expect(obs!.temperature).toBe(0);
    });

    it('should store negative temperature correctly', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'snowy',
        temperature: -5,
        windDirection: 'NW',
      });

      expect(obs!.temperature).toBe(-5);
    });

    it('should store undefined temperature when not provided', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
      });

      expect(obs!.temperature).toBeUndefined();
      expect(obs!.windDirection).toBeUndefined();
    });

    it('should store all wind directions correctly', () => {
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      
      for (const direction of directions) {
        const obs = ObservationService.create({
          userId: 1,
          speciesName: '麻雀',
          latitude: 39.9087,
          longitude: 116.3975,
          locationName: '北京·天安门广场',
          observationTime: new Date().toISOString(),
          weather: 'sunny',
          temperature: 20,
          windDirection: direction,
        });
        expect(obs!.windDirection).toBe(direction);
      }
    });
  });

  describe('update() - temperature and windDirection fields', () => {
    it('should update temperature when provided', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 20,
        windDirection: 'E',
      });

      const updated = ObservationService.update(obs!.id, {
        temperature: 28,
        windDirection: 'S',
      });

      expect(updated!.temperature).toBe(28);
      expect(updated!.windDirection).toBe('S');
    });

    it('should update only temperature without affecting windDirection', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 20,
        windDirection: 'E',
      });

      const updated = ObservationService.update(obs!.id, {
        temperature: 25,
      });

      expect(updated!.temperature).toBe(25);
      expect(updated!.windDirection).toBe('E');
    });

    it('should update only windDirection without affecting temperature', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 20,
        windDirection: 'E',
      });

      const updated = ObservationService.update(obs!.id, {
        windDirection: 'W',
      });

      expect(updated!.temperature).toBe(20);
      expect(updated!.windDirection).toBe('W');
    });

    it('should update temperature to undefined when explicitly set', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 20,
        windDirection: 'E',
      });

      const updated = ObservationService.update(obs!.id, {
        temperature: undefined,
      });

      expect(updated!.temperature).toBeUndefined();
      expect(updated!.windDirection).toBe('E');
    });

    it('should update weather fields alongside other observation fields', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 20,
        windDirection: 'E',
        behavior: 'old behavior',
      });

      const updated = ObservationService.update(obs!.id, {
        weather: 'rainy',
        temperature: 18,
        windDirection: 'SE',
        behavior: 'new behavior',
      });

      expect(updated!.weather).toBe('rainy');
      expect(updated!.temperature).toBe(18);
      expect(updated!.windDirection).toBe('SE');
      expect(updated!.behavior).toBe('new behavior');
    });

    it('should return null when updating non-existent observation', () => {
      const updated = ObservationService.update(9999, {
        temperature: 25,
      });

      expect(updated).toBeNull();
    });
  });

  describe('getById() - temperature and windDirection fields', () => {
    it('should return temperature and windDirection when queried', () => {
      const created = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 23,
        windDirection: 'NE',
      });

      const queried = ObservationService.getById(created!.id);

      expect(queried!.temperature).toBe(23);
      expect(queried!.windDirection).toBe('NE');
    });

    it('should handle observations without temperature data', () => {
      const created = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
      });

      const queried = ObservationService.getById(created!.id);

      expect(queried!.temperature).toBeUndefined();
      expect(queried!.windDirection).toBeUndefined();
    });
  });

  describe('list() - temperature and windDirection fields', () => {
    it('should include temperature and windDirection in list results', () => {
      ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 25,
        windDirection: 'E',
      });

      ObservationService.create({
        userId: 1,
        speciesName: '白头鹎',
        latitude: 39.9339,
        longitude: 116.4728,
        locationName: '北京·朝阳公园',
        observationTime: new Date().toISOString(),
        weather: 'cloudy',
        temperature: 18,
        windDirection: 'N',
      });

      const result = ObservationService.list({ limit: 10 });

      expect(result.data.length).toBe(2);
      expect(result.data[0].temperature).toBeDefined();
      expect(result.data[0].windDirection).toBeDefined();
      expect(result.data[1].temperature).toBeDefined();
      expect(result.data[1].windDirection).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal temperature values', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 22.5,
        windDirection: 'S',
      });

      expect(obs!.temperature).toBe(22.5);
    });

    it('should handle very low temperatures', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'snowy',
        temperature: -30,
        windDirection: 'NW',
      });

      expect(obs!.temperature).toBe(-30);
    });

    it('should handle very high temperatures', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 45,
        windDirection: 'S',
      });

      expect(obs!.temperature).toBe(45);
    });

    it('should handle empty string wind direction (though not recommended)', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 20,
        windDirection: '',
      });

      expect(obs!.windDirection).toBe('');
    });

    it('should persist data correctly through save cycle', () => {
      const obs = ObservationService.create({
        userId: 1,
        speciesName: '麻雀',
        latitude: 39.9087,
        longitude: 116.3975,
        locationName: '北京·天安门广场',
        observationTime: new Date().toISOString(),
        weather: 'sunny',
        temperature: 24,
        windDirection: 'NE',
      });

      const db = getDb();
      const savedObs = db.observations.find((o: any) => o.id === obs!.id);

      expect(savedObs.temperature).toBe(24);
      expect(savedObs.windDirection).toBe('NE');

      ObservationService.update(obs!.id, { temperature: 26, windDirection: 'E' });

      const updatedSavedObs = db.observations.find((o: any) => o.id === obs!.id);
      expect(updatedSavedObs.temperature).toBe(26);
      expect(updatedSavedObs.windDirection).toBe('E');
    });
  });
});
