import { Router } from 'express';
import {
  createApelacion,
  createNotificacion,
  createPlantilla,
  createSancion,
  createTipoSancion,
  getReporteResumen,
  listApelaciones,
  listAuditoria,
  listItemsChecklist,
  listNotificaciones,
  listPlantillas,
  listPreferencias,
  listRevisionesTecnicas,
  listSanciones,
  listTiposSancion,
  marcarNotificacionLeida,
  updateApelacion,
  updatePreferencia,
  updateRevisionTecnica,
  updateSancion,
} from '../controllers/soporte.controller';
import { authRequired, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authRequired);

router.get('/sanciones', listSanciones);
router.post('/sanciones', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), createSancion);
router.patch('/sanciones/:id', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), updateSancion);

router.get('/tipos-sancion', listTiposSancion);
router.post('/tipos-sancion', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), createTipoSancion);

router.get('/apelaciones', listApelaciones);
router.post('/apelaciones', createApelacion);
router.patch('/apelaciones/:id', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), updateApelacion);

router.get('/items-checklist', listItemsChecklist);
router.get('/revisiones-tecnicas', listRevisionesTecnicas);
router.patch('/revisiones-tecnicas/:id', requireRoles('ADMIN', 'COMISARIO', 'STAFF_TECNICO'), updateRevisionTecnica);

router.get('/notificaciones', listNotificaciones);
router.post('/notificaciones', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA', 'STAFF_TECNICO'), createNotificacion);
router.patch('/notificaciones/:id', marcarNotificacionLeida);

router.get('/plantillas', listPlantillas);
router.post('/plantillas', requireRoles('ADMIN', 'JUEZ_MESA'), createPlantilla);

router.get('/preferencias', listPreferencias);
router.put('/preferencias/:clave', requireRoles('ADMIN'), updatePreferencia);

router.get('/auditoria', listAuditoria);

router.get('/reportes/resumen', getReporteResumen);

export default router;