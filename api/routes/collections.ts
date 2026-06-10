import { Router } from 'express';
import { verifyToken } from './auth.js';
import { CollectionService } from '../services/collectionService.js';

const router = Router();

function getCurrentUserId(req: any) {
  const auth = verifyToken(req.headers.authorization);
  return auth?.userId;
}

router.post('/:speciesId', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
  const speciesId = Number(req.params.speciesId);
  if (!speciesId) return res.status(400).json({ success: false, message: '物种ID无效' });
  const result = CollectionService.add(userId, speciesId);
  if (!result) return res.status(400).json({ success: false, message: '已收藏或物种不存在' });
  res.json({ success: true, data: result });
});

router.delete('/:speciesId', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
  const speciesId = Number(req.params.speciesId);
  const ok = CollectionService.remove(userId, speciesId);
  if (!ok) return res.status(400).json({ success: false, message: '未收藏该物种' });
  res.json({ success: true });
});

router.get('/check/:speciesId', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) return res.json({ success: true, data: false });
  const speciesId = Number(req.params.speciesId);
  const collected = CollectionService.isCollected(userId, speciesId);
  res.json({ success: true, data: collected });
});

router.get('/user/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const data = CollectionService.getUserCollections(userId);
  res.json({ success: true, data, total: data.length });
});

router.get('/user/:userId/grouped', (req, res) => {
  const userId = Number(req.params.userId);
  const result = CollectionService.getCollectionsGrouped(userId);
  res.json({ success: true, ...result });
});

export default router;
