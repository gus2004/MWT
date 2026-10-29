import { Router } from 'express';
import {
  getResumen,
  patchDatos,
  getInscripciones,
  getClasificaciones,
  getResultados,
  exportarHorarioCSV,
  exportarHorarioExcel,
  exportarHorarioPDF,
  generarHorarioAutomatico,
} from '../controllers/evento-panel.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/resumen', getResumen);
router.patch('/datos', patchDatos);
router.get('/inscripciones', getInscripciones);
router.get('/clasificaciones', getClasificaciones);
router.get('/resultados', getResultados);
router.get('/horario/export/csv', exportarHorarioCSV);
router.get('/horario/export/excel', exportarHorarioExcel);
router.get('/horario/export/pdf', exportarHorarioPDF);
router.post('/horario/generar', generarHorarioAutomatico);

export default router;
