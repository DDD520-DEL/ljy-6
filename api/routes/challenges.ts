import { Router } from 'express';
import { verifyToken } from './auth.js';
import { ChallengeService } from '../services/challengeService.js';

const router = Router();

function getCurrentUserId(req: any): number | undefined {
  const auth = verifyToken(req.headers.authorization);
  return auth?.userId;
}

router.get('/', (req, res) => {
  const opts: any = {};
  if (req.query.year) opts.year = Number(req.query.year);
  if (req.query.month) opts.month = Number(req.query.month);
  if (req.query.withProgress === 'true') {
    const userId = getCurrentUserId(req);
    if (userId) opts.userId = userId;
  }
  const result = ChallengeService.getChallenges(opts);
  res.json({ success: true, ...result });
});

router.get('/badges', (_req, res) => {
  const badges = ChallengeService.getBadges();
  res.json({ success: true, data: badges, total: badges.length });
});

router.get('/rankings', (req, res) => {
  const opts: any = {};
  if (req.query.year) opts.year = Number(req.query.year);
  if (req.query.month) opts.month = Number(req.query.month);
  const result = ChallengeService.getRankings(opts);
  res.json({ success: true, ...result });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const challenge = ChallengeService.getChallengeById(id);
  if (!challenge) return res.status(404).json({ success: false, message: '挑战不存在' });

  const userId = getCurrentUserId(req);
  if (userId) {
    const progress = ChallengeService.updateProgress(userId, id);
    return res.json({ success: true, data: { ...challenge, progress } });
  }

  res.json({ success: true, data: challenge });
});

router.post('/:id/progress', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });

  const id = Number(req.params.id);
  const progress = ChallengeService.updateProgress(auth.userId, id);
  if (!progress) return res.status(404).json({ success: false, message: '挑战不存在' });

  res.json({ success: true, data: progress });
});

router.post('/refresh-progress', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });

  const progress = ChallengeService.updateAllProgressForUser(auth.userId);
  res.json({ success: true, data: progress });
});

router.get('/user/badges', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });

  const result = ChallengeService.getUserBadges(auth.userId);
  res.json({ success: true, ...result });
});

router.get('/user/:userId/badges', (req, res) => {
  const userId = Number(req.params.userId);
  const result = ChallengeService.getUserBadges(userId);
  res.json({ success: true, ...result });
});

router.post('/generate', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });

  const year = req.body.year ? Number(req.body.year) : new Date().getFullYear();
  const month = req.body.month !== undefined ? Number(req.body.month) : new Date().getMonth();

  const challenges = ChallengeService.generateMonthlyChallenges(year, month);
  res.json({ success: true, data: challenges });
});

export default router;
