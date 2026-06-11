import { Router } from 'express';
import { getAllLevels, getLevelProgress, calculateUserExp, EXP_CONFIG } from '../services/levelService.js';
import { verifyToken } from './auth.js';

const router = Router();

router.get('/', (_req, res) => {
  const levels = getAllLevels();
  res.json({ success: true, data: levels, total: levels.length });
});

router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      levels: getAllLevels(),
      expConfig: EXP_CONFIG,
    },
  });
});

router.get('/user/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const exp = calculateUserExp(userId);
  const progress = getLevelProgress(exp);
  res.json({ success: true, data: progress });
});

router.get('/my', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const exp = calculateUserExp(auth.userId);
  const progress = getLevelProgress(exp);
  res.json({ success: true, data: progress });
});

export default router;
