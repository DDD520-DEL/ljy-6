import { Router } from 'express';
import { verifyToken } from './auth.js';
import { ObservationService } from '../services/observationService.js';

const router = Router();

function getCurrentUserId(req: any) {
  const auth = verifyToken(req.headers.authorization);
  return auth?.userId;
}

router.get('/', (req, res) => {
  const opts: any = {};
  if (req.query.speciesId) opts.speciesId = Number(req.query.speciesId);
  if (req.query.userId) opts.userId = Number(req.query.userId);
  if (req.query.startDate) opts.startDate = String(req.query.startDate);
  if (req.query.endDate) opts.endDate = String(req.query.endDate);
  if (req.query.lat) opts.lat = Number(req.query.lat);
  if (req.query.lng) opts.lng = Number(req.query.lng);
  if (req.query.radius) opts.radius = Number(req.query.radius);
  if (req.query.limit) opts.limit = Number(req.query.limit);
  if (req.query.search) opts.search = String(req.query.search);
  opts.currentUserId = getCurrentUserId(req);
  const result = ObservationService.list(opts);
  res.json({ success: true, ...result });
});

router.get('/feed', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const result = ObservationService.getFeed(auth.userId);
  res.json({ success: true, ...result });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const obs = ObservationService.getById(id, getCurrentUserId(req));
  if (!obs) return res.status(404).json({ success: false, message: '观测记录不存在' });
  res.json({ success: true, data: obs });
});

router.post('/', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const body = req.body ?? {};
  if (!body.speciesName || body.latitude === undefined || body.longitude === undefined || !body.observationTime) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  const obs = ObservationService.create({ ...body, userId: auth.userId });
  res.json({ success: true, data: obs });
});

router.put('/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const existing = ObservationService.getById(id, auth.userId);
  if (!existing) return res.status(404).json({ success: false, message: '观测记录不存在' });
  if (existing.userId !== auth.userId) return res.status(403).json({ success: false, message: '无权编辑此记录' });
  const body = req.body ?? {};
  const updated = ObservationService.update(id, body);
  res.json({ success: true, data: updated });
});

router.post('/:id/like', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const result = ObservationService.like(auth.userId, id);
  if (!result) return res.status(404).json({ success: false, message: '观测记录不存在' });
  res.json({ success: true, ...result });
});

router.post('/:id/comments', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const { content } = req.body ?? {};
  if (!content) return res.status(400).json({ success: false, message: '评论内容不能为空' });
  const obs = ObservationService.addComment(auth.userId, id, String(content));
  if (!obs) return res.status(404).json({ success: false, message: '观测记录不存在' });
  res.json({ success: true, data: obs });
});

router.get('/export/excel', async (req, res) => {
  try {
    const opts: any = {};
    if (req.query.speciesId) opts.speciesId = Number(req.query.speciesId);
    if (req.query.startDate) opts.startDate = String(req.query.startDate);
    if (req.query.endDate) opts.endDate = String(req.query.endDate);
    if (req.query.locationName) opts.locationName = String(req.query.locationName);
    opts.currentUserId = getCurrentUserId(req);

    const buffer = await ObservationService.exportToExcel(opts);

    const fileName = `观测记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('导出失败:', err);
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

export default router;
