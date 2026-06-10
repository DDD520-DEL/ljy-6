import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserService } from '../services/userService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bird-watching-secret-key';

const router = Router();

export interface AuthPayload {
  userId: number;
  username: string;
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token?: string): AuthPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token.replace('Bearer ', ''), JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  const user = UserService.findByUsername(username);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户不存在' });
  }
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ success: false, message: '密码错误' });
  }
  const token = signToken({ userId: user.id, username: user.username });
  const publicUser = UserService.findById(user.id);
  res.json({ success: true, token, user: publicUser });
});

router.post('/register', (req, res) => {
  const { username, password, bio } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码至少6位' });
  }
  const existing = UserService.findByUsername(username);
  if (existing) {
    return res.status(409).json({ success: false, message: '用户名已存在' });
  }
  const hash = bcrypt.hashSync(password, 8);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
  const user = UserService.create({ username, passwordHash: hash, avatar, bio });
  const token = signToken({ userId: user.id, username: user.username });
  res.json({ success: true, token, user });
});

router.get('/me', (req, res) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '未登录' });
  const user = UserService.findById(auth.userId);
  res.json({ success: true, user });
});

export default router;
