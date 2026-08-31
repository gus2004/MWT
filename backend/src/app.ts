import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Allow cross-origin requests with credentials so frontend can send auth cookie
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.get('/', (_req, res) => {
  res.json({ ok: true, mensaje: 'API MWT funcionando by: Gustavo Barrientos' });
});
app.use('/api', routes);

export default app;