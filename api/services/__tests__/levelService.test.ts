import { describe, it, expect, beforeEach } from 'vitest';
import { getLevelByExp, calculateUserExp, getLevelProgress, getAllLevels, EXP_CONFIG, LEVEL_CONFIG } from '../levelService.js';
import { resetDb } from '../../db/storage.js';

describe('Level Service', () => {
  describe('getLevelByExp', () => {
    it('should return level 1 for 0 exp', () => {
      const level = getLevelByExp(0);
      expect(level.level).toBe(1);
      expect(level.name).toBe('新手观鸟者');
    });

    it('should return level 1 for 99 exp', () => {
      const level = getLevelByExp(99);
      expect(level.level).toBe(1);
    });

    it('should return level 2 for 100 exp', () => {
      const level = getLevelByExp(100);
      expect(level.level).toBe(2);
      expect(level.name).toBe('入门观鸟人');
    });

    it('should return level 3 for 300 exp', () => {
      const level = getLevelByExp(300);
      expect(level.level).toBe(3);
      expect(level.name).toBe('观鸟爱好者');
    });

    it('should return level 5 for 1000 exp', () => {
      const level = getLevelByExp(1000);
      expect(level.level).toBe(5);
      expect(level.name).toBe('观鸟达人');
    });

    it('should return max level for very high exp', () => {
      const level = getLevelByExp(10000);
      expect(level.level).toBe(10);
      expect(level.name).toBe('飞羽传说');
    });
  });

  describe('getLevelProgress', () => {
    it('should calculate progress for level 1', () => {
      const progress = getLevelProgress(50);
      expect(progress.level).toBe(1);
      expect(progress.experiencePoints).toBe(50);
      expect(progress.currentLevelExp).toBe(0);
      expect(progress.nextLevelExp).toBe(100);
      expect(progress.progressToNext).toBe(50);
    });

    it('should calculate progress for level 3', () => {
      const progress = getLevelProgress(450);
      expect(progress.level).toBe(3);
      expect(progress.currentLevelExp).toBe(300);
      expect(progress.nextLevelExp).toBe(600);
      expect(progress.progressToNext).toBe(50);
    });

    it('should return 100% progress for max level', () => {
      const progress = getLevelProgress(6000);
      expect(progress.level).toBe(10);
      expect(progress.progressToNext).toBe(100);
    });
  });

  describe('getAllLevels', () => {
    it('should return all 10 levels', () => {
      const levels = getAllLevels();
      expect(levels.length).toBe(10);
      expect(levels[0].level).toBe(1);
      expect(levels[9].level).toBe(10);
    });
  });

  describe('EXP_CONFIG', () => {
    it('should have correct exp values', () => {
      expect(EXP_CONFIG.PER_OBSERVATION).toBe(10);
      expect(EXP_CONFIG.PER_COMMENT).toBe(5);
      expect(EXP_CONFIG.PER_LIKE_RECEIVED).toBe(2);
    });
  });
});
