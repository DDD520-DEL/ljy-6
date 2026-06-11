import { Router } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';

const router = Router();

router.get('/overview', (req, res) => {
  const opts: any = {};
  if (req.query.startDate) opts.startDate = String(req.query.startDate);
  if (req.query.endDate) opts.endDate = String(req.query.endDate);
  const data = AnalyticsService.overview(opts);
  res.json({ success: true, data });
});

router.get('/frequency', (req, res) => {
  const opts: any = {};
  if (req.query.startDate) opts.startDate = String(req.query.startDate);
  if (req.query.endDate) opts.endDate = String(req.query.endDate);
  if (req.query.limit) opts.limit = Number(req.query.limit);
  const result = AnalyticsService.frequency(opts);
  res.json({ success: true, ...result });
});

router.get('/seasonal', (req, res) => {
  const opts: any = {};
  if (req.query.speciesId) opts.speciesId = Number(req.query.speciesId);
  if (req.query.startDate) opts.startDate = String(req.query.startDate);
  if (req.query.endDate) opts.endDate = String(req.query.endDate);
  const result = AnalyticsService.seasonal(opts);
  res.json({ success: true, ...result });
});

router.get('/heatmap', (req, res) => {
  const opts: any = {};
  if (req.query.speciesId) opts.speciesId = Number(req.query.speciesId);
  if (req.query.startDate) opts.startDate = String(req.query.startDate);
  if (req.query.endDate) opts.endDate = String(req.query.endDate);
  if (req.query.month) opts.month = Number(req.query.month);
  const result = AnalyticsService.heatmap(opts);
  res.json({ success: true, ...result });
});

export default router;
