import { Router } from 'express';
import { verifyToken } from './auth.js';
import { TagService } from '../services/tagService.js';

const router = Router();

router.get('/', (_req, res) => {
  const tags = TagService.list();
  res.json({ success: true, data: tags });
});

router.post('/', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const { name, color } = req.body ?? {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: '标签名称不能为空' });
  }
  const tag = TagService.create(String(name), color);
  res.json({ success: true, data: tag });
});

router.put('/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const body = req.body ?? {};
  const updated = TagService.update(id, {
    name: body.name !== undefined ? String(body.name) : undefined,
    color: body.color !== undefined ? String(body.color) : undefined,
  });
  if (!updated) return res.status(404).json({ success: false, message: '标签不存在' });
  res.json({ success: true, data: updated });
});

router.delete('/:id', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });
  const id = Number(req.params.id);
  const deleted = TagService.delete(id);
  if (!deleted) return res.status(404).json({ success: false, message: '标签不存在' });
  res.json({ success: true });
});

export default router;
