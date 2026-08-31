import { Router } from 'express';
import { login, me, register, actualizarPerfil } from '../controllers/auth.controller';
import { authRequired } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);
router.patch('/me', authRequired, actualizarPerfil);

export default router;