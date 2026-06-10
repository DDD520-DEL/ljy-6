import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { Activity, ActivityType } from '../../shared/types.js';
import { UserService } from './userService.js';
import { ObservationService } from './observationService.js';

function enrich(activity: any, currentUserId?: number): Activity {
  const db = getDb();
  const result: Activity = {
    ...activity,
    metadata: activity.metadata || undefined,
    user: UserService.findById(activity.userId, currentUserId),
  };

  if (activity.type === 'publish_observation' || activity.type === 'comment') {
    const obsId = activity.type === 'publish_observation' ? activity.targetId : activity.metadata?.observationId;
    if (obsId) {
      const obs = db.observations.find((o: any) => o.id === obsId);
      if (obs) {
        result.observation = ObservationService.enrichObservation(obs, currentUserId);
      }
    }
  }

  if (activity.type === 'comment' && activity.targetId) {
    const comment = db.comments.find((c: any) => c.id === activity.targetId);
    if (comment) {
      const cu = db.users.find((u: any) => u.id === comment.userId);
      result.comment = {
        ...comment,
        user: cu ? UserService.findById(cu.id, currentUserId) : undefined,
      };
    }
  }

  if (activity.type === 'follow' && activity.targetId) {
    result.targetUser = UserService.findById(activity.targetId, currentUserId);
  }

  return result;
}

export const ActivityService = {
  create(data: {
    userId: number;
    type: ActivityType;
    targetId?: number;
    targetType?: 'observation' | 'comment' | 'user';
    metadata?: Record<string, any>;
  }) {
    const id = nextId('activities');
    const db = getDb();
    const activity = {
      id,
      userId: data.userId,
      type: data.type,
      targetId: data.targetId ?? null,
      targetType: data.targetType ?? null,
      metadata: data.metadata ?? null,
      createdAt: new Date().toISOString(),
    };
    db.activities.push(activity);
    scheduleSave();
    return activity;
  },

  getUserActivities(userId: number, currentUserId?: number, options: { limit?: number; offset?: number } = {}) {
    const db = getDb();
    let list = db.activities.filter((a) => a.userId === userId);
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = list.length;
    if (options.offset) list = list.slice(options.offset);
    if (options.limit) list = list.slice(0, options.limit);
    return { data: list.map((a) => enrich(a, currentUserId)), total };
  },

  getFeed(currentUserId?: number, options: { limit?: number; offset?: number } = {}) {
    const db = getDb();
    let list = [...db.activities];
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = list.length;
    if (options.offset) list = list.slice(options.offset);
    if (options.limit) list = list.slice(0, options.limit);
    return { data: list.map((a) => enrich(a, currentUserId)), total };
  },
};
