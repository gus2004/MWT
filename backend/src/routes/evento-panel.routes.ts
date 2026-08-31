import { Router } from 'express';
import {
  getResumen,
  patchDatos,
  getInscripciones,
  getClasificaciones,
  getResultados,
} from '../controllers/evento-panel.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/resumen', getResumen);
router.patch('/datos', patchDatos);
router.get('/inscripciones', getInscripciones);
router.get('/clasificaciones', getClasificaciones);
router.get('/resultados', getResultados);

export default router;
