import { Router } from 'express';
import authRoutes from './auth.routes';
import clasificacionesRoutes from './clasificaciones.routes';
import publicRoutes from './public.routes';
import adminEventosRoutes from './admin.eventos.routes';
import adminSeriesRoutes from './admin.series.routes';
import adminInscripcionesRoutes from './admin.inscripciones.routes';
import inscripcionesRoutes from './inscripciones.routes';
import mantenimientoRoutes from './mantenimiento.routes';
import pilotosRoutes from './pilotos.routes';
import eventosRoutes from './eventos.routes';
import eventoPanelRoutes from './evento-panel.routes';
import gruposRoutes from './grupos.routes';
import resultadosRoutes from './resultados.routes';
import soporteRoutes from './soporte.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use("/public", publicRoutes);
router.use('/clasificaciones', clasificacionesRoutes);
router.use('/admin/eventos', adminEventosRoutes);
router.use('/admin/series', adminSeriesRoutes);
router.use('/admin/inscripciones', adminInscripcionesRoutes);
router.use('/inscripciones', inscripcionesRoutes);
router.use('/mantenimiento', mantenimientoRoutes);
router.use('/pilotos', pilotosRoutes);
router.use('/eventos', eventosRoutes);
router.use('/eventos/:evento_id/panel', eventoPanelRoutes);
router.use('/eventos/:evento_id/panel/grupos', gruposRoutes);
router.use('/resultados', resultadosRoutes);
router.use('/soporte', soporteRoutes);

export default router;