import { Router } from 'express';
import {
  createApelacion,
  createNotificacion,
  createPlantilla,
  createSancion,
  createTipoSancion,
  createArticuloReglamento,
  deleteArticuloReglamento,
  deleteEvidencia,
  comisariatoResumen,
  comisariatoExportCSV,
  comisariatoExportPDF,
  getReporteResumen,
  iaAlertasRiesgo,
  iaCalificarIncidencia,
  listApelaciones,
  listAuditoria,
  listEvidencias,
  listItemsChecklist,
  listNotificaciones,
  listPlantillas,
  listPreferencias,
  listReglamento,
  listRevisionesTecnicas,
  listSanciones,
  listTiposSancion,
  marcarNotificacionLeida,
  updateApelacion,
  updatePreferencia,
  updateRevisionTecnica,
  updateSancion,
  uploadEvidencia,
  uploadReglamentoDocumento,
  listReglamentoDocumentos,
  deleteReglamentoDocumento,
} from '../controllers/soporte.controller';
import { authRequired, requireRoles } from '../middlewares/auth.middleware';
import { uploadEvidencia as uploadEvidenciaMulter, uploadReglamentoPdf } from '../middlewares/upload.middleware';

const router = Router();

router.use(authRequired);

// Asistente IA del comisariato (IA generativa con respaldo local)
router.post('/ia/calificar', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), iaCalificarIncidencia);
router.get('/ia/alertas', iaAlertasRiesgo);

router.get('/sanciones', listSanciones);
router.post('/sanciones', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), createSancion);
router.patch('/sanciones/:id', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), updateSancion);

router.get('/tipos-sancion', listTiposSancion);
router.post('/tipos-sancion', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), createTipoSancion);

// Catálogo del reglamento (alimenta la sugerencia de artículo de la IA)
router.get('/reglamento', listReglamento);
router.post('/reglamento', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), createArticuloReglamento);
router.delete('/reglamento/:id', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), deleteArticuloReglamento);

// Reglamento del evento en PDF: el sistema LO LEE (texto + artículos) y la IA
// usa ese reglamento para sugerir artículo y sanción preliminar.
router.post('/reglamento/pdf', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), uploadReglamentoPdf.single('archivo'), uploadReglamentoDocumento);
router.get('/reglamento/documentos', listReglamentoDocumentos);
router.delete('/reglamento/pdf/:eventoId', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), deleteReglamentoDocumento);

// Evidencias de incidencias (solo respaldo documental: no se analizan por IA)
router.post('/evidencias', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), uploadEvidenciaMulter.single('archivo'), uploadEvidencia);
router.get('/evidencias', listEvidencias);
router.delete('/evidencias/:id', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), deleteEvidencia);

// Reportes del comisariato: resumen estructurado por evento + exportación CSV / PDF
router.get('/comisariato/resumen', comisariatoResumen);
router.get('/comisariato/export/csv', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), comisariatoExportCSV);
router.get('/comisariato/export/pdf', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), comisariatoExportPDF);

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