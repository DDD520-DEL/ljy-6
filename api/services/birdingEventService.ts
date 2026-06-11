import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { BirdingEvent, BirdingEventRegistration } from '../../shared/types.js';
import { UserService } from './userService.js';

function enrichEvent(event: any, currentUserId?: number): BirdingEvent {
  const db = getDb();
  const registeredCount = db.birdingEventRegistrations.filter(
    (r) => r.eventId === event.id,
  ).length;
  const isRegistered = currentUserId
    ? db.birdingEventRegistrations.some(
        (r) => r.eventId === event.id && r.userId === currentUserId,
      )
    : false;
  return {
    ...event,
    registeredCount,
    user: UserService.findById(event.userId, currentUserId),
    isRegistered,
  };
}

function enrichRegistration(reg: any): BirdingEventRegistration {
  return {
    ...reg,
    user: UserService.findById(reg.userId),
  };
}

export const BirdingEventService = {
  create(
    data: {
      userId: number;
      title: string;
      description: string;
      locationName: string;
      latitude: number;
      longitude: number;
      startTime: string;
      endTime: string;
      maxParticipants: number;
      imageUrl?: string;
      contactInfo?: string;
    },
  ) {
    const id = nextId('birdingEvents');
    const db = getDb();
    const event = {
      id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      locationName: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      startTime: data.startTime,
      endTime: data.endTime,
      maxParticipants: data.maxParticipants,
      imageUrl: data.imageUrl || '',
      contactInfo: data.contactInfo || '',
      createdAt: new Date().toISOString(),
    };
    db.birdingEvents.push(event);
    scheduleSave();
    return enrichEvent(event, data.userId);
  },

  list(
    options: {
      limit?: number;
      offset?: number;
      userId?: number;
      includePast?: boolean;
      currentUserId?: number;
    } = {},
  ) {
    const db = getDb();
    let list = [...db.birdingEvents];
    const now = new Date().toISOString();

    if (!options.includePast) {
      list = list.filter((e) => e.endTime >= now);
    }

    if (options.userId) {
      list = list.filter((e) => e.userId === options.userId);
    }

    list.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const total = list.length;
    if (options.offset) list = list.slice(options.offset);
    if (options.limit) list = list.slice(0, options.limit);

    return {
      data: list.map((e) => enrichEvent(e, options.currentUserId)),
      total,
    };
  },

  listUserRegistered(
    userId: number,
    options: { limit?: number; offset?: number; includePast?: boolean } = {},
  ) {
    const db = getDb();
    const now = new Date().toISOString();
    let regs = db.birdingEventRegistrations.filter((r) => r.userId === userId);
    let eventIds = regs.map((r) => r.eventId);
    let list = db.birdingEvents.filter((e) => eventIds.includes(e.id));

    if (!options.includePast) {
      list = list.filter((e) => e.endTime >= now);
    }

    list.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const total = list.length;
    if (options.offset) list = list.slice(options.offset);
    if (options.limit) list = list.slice(0, options.limit);

    return {
      data: list.map((e) => enrichEvent(e, userId)),
      total,
    };
  },

  getById(id: number, currentUserId?: number) {
    const db = getDb();
    const event = db.birdingEvents.find((e) => e.id === id);
    if (!event) return null;
    return enrichEvent(event, currentUserId);
  },

  getRegistrations(eventId: number) {
    const db = getDb();
    return db.birdingEventRegistrations
      .filter((r) => r.eventId === eventId)
      .map((r) => enrichRegistration(r));
  },

  register(eventId: number, userId: number) {
    const db = getDb();
    const event = db.birdingEvents.find((e) => e.id === eventId);
    if (!event) return { success: false, message: '活动不存在' };

    const existing = db.birdingEventRegistrations.find(
      (r) => r.eventId === eventId && r.userId === userId,
    );
    if (existing) return { success: false, message: '已报名该活动' };

    const registeredCount = db.birdingEventRegistrations.filter(
      (r) => r.eventId === eventId,
    ).length;
    if (registeredCount >= event.maxParticipants) {
      return { success: false, message: '活动人数已满' };
    }

    const id = nextId('birdingEventRegistrations');
    const reg = {
      id,
      eventId,
      userId,
      registeredAt: new Date().toISOString(),
    };
    db.birdingEventRegistrations.push(reg);
    scheduleSave();
    return { success: true, data: enrichEvent(event, userId) };
  },

  unregister(eventId: number, userId: number) {
    const db = getDb();
    const event = db.birdingEvents.find((e) => e.id === eventId);
    if (!event) return { success: false, message: '活动不存在' };

    const before = db.birdingEventRegistrations.length;
    db.birdingEventRegistrations = db.birdingEventRegistrations.filter(
      (r) => !(r.eventId === eventId && r.userId === userId),
    );
    if (db.birdingEventRegistrations.length < before) {
      scheduleSave();
      return { success: true, data: enrichEvent(event, userId) };
    }
    return { success: false, message: '未报名该活动' };
  },

  delete(eventId: number, userId: number) {
    const db = getDb();
    const event = db.birdingEvents.find((e) => e.id === eventId);
    if (!event) return { success: false, message: '活动不存在' };
    if (event.userId !== userId) return { success: false, message: '无权删除' };

    db.birdingEvents = db.birdingEvents.filter((e) => e.id !== eventId);
    db.birdingEventRegistrations = db.birdingEventRegistrations.filter(
      (r) => r.eventId !== eventId,
    );
    scheduleSave();
    return { success: true };
  },
};
