import { Router } from 'express';
import {
  arbolSeries,
  clonarAnio,
  crearCategoria,
  crearSerie,
  editarSerie,
  eliminarCategoria,
  eliminarSerie,
  importarCategorias,
  listarCategorias,
} from '../controllers/admin.series.controller';
import { authRequired, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authRequired, requireRoles('ADMIN', 'STAFF'));

// Árbol de carpetas de eventos
router.get('/arbol', arbolSeries);

// Copiar la estructura de un año a otro (carpetas, fechas, categorías)
router.post('/clonar-anio', clonarAnio);

// CRUD de series (carpetas de evento ACMG/Yamaha)
router.post('/', crearSerie);
router.patch('/:serie_id', editarSerie);
router.delete('/:serie_id', eliminarSerie);

// Categorías que participan en la serie (evento)
router.get('/:serie_id/categorias', listarCategorias);
router.post('/:serie_id/categorias/importar', importarCategorias);
router.post('/:serie_id/categorias', crearCategoria);
router.delete('/:serie_id/categorias/:categoria_id', eliminarCategoria);

export default router;