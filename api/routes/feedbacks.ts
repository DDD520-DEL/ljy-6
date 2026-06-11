import { Router } from 'express';
import { verifyToken } from './auth.js';
import { FeedbackService } from '../services/feedbackService.js';

const router = Router();

router.post('/', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const { content, contact } = req.body ?? {};
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: '反馈内容不能为空' });
  }
  const feedback = FeedbackService.create({
    userId: auth.userId,
    content: content.trim(),
    contact: (contact || '').trim(),
  });
  res.json({ success: true, data: feedback });
});

router.get('/mine', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const data = FeedbackService.getByUserId(auth.userId);
  res.json({ success: true, data, total: data.length });
});

router.get('/', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const data = FeedbackService.getAll();
  res.json({ success: true, data, total: data.length });
});

router.put('/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const { status, reply } = req.body ?? {};
  if (!status || !['pending', 'processing', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: '无效的状态值' });
  }
  const updated = FeedbackService.updateStatus(id, status, reply);
  if (!updated) return res.status(404).json({ success: false, message: '反馈记录不存在' });
  res.json({ success: true, data: updated });
});

router.delete('/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const ok = FeedbackService.delete(id);
  if (!ok) return res.status(404).json({ success: false, message: '反馈记录不存在' });
  res.json({ success: true });
});

export default router;
