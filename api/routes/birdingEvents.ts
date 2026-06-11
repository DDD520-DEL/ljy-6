import { Router } from 'express';
import { verifyToken } from './auth.js';
import { BirdingEventService } from '../services/birdingEventService.js';

const router = Router();

function getCurrentUserId(req: any): number | undefined {
  const auth = verifyToken(req.headers.authorization);
  return auth?.userId;
}

router.get('/', (req, res) => {
  const opts: any = {};
  if (req.query.limit) opts.limit = Number(req.query.limit);
  if (req.query.offset) opts.offset = Number(req.query.offset);
  if (req.query.userId) opts.userId = Number(req.query.userId);
  if (req.query.includePast === 'true') opts.includePast = true;
  opts.currentUserId = getCurrentUserId(req);
  const result = BirdingEventService.list(opts);
  res.json({ success: true, ...result });
});

router.get('/mine', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const opts: any = {};
  if (req.query.limit) opts.limit = Number(req.query.limit);
  if (req.query.offset) opts.offset = Number(req.query.offset);
  if (req.query.includePast === 'true') opts.includePast = true;
  const result = BirdingEventService.list({ ...opts, userId: auth.userId, currentUserId: auth.userId });
  res.json({ success: true, ...result });
});

router.get('/my-registrations', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const opts: any = {};
  if (req.query.limit) opts.limit = Number(req.query.limit);
  if (req.query.offset) opts.offset = Number(req.query.offset);
  if (req.query.includePast === 'true') opts.includePast = true;
  const result = BirdingEventService.listUserRegistered(auth.userId, opts);
  res.json({ success: true, ...result });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const currentUserId = getCurrentUserId(req);
  const event = BirdingEventService.getById(id, currentUserId);
  if (!event) return res.status(404).json({ success: false, message: '活动不存在' });
  res.json({ success: true, data: event });
});

router.get('/:id/registrations', (req, res) => {
  const id = Number(req.params.id);
  const registrations = BirdingEventService.getRegistrations(id);
  res.json({ success: true, data: registrations, total: registrations.length });
});

router.post('/', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const body = req.body ?? {};
  if (
    !body.title ||
    !body.description ||
    !body.locationName ||
    body.latitude === undefined ||
    body.longitude === undefined ||
    !body.startTime ||
    !body.endTime ||
    !body.maxParticipants
  ) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  const event = BirdingEventService.create({ ...body, userId: auth.userId });
  res.json({ success: true, data: event });
});

router.post('/:id/register', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const result = BirdingEventService.register(id, auth.userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/:id/unregister', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const result = BirdingEventService.unregister(id, auth.userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.delete('/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const result = BirdingEventService.delete(id, auth.userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

export default router;
