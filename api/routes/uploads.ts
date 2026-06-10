import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { verifyToken } from './auth.js';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const THUMB_DIR = path.resolve(UPLOAD_DIR, 'thumbs');

[UPLOAD_DIR, THUMB_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${nanoid(12)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp|heic|heif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片文件'));
    }
  },
});

const router = Router();

router.post('/', upload.array('photos', 9), async (req, res, next) => {
  const auth = verifyToken(req.headers.authorization);
  if (!auth) return res.status(401).json({ success: false, message: '请先登录' });

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, message: '请选择要上传的图片' });
  }

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const baseName = path.basename(file.filename, path.extname(file.filename));
        const thumbName = `${baseName}_thumb.jpg`;
        const thumbPath = path.join(THUMB_DIR, thumbName);

        await sharp(file.path)
          .resize(400, 300, { fit: 'cover', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbPath);

        return {
          url: `/uploads/${file.filename}`,
          thumbnailUrl: `/uploads/thumbs/${thumbName}`,
        };
      }),
    );

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('图片处理失败:', err);
    res.status(500).json({ success: false, message: '图片处理失败' });
  }
});

router.use((err: any, _req: any, res: any, _next: any) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: '文件大小不能超过10MB' });
  }
  if (err.message === '仅支持图片文件') {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error('上传错误:', err);
  res.status(500).json({ success: false, message: '上传失败' });
});

export default router;
