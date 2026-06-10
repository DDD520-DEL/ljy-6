import { Router } from 'express';
import { verifyToken } from './auth.js';
import { NotificationService } from '../services/notificationService.js';

const router = Router();

router.get('/', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const data = NotificationService.getByUserId(auth.userId);
  res.json({ success: true, data, total: data.length });
});

router.get('/unread-count', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const count = NotificationService.getUnreadCount(auth.userId);
  res.json({ success: true, count });
});

router.put('/:id/read', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const n = NotificationService.markAsRead(auth.userId, id);
  if (!n) return res.status(404).json({ success: false, message: '通知不存在' });
  res.json({ success: true, data: n });
});

router.put('/read-all', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const count = NotificationService.markAllAsRead(auth.userId);
  res.json({ success: true, count });
});

export default router;
