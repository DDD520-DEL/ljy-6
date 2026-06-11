import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import observationRoutes from './routes/observations.js';
import speciesRoutes from './routes/species.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import collectionRoutes from './routes/collections.js';
import challengeRoutes from './routes/challenges.js';
import uploadRoutes from './routes/uploads.js';
import searchRoutes from './routes/search.js';
import feedbackRoutes from './routes/feedbacks.js';
import birdingEventRoutes from './routes/birdingEvents.js';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initializeDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/birding-events', birdingEventRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '观鸟社区API服务正常运行 🐦' });
});

const publicDir = path.resolve(__dirname, '../public');
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use((_req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ success: false, message: '路由不存在' });
  }
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ success: false, message: err?.message || '服务器错误' });
});

export default app;
