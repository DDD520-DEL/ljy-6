import { getDb, nextId, scheduleSave } from '../db/storage.js';
import type { Feedback } from '../../shared/types.js';
import { UserService } from './userService.js';

function enrichFeedback(row: any): Feedback {
  const user = UserService.findById(row.userId);
  return {
    ...row,
    user: user || undefined,
  };
}

export const FeedbackService = {
  create(data: { userId: number; content: string; contact: string }) {
    const db = getDb();
    const id = nextId('feedbacks');
    const feedback = {
      id,
      userId: data.userId,
      content: data.content,
      contact: data.contact,
      status: 'pending' as const,
      reply: '',
      createdAt: new Date().toISOString(),
    };
    db.feedbacks.push(feedback);
    scheduleSave();
    return enrichFeedback(feedback);
  },

  getAll() {
    const db = getDb();
    return db.feedbacks
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
      .map(enrichFeedback);
  },

  getByUserId(userId: number) {
    const db = getDb();
    return db.feedbacks
      .filter((f: any) => f.userId === userId)
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
      .map(enrichFeedback);
  },

  updateStatus(id: number, status: 'pending' | 'processing' | 'resolved', reply?: string) {
    const db = getDb();
    const f = db.feedbacks.find((item: any) => item.id === id);
    if (!f) return null;
    f.status = status;
    if (reply !== undefined) f.reply = reply;
    scheduleSave();
    return enrichFeedback(f);
  },

  delete(id: number) {
    const db = getDb();
    const idx = db.feedbacks.findIndex((item: any) => item.id === id);
    if (idx === -1) return false;
    db.feedbacks.splice(idx, 1);
    scheduleSave();
    return true;
  },
};
