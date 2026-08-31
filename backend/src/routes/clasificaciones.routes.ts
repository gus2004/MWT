import { Router } from 'express';
import {
  createClasificacion,
  deleteClasificacion,
  getParrillaEventoCategoria,
  listClasificaciones,
  postTiempoEventoCategoria,
  updateClasificacion,
} from '../controllers/clasificaciones.controller';
import { getPilotosGrupo, postTiempoGrupo, getParrilla, patchCompletarGrupo } from '../controllers/clasificaciones.controller';
import { authRequired, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authRequired);
router.get('/', listClasificaciones);
// Allow any authenticated user to create/update/delete clasificaciones
router.post('/', createClasificacion);
router.put('/:id', updateClasificacion);
router.delete('/:id', deleteClasificacion);
router.post('/evento/:evento_id/tiempo', postTiempoEventoCategoria);
router.get('/evento/:evento_id/parrilla', getParrillaEventoCategoria);

// Group-specific classification endpoints
router.get('/grupo/:grupo_id', getPilotosGrupo);
router.post('/grupo/:grupo_id/tiempo', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), postTiempoGrupo);
router.get('/grupo/:grupo_id/parrilla', getParrilla);
router.patch('/grupo/:grupo_id/completar', requireRoles('ADMIN', 'COMISARIO', 'JUEZ_MESA'), patchCompletarGrupo);

export default router;
