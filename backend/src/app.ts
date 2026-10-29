import express from 'express';
import cors from 'cors';
import * as path from 'path';
import routes from './routes';

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Evidencias del comisariato (imágenes/videos) servidas como archivos estáticos:
// GET /uploads/evidencias/<archivo>
app.use(
  '/uploads/evidencias',
  express.static(path.join(process.cwd(), 'uploads', 'evidencias'), {
    fallthrough: false,
    maxAge: '7d',
  }),
);

// PDFs de reglamento por evento servidos a los módulos del comisariato:
// GET /uploads/reglamento/<archivo>
app.use(
  '/uploads/reglamento',
  express.static(path.join(process.cwd(), 'uploads', 'reglamento'), {
    fallthrough: false,
    maxAge: '7d',
  }),
);

app.get('/', (_req, res) => {
  res.json({ ok: true, mensaje: 'API MWT funcionando by: Gustavo Barrientos' });
});
app.use('/api', routes);

export default app;