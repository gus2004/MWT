import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────
// Carga de evidencias (imágenes y videos) del comisariato.
// Las evidencias SOLO se almacenan como respaldo documental:
// la IA del comisariato no las analiza.
// ─────────────────────────────────────────────

export const EVIDENCIAS_DIR = path.join(process.cwd(), 'uploads', 'evidencias');

if (!fs.existsSync(EVIDENCIAS_DIR)) {
  fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EVIDENCIAS_DIR),
  filename: (_req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
  },
});

export function tipoEvidencia(mime: string): 'IMAGEN' | 'VIDEO' | null {
  if (mime.startsWith('image/')) return 'IMAGEN';
  if (mime.startsWith('video/')) return 'VIDEO';
  return null;
}

export const uploadEvidencia = multer({
  storage,
  limits: { fileSize: 120 * 1024 * 1024 }, // 120 MB máx por archivo (cubre videos)
  fileFilter: (_req, file, cb) => {
    if (!EXT_BY_MIME[file.mimetype]) {
      cb(null, false); // formato no permitido (sin excepción dura; el controller valida)
      return;
    }
    cb(null, true);
  },
});

// ─────────────────────────────────────────────
// Reglamento por evento: PDF que la IA del comisariato SÍ lee
// (se extrae su texto y se cargan sus artículos al catálogo).
// ─────────────────────────────────────────────
export const REGLAMENTO_DIR = path.join(process.cwd(), 'uploads', 'reglamento');

if (!fs.existsSync(REGLAMENTO_DIR)) {
  fs.mkdirSync(REGLAMENTO_DIR, { recursive: true });
}

const storageReglamento = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, REGLAMENTO_DIR),
  filename: (_req, file, cb) => {
    cb(null, `reglamento-${Date.now()}-${randomUUID().slice(0, 8)}.pdf`);
  },
});

export const uploadReglamentoPdf = multer({
  storage: storageReglamento,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB máx para PDFs de reglamento
  fileFilter: (_req, file, cb) => {
    const esPdf = file.mimetype === 'application/pdf' || (file.originalname || '').toLowerCase().endsWith('.pdf');
    if (!esPdf) {
      cb(null, false);
      return;
    }
    cb(null, true);
  },
});
