import { Router } from 'express';
import { verifyToken } from './auth.js';
import { UserService } from '../services/userService.js';

const router = Router();

function getCurrentUserId(req: any) {
  const auth = verifyToken(req.headers.authorization);
  return auth?.userId;
}

router.get('/', (req, res) => {
  const currentUserId = getCurrentUserId(req);
  const users = UserService.getAll(currentUserId);
  const limit = req.query.limit ? Number(req.query.limit) : users.length;
  const sorted = users
    .sort((a, b) => b.observationsCount - a.observationsCount)
    .slice(0, limit);
  res.json({ success: true, data: sorted, total: sorted.length });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const currentUserId = getCurrentUserId(req);
  const user = UserService.findById(id, currentUserId);
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
  const observations = UserService.getUserObservations(id, currentUserId);
  res.json({ success: true, data: { ...user, observations } });
});

router.get('/:id/yearlist', (req, res) => {
  const id = Number(req.params.id);
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  const result = UserService.getYearList(id, year);
  res.json({ success: true, ...result });
});

router.get('/:id/observations', (req, res) => {
  const id = Number(req.params.id);
  const currentUserId = getCurrentUserId(req);
  const data = UserService.getUserObservations(id, currentUserId);
  res.json({ success: true, data, total: data.length });
});

router.get('/:id/followers', (req, res) => {
  const id = Number(req.params.id);
  const currentUserId = getCurrentUserId(req);
  const data = UserService.getFollowers(id, currentUserId);
  res.json({ success: true, data, total: data.length });
});

router.get('/:id/following', (req, res) => {
  const id = Number(req.params.id);
  const currentUserId = getCurrentUserId(req);
  const data = UserService.getFollowing(id, currentUserId);
  res.json({ success: true, data, total: data.length });
});

router.post('/follow/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const followingId = Number(req.params.id);
  if (auth.userId === followingId) return res.status(400).json({ success: false, message: '不能关注自己' });
  const ok = UserService.follow(auth.userId, followingId);
  if (!ok) return res.status(400).json({ success: false, message: '已经关注过' });
  const user = UserService.findById(followingId, auth.userId);
  res.json({ success: true, data: user });
});

router.delete('/follow/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const followingId = Number(req.params.id);
  const ok = UserService.unfollow(auth.userId, followingId);
  if (!ok) return res.status(400).json({ success: false, message: '未关注该用户' });
  const user = UserService.findById(followingId, auth.userId);
  res.json({ success: true, data: user });
});

export default router;
