import express from 'express';
import cors from 'cors';
import * as path from 'path';
import routes from './routes';

const app = express();

// Allow cross-origin requests with credentials so frontend can send auth cookie
app.use(cors({ origin: true, credentials: true }));
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