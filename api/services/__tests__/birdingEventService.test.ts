import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from '../../db/storage';
import { BirdingEventService } from '../birdingEventService';
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
    tags: [],
    observationTags: [],
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
      tags: 0,
      observationTags: 0,
    },
  };
}

const EXTERNAL_API_URL_PATTERN = /trae-api-cn\.mchost\.guru/;

describe('BirdingEventService - DEFAULT_IMAGE 外部依赖消除测试', () => {
  beforeEach(() => {
    const testDb = createTestDb();
    resetDb(testDb);
  });

  describe('create() - 封面图处理', () => {
    const baseData = {
      userId: 1,
      title: '测试观鸟活动',
      description: '这是一个测试活动的详细描述',
      locationName: '测试公园南门',
      latitude: 39.9087,
      longitude: 116.3975,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      maxParticipants: 20,
    };

    it('当 imageUrl 为 undefined 时，不包含外部 API URL', () => {
      const event = BirdingEventService.create({
        ...baseData,
        imageUrl: undefined,
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.imageUrl).toBe('');
      expect(EXTERNAL_API_URL_PATTERN.test(event.imageUrl || '')).toBe(false);
    });

    it('当 imageUrl 为空字符串时，正确存储为空字符串', () => {
      const event = BirdingEventService.create({
        ...baseData,
        imageUrl: '',
      });

      expect(event).toBeDefined();
      expect(event.imageUrl).toBe('');
      expect(EXTERNAL_API_URL_PATTERN.test(event.imageUrl)).toBe(false);
    });

    it('当 imageUrl 为有效 URL 时，正确存储该 URL', () => {
      const validUrl = 'https://example.com/uploads/birding-cover.jpg';
      const event = BirdingEventService.create({
        ...baseData,
        imageUrl: validUrl,
      });

      expect(event).toBeDefined();
      expect(event.imageUrl).toBe(validUrl);
    });

    it('不传入 imageUrl 参数时，不使用任何默认的外部 URL', () => {
      const event = BirdingEventService.create({
        ...baseData,
      } as any);

      expect(event).toBeDefined();
      expect(event.imageUrl).toBe('');
      expect(EXTERNAL_API_URL_PATTERN.test(event.imageUrl || '')).toBe(false);
    });

    it('当传入的 imageUrl 指向外部 API 域名时，正确存储但不做替换', () => {
      const externalUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
      const event = BirdingEventService.create({
        ...baseData,
        imageUrl: externalUrl,
      });

      expect(event.imageUrl).toBe(externalUrl);
    });

    it('批量创建无封面活动时，全部不包含外部 URL', () => {
      const events: any[] = [];
      for (let i = 0; i < 5; i++) {
        events.push(
          BirdingEventService.create({
            ...baseData,
            title: `活动 ${i + 1}`,
            startTime: new Date(Date.now() + 86400000 * (i + 1)).toISOString(),
            endTime: new Date(Date.now() + 86400000 * (i + 2)).toISOString(),
          }),
        );
      }

      events.forEach((e, i) => {
        expect(e).toBeDefined();
        expect(EXTERNAL_API_URL_PATTERN.test(e.imageUrl || '')).toBe(false);
      });
    });
  });
});

describe('BirdingEventService - 报名逻辑与权限', () => {
  beforeEach(() => {
    const testDb = createTestDb();
    resetDb(testDb);
  });

  const createDefaultEvent = (overrides: any = {}) => {
    return BirdingEventService.create({
      userId: 1,
      title: '默认活动',
      description: '默认描述',
      locationName: '默认地点',
      latitude: 39.9087,
      longitude: 116.3975,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      maxParticipants: 3,
      ...overrides,
    });
  };

  describe('create() - 核心字段验证', () => {
    it('正确分配自增 ID', () => {
      const e1 = createDefaultEvent();
      const e2 = createDefaultEvent({ title: '活动二' });
      expect(e1.id).toBeGreaterThan(0);
      expect(e2.id).toBe(e1.id + 1);
    });

    it('设置正确的创建时间', () => {
      const before = Date.now();
      const event = createDefaultEvent();
      const after = Date.now();
      const createdAt = new Date(event.createdAt).getTime();
      expect(createdAt).toBeGreaterThanOrEqual(before - 1000);
      expect(createdAt).toBeLessThanOrEqual(after + 1000);
    });

    it('registeredCount 初始化为 0', () => {
      const event = createDefaultEvent();
      expect(event.registeredCount).toBe(0);
    });

    it('包含创建者用户信息', () => {
      const event = createDefaultEvent();
      expect(event.user).toBeDefined();
      expect(event.user!.id).toBe(1);
    });
  });

  describe('register() - 报名逻辑', () => {
    it('成功报名后 registeredCount +1', () => {
      const event = createDefaultEvent();
      const result = BirdingEventService.register(event.id, 2);
      expect(result.success).toBe(true);
      expect((result as any).data.registeredCount).toBe(1);
    });

    it('重复报名返回失败提示', () => {
      const event = createDefaultEvent();
      BirdingEventService.register(event.id, 2);
      const result = BirdingEventService.register(event.id, 2);
      expect(result.success).toBe(false);
      expect(result.message).toContain('已报名');
    });

    it('超过人数上限时报名失败', () => {
      const event = createDefaultEvent({ maxParticipants: 2 });
      BirdingEventService.register(event.id, 2);
      BirdingEventService.register(event.id, 3);
      const result = BirdingEventService.register(event.id, 4);
      expect(result.success).toBe(false);
      expect(result.message).toContain('已满');
    });

    it('不存在的活动报名失败', () => {
      const result = BirdingEventService.register(99999, 2);
      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    it('活动创建者也可以报名自己的活动', () => {
      const event = createDefaultEvent({ maxParticipants: 10 });
      const result = BirdingEventService.register(event.id, 1);
      expect(result.success).toBe(true);
      expect((result as any).data.registeredCount).toBe(1);
    });

    it('isRegistered 标志正确反映报名状态', () => {
      const event = createDefaultEvent();
      expect(event.isRegistered).toBe(false);
      const result: any = BirdingEventService.register(event.id, 2);
      expect(result.data.isRegistered).toBe(true);
    });
  });

  describe('unregister() - 取消报名逻辑', () => {
    it('取消报名后 registeredCount -1', () => {
      const event = createDefaultEvent();
      BirdingEventService.register(event.id, 2);
      const result = BirdingEventService.unregister(event.id, 2);
      expect(result.success).toBe(true);
      expect((result as any).data.registeredCount).toBe(0);
    });

    it('未报名时取消报名返回失败', () => {
      const event = createDefaultEvent();
      const result = BirdingEventService.unregister(event.id, 999);
      expect(result.success).toBe(false);
      expect(result.message).toContain('未报名');
    });

    it('不存在的活动取消报名失败', () => {
      const result = BirdingEventService.unregister(99999, 2);
      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    it('满员后有人取消，新用户可以报名', () => {
      const event = createDefaultEvent({ maxParticipants: 1 });
      BirdingEventService.register(event.id, 2);
      const failResult = BirdingEventService.register(event.id, 3);
      expect(failResult.success).toBe(false);
      BirdingEventService.unregister(event.id, 2);
      const successResult = BirdingEventService.register(event.id, 3);
      expect(successResult.success).toBe(true);
    });
  });

  describe('delete() - 删除逻辑', () => {
    it('创建者可以删除活动', () => {
      const event = createDefaultEvent();
      const result = BirdingEventService.delete(event.id, 1);
      expect(result.success).toBe(true);
    });

    it('非创建者无法删除活动', () => {
      const event = createDefaultEvent();
      const result = BirdingEventService.delete(event.id, 2);
      expect(result.success).toBe(false);
      expect(result.message).toContain('无权');
    });

    it('删除不存在的活动返回失败', () => {
      const result = BirdingEventService.delete(99999, 1);
      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    it('删除活动后同时删除其报名记录', () => {
      const event = createDefaultEvent();
      BirdingEventService.register(event.id, 2);
      BirdingEventService.register(event.id, 3);
      const regsBefore = BirdingEventService.getRegistrations(event.id);
      expect(regsBefore.length).toBe(2);
      BirdingEventService.delete(event.id, 1);
      const regsAfter = BirdingEventService.getRegistrations(event.id);
      expect(regsAfter.length).toBe(0);
    });
  });

  describe('list() - 列表查询', () => {
    beforeEach(() => {
      const pastStart = new Date(Date.now() - 86400000 * 5).toISOString();
      const pastEnd = new Date(Date.now() - 86400000 * 3).toISOString();
      const futureStart = new Date(Date.now() + 86400000).toISOString();
      const futureEnd = new Date(Date.now() + 86400000 * 2).toISOString();

      BirdingEventService.create({
        userId: 1, title: '已结束活动', description: 'desc',
        locationName: '地点1', latitude: 39.9, longitude: 116.4,
        startTime: pastStart, endTime: pastEnd, maxParticipants: 10,
      });
      BirdingEventService.create({
        userId: 1, title: '即将举行 A', description: 'desc',
        locationName: '地点2', latitude: 39.9, longitude: 116.4,
        startTime: futureStart, endTime: futureEnd, maxParticipants: 10,
      });
      BirdingEventService.create({
        userId: 2, title: '即将举行 B', description: 'desc',
        locationName: '地点3', latitude: 39.9, longitude: 116.4,
        startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 4).toISOString(),
        maxParticipants: 10,
      });
    });

    it('默认情况下不返回已结束的活动', () => {
      const result = BirdingEventService.list();
      expect(result.total).toBe(2);
      expect(result.data.map((e) => e.title)).toEqual(['即将举行 A', '即将举行 B']);
    });

    it('includePast=true 时返回所有活动', () => {
      const result = BirdingEventService.list({ includePast: true });
      expect(result.total).toBe(3);
    });

    it('按 userId 筛选活动', () => {
      const result = BirdingEventService.list({ userId: 2, includePast: true });
      expect(result.total).toBe(1);
      expect(result.data[0].title).toBe('即将举行 B');
    });

    it('按 limit 限制返回数量', () => {
      const result = BirdingEventService.list({ includePast: true, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.total).toBe(3);
    });

    it('按开始时间升序排序', () => {
      const result = BirdingEventService.list({ includePast: true });
      const times = result.data.map((e) => e.startTime);
      const sortedTimes = [...times].sort();
      expect(times).toEqual(sortedTimes);
    });
  });

  describe('listUserRegistered() - 用户报名列表', () => {
    beforeEach(() => {
      const e1 = BirdingEventService.create({
        userId: 1, title: '活动一', description: 'd',
        locationName: 'l', latitude: 39.9, longitude: 116.4,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        maxParticipants: 10,
      }) as any;
      BirdingEventService.create({
        userId: 1, title: '已结束', description: 'd',
        locationName: 'l', latitude: 39.9, longitude: 116.4,
        startTime: new Date(Date.now() - 86400000 * 3).toISOString(),
        endTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        maxParticipants: 10,
      });
      BirdingEventService.register(e1.id, 3);
    });

    it('只返回用户已报名的活动', () => {
      const result = BirdingEventService.listUserRegistered(3);
      expect(result.total).toBe(1);
      expect(result.data[0].title).toBe('活动一');
    });

    it('未报名任何活动时返回空列表', () => {
      const result = BirdingEventService.listUserRegistered(999);
      expect(result.total).toBe(0);
      expect(result.data.length).toBe(0);
    });

    it('includePast=true 时包含已结束的报名', () => {
      const e2 = BirdingEventService.list({ includePast: true }).data.find(
        (e) => e.title === '已结束',
      );
      BirdingEventService.register(e2!.id, 3);
      const result = BirdingEventService.listUserRegistered(3, { includePast: true });
      expect(result.total).toBe(2);
    });
  });

  describe('getById() - 详情查询', () => {
    it('返回包含用户信息的详情', () => {
      const event = createDefaultEvent() as any;
      const found = BirdingEventService.getById(event.id, 1);
      expect(found).toBeDefined();
      expect(found!.title).toBe('默认活动');
      expect(found!.user).toBeDefined();
      expect(found!.user!.id).toBe(1);
    });

    it('不存在的 ID 返回 null', () => {
      const found = BirdingEventService.getById(99999);
      expect(found).toBeNull();
    });

    it('正确设置 isRegistered 标志', () => {
      const event = createDefaultEvent() as any;
      const before = BirdingEventService.getById(event.id, 2);
      expect(before!.isRegistered).toBe(false);
      BirdingEventService.register(event.id, 2);
      const after = BirdingEventService.getById(event.id, 2);
      expect(after!.isRegistered).toBe(true);
    });
  });

  describe('getRegistrations() - 报名列表', () => {
    it('返回活动的所有报名信息', () => {
      const event = createDefaultEvent() as any;
      BirdingEventService.register(event.id, 2);
      BirdingEventService.register(event.id, 3);
      const regs = BirdingEventService.getRegistrations(event.id);
      expect(regs.length).toBe(2);
      expect(regs.map((r) => r.userId).sort()).toEqual([2, 3]);
    });

    it('返回值包含报名者用户信息', () => {
      const event = createDefaultEvent() as any;
      BirdingEventService.register(event.id, 2);
      const regs = BirdingEventService.getRegistrations(event.id);
      expect(regs[0].user).toBeDefined();
      expect(regs[0].user!.id).toBe(2);
    });

    it('活动无报名时返回空数组', () => {
      const event = createDefaultEvent() as any;
      const regs = BirdingEventService.getRegistrations(event.id);
      expect(regs.length).toBe(0);
    });
  });
});
