import { describe, it, expect, beforeEach, vi } from 'vitest';
import offlineCache, { type ObservationDraft } from '../offlineCache';

const createMockDraft = (overrides: Partial<ObservationDraft> = {}): ObservationDraft => ({
  pos: [39.9087, 116.3975],
  locationName: '北京朝阳公园',
  speciesName: '麻雀',
  speciesId: 1,
  observationTime: '2024-01-15T10:30',
  weather: 'sunny',
  temperature: 20,
  windDirection: 'N',
  behavior: '在树枝上觅食',
  description: '体型小巧，头顶栗褐色',
  photos: [
    {
      url: 'https://example.com/photo1.jpg',
      thumbnailUrl: 'https://example.com/photo1_thumb.jpg',
      preview: 'data:image/jpeg;base64,abc123',
    },
  ],
  tagNames: ['城市鸟类', '常见鸟'],
  savedAt: Date.now(),
  ...overrides,
});

describe('offlineCache - Observation Draft', () => {
  const TEST_USER_ID = 1;
  const ANOTHER_USER_ID = 2;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  describe('Basic save and get operations', () => {
    it('should save and retrieve a draft correctly', () => {
      const draft = createMockDraft();
      offlineCache.setObservationDraft(TEST_USER_ID, draft);

      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.speciesName).toBe('麻雀');
      expect(retrieved?.locationName).toBe('北京朝阳公园');
      expect(retrieved?.pos).toEqual([39.9087, 116.3975]);
      expect(retrieved?.tagNames).toEqual(['城市鸟类', '常见鸟']);
      expect(retrieved?.photos).toHaveLength(1);
    });

    it('should return null when no draft exists', () => {
      const result = offlineCache.getObservationDraft(TEST_USER_ID);
      expect(result).toBeNull();
    });

    it('should isolate drafts between different users', () => {
      const draft1 = createMockDraft({ speciesName: '麻雀' });
      const draft2 = createMockDraft({ speciesName: '喜鹊' });

      offlineCache.setObservationDraft(TEST_USER_ID, draft1);
      offlineCache.setObservationDraft(ANOTHER_USER_ID, draft2);

      const user1Draft = offlineCache.getObservationDraft(TEST_USER_ID);
      const user2Draft = offlineCache.getObservationDraft(ANOTHER_USER_ID);

      expect(user1Draft?.speciesName).toBe('麻雀');
      expect(user2Draft?.speciesName).toBe('喜鹊');
    });
  });

  describe('No expiration (unlike regular cache)', () => {
    it('should NOT expire after 7 days', () => {
      const draft = createMockDraft();
      offlineCache.setObservationDraft(TEST_USER_ID, draft);

      vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);

      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.speciesName).toBe('麻雀');
    });

    it('should NOT expire after 30 days', () => {
      const draft = createMockDraft();
      offlineCache.setObservationDraft(TEST_USER_ID, draft);

      vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000);

      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);
      expect(retrieved).not.toBeNull();
    });

    it('should NOT expire after 1 year', () => {
      const draft = createMockDraft();
      offlineCache.setObservationDraft(TEST_USER_ID, draft);

      vi.advanceTimersByTime(365 * 24 * 60 * 60 * 1000);

      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);
      expect(retrieved).not.toBeNull();
    });
  });

  describe('Manual clearing', () => {
    it('should clear draft when explicitly cleared', () => {
      const draft = createMockDraft();
      offlineCache.setObservationDraft(TEST_USER_ID, draft);

      expect(offlineCache.getObservationDraft(TEST_USER_ID)).not.toBeNull();

      offlineCache.clearObservationDraft(TEST_USER_ID);
      expect(offlineCache.getObservationDraft(TEST_USER_ID)).toBeNull();
    });

    it('should only clear draft for specific user', () => {
      offlineCache.setObservationDraft(TEST_USER_ID, createMockDraft());
      offlineCache.setObservationDraft(ANOTHER_USER_ID, createMockDraft());

      offlineCache.clearObservationDraft(TEST_USER_ID);

      expect(offlineCache.getObservationDraft(TEST_USER_ID)).toBeNull();
      expect(offlineCache.getObservationDraft(ANOTHER_USER_ID)).not.toBeNull();
    });
  });

  describe('clearAll behavior', () => {
    it('clearAll() should NOT remove drafts', () => {
      offlineCache.setObservationDraft(TEST_USER_ID, createMockDraft());
      localStorage.setItem('bird_cache_species_list', JSON.stringify({ data: [], timestamp: Date.now(), version: '1.4.0' }));

      offlineCache.clearAll();

      expect(offlineCache.getObservationDraft(TEST_USER_ID)).not.toBeNull();
      expect(localStorage.getItem('bird_cache_species_list')).toBeNull();
    });

    it('clearAllIncludingDrafts() should remove drafts', () => {
      offlineCache.setObservationDraft(TEST_USER_ID, createMockDraft());
      localStorage.setItem('bird_cache_species_list', JSON.stringify({ data: [], timestamp: Date.now(), version: '1.4.0' }));

      offlineCache.clearAllIncludingDrafts();

      expect(offlineCache.getObservationDraft(TEST_USER_ID)).toBeNull();
      expect(localStorage.getItem('bird_cache_species_list')).toBeNull();
    });
  });

  describe('Version compatibility', () => {
    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('bird_cache_observation_draft_1', 'invalid-json');

      const result = offlineCache.getObservationDraft(TEST_USER_ID);
      expect(result).toBeNull();
    });

    it('should reject drafts with incompatible version', () => {
      const incompatibleDraft = JSON.stringify({
        data: createMockDraft(),
        savedAt: Date.now(),
        version: '0.0.0',
      });
      localStorage.setItem('bird_cache_observation_draft_1', incompatibleDraft);

      const result = offlineCache.getObservationDraft(TEST_USER_ID);
      expect(result).toBeNull();
    });
  });

  describe('Draft data integrity', () => {
    it('should preserve nested photo data', () => {
      const draft = createMockDraft({
        photos: [
          { url: 'url1', thumbnailUrl: 'thumb1', preview: 'preview1' },
          { url: 'url2', thumbnailUrl: 'thumb2' },
        ],
      });

      offlineCache.setObservationDraft(TEST_USER_ID, draft);
      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);

      expect(retrieved?.photos).toHaveLength(2);
      expect(retrieved?.photos[0]).toEqual({ url: 'url1', thumbnailUrl: 'thumb1', preview: 'preview1' });
      expect(retrieved?.photos[1]).toEqual({ url: 'url2', thumbnailUrl: 'thumb2' });
    });

    it('should preserve null/undefined optional fields', () => {
      const draft = createMockDraft({
        speciesId: null,
        temperature: undefined,
        windDirection: undefined,
        behavior: '',
        description: '',
      });

      offlineCache.setObservationDraft(TEST_USER_ID, draft);
      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);

      expect(retrieved?.speciesId).toBeNull();
      expect(retrieved?.temperature).toBeUndefined();
      expect(retrieved?.windDirection).toBeUndefined();
      expect(retrieved?.behavior).toBe('');
      expect(retrieved?.description).toBe('');
    });

    it('should preserve savedAt timestamp', () => {
      const savedAt = Date.now();
      const draft = createMockDraft({ savedAt });

      offlineCache.setObservationDraft(TEST_USER_ID, draft);
      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);

      expect(retrieved?.savedAt).toBe(savedAt);
    });

    it('should support empty arrays', () => {
      const draft = createMockDraft({
        photos: [],
        tagNames: [],
      });

      offlineCache.setObservationDraft(TEST_USER_ID, draft);
      const retrieved = offlineCache.getObservationDraft(TEST_USER_ID);

      expect(retrieved?.photos).toEqual([]);
      expect(retrieved?.tagNames).toEqual([]);
    });
  });
});
