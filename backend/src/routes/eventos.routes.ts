import { Router } from 'express';
import {
  createActividad,
  createEvento,
  deleteActividad,
  getEvento,
  listCronograma,
  listEventos,
  updateActividad,
  updateEstadoEvento,
  updateEvento,
} from '../controllers/eventos.controller';
import { listCategorias, createCategoria, updateCategoria, deleteCategoria } from '../controllers/eventos.categorias.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Lectura: cualquier usuario autenticado (incluye pilotos que consultan el calendario).
router.get('/', listEventos);
router.get('/:evento_id', getEvento);
router.get('/:evento_id/cronograma', listCronograma);
router.get('/:evento_id/categorias', listCategorias);

// Escritura: roles organizadores.
const puedeOrganizar = requireRoles('ADMIN', 'STAFF', 'STAFF_TECNICO', 'JUEZ_MESA');

router.post('/', puedeOrganizar, createEvento);
router.patch('/:evento_id', puedeOrganizar, updateEvento);
router.patch('/:evento_id/estado', puedeOrganizar, updateEstadoEvento);

// Cronograma
router.post('/:evento_id/cronograma', puedeOrganizar, createActividad);
router.patch('/:evento_id/cronograma/:actividad_id', puedeOrganizar, updateActividad);
router.delete('/:evento_id/cronograma/:actividad_id', puedeOrganizar, deleteActividad);

// Categorias por evento
router.post('/:evento_id/categorias', puedeOrganizar, createCategoria);
router.patch('/:evento_id/categorias/:categoria_id', puedeOrganizar, updateCategoria);
router.delete('/:evento_id/categorias/:categoria_id', puedeOrganizar, deleteCategoria);

export default router;
