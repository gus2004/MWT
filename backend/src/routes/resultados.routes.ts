import { Router } from 'express';
import { getPilotosParaHeat, postResultadosHeat, getResultadosHeat } from '../controllers/resultados.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/grupo/:grupo_id/pilotos', getPilotosParaHeat); // ?heat=1
router.post('/grupo/:grupo_id/heat/:numero', postResultadosHeat);
router.get('/grupo/:grupo_id/heat/:numero', getResultadosHeat);

export default router;
