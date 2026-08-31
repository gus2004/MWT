import { Router } from 'express';
import {
  postCrearGrupo,
  getListarGrupos,
  patchEditarGrupo,
  deleteGrupo,
  patchClasificacionCompletada,
  patchHeatCompletado,
} from '../controllers/grupos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.post('/', postCrearGrupo);
router.get('/', getListarGrupos);
router.patch('/:grupo_id', patchEditarGrupo);
router.delete('/:grupo_id', deleteGrupo);
router.patch('/:grupo_id/clasificacion-completada', patchClasificacionCompletada);
router.patch('/:grupo_id/heat-completado', patchHeatCompletado);

export default router;
