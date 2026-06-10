import { Router } from 'express';
import { SpeciesService } from '../services/speciesService.js';
import type { BirdSize, BeakShape } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  const opts: any = {};
  if (req.query.size) opts.size = req.query.size as BirdSize;
  if (req.query.beakShape) opts.beakShape = req.query.beakShape as BeakShape;
  if (req.query.featherColors) opts.featherColors = String(req.query.featherColors).split(',');
  if (req.query.habitat) opts.habitat = String(req.query.habitat).split(',');
  if (req.query.search) opts.search = String(req.query.search);
  if (req.query.limit) opts.limit = Number(req.query.limit);
  const result = SpeciesService.getAll(opts);
  res.json({ success: true, ...result });
});

router.get('/match', (req, res) => {
  const opts: any = {};
  if (req.query.size) opts.size = req.query.size as BirdSize;
  if (req.query.beakShape) opts.beakShape = req.query.beakShape as BeakShape;
  if (req.query.featherColors) opts.featherColors = String(req.query.featherColors).split(',').filter(Boolean);
  if (req.query.habitat) opts.habitat = String(req.query.habitat).split(',').filter(Boolean);
  const matches = SpeciesService.match(opts);
  res.json({ success: true, data: matches });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const sp = SpeciesService.getDetail(id);
  if (!sp) return res.status(404).json({ success: false, message: '物种不存在' });
  res.json({ success: true, data: sp });
});

export default router;
