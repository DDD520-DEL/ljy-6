import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { Notification, NotificationType } from '../../shared/types.js';
import { UserService } from './userService.js';
import { ObservationService } from './observationService.js';

function enrichNotification(row: any): Notification {
  const fromUser = UserService.findById(row.fromUserId);
  const observation = row.observationId
    ? ObservationService.getById(row.observationId, row.toUserId)
    : undefined;
  return {
    ...row,
    fromUser: fromUser || undefined,
    observation: observation || undefined,
  };
}

export const NotificationService = {
  create(data: {
    type: NotificationType;
    fromUserId: number;
    toUserId: number;
    observationId?: number;
    commentId?: number;
  }) {
    if (data.fromUserId === data.toUserId) return null;
    const db = getDb();
    const id = nextId('notifications');
    const notification = {
      id,
      type: data.type,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      observationId: data.observationId ?? null,
      commentId: data.commentId ?? null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.push(notification);
    scheduleSave();
    return enrichNotification(notification);
  },

  getByUserId(userId: number) {
    const db = getDb();
    return db.notifications
      .filter((n) => n.toUserId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(enrichNotification);
  },

  getUnreadCount(userId: number) {
    const db = getDb();
    return db.notifications.filter((n) => n.toUserId === userId && !n.read).length;
  },

  markAsRead(userId: number, notificationId: number) {
    const db = getDb();
    const n = db.notifications.find((item) => item.id === notificationId && item.toUserId === userId);
    if (n) {
      n.read = true;
      scheduleSave();
    }
    return n ? enrichNotification(n) : null;
  },

  markAllAsRead(userId: number) {
    const db = getDb();
    let count = 0;
    db.notifications.forEach((n) => {
      if (n.toUserId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    scheduleSave();
    return count;
  },
};
