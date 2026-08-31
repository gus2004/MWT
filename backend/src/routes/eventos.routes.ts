import { Router } from 'express';
import {
  createActividad,
  createEvento,
  getEvento,
  listCronograma,
  listEventos,
  updateEstadoEvento,
} from '../controllers/eventos.controller';
import { listCategorias, createCategoria, updateCategoria, deleteCategoria } from '../controllers/eventos.categorias.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createEvento);
router.get('/', listEventos);
router.get('/:evento_id', getEvento);
router.patch('/:evento_id/estado', updateEstadoEvento);
router.post('/:evento_id/cronograma', createActividad);
router.get('/:evento_id/cronograma', listCronograma);

// Categorias por evento
router.get('/:evento_id/categorias', listCategorias);
router.post('/:evento_id/categorias', createCategoria);
router.patch('/:evento_id/categorias/:categoria_id', updateCategoria);
router.delete('/:evento_id/categorias/:categoria_id', deleteCategoria);

export default router;
