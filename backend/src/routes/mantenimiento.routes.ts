import { Router } from 'express';
import {
  createCampeonato,
  createCategoria,
  createCircuito,
  createMarca,
  listCampeonatos,
  listCategorias,
  listCircuitos,
  listMarcas,
} from '../controllers/mantenimiento.controller';
import {
  listCrud,
  createCrud,
  updateCrud,
  deleteCrud,
  getCrudDetail,
} from '../controllers/mantenimiento-crud.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/marcas', createMarca);
router.get('/marcas', listMarcas);

router.post('/campeonatos', createCampeonato);
router.get('/campeonatos', listCampeonatos);

router.post('/categorias', createCategoria);
router.get('/categorias', listCategorias);

router.post('/circuitos', createCircuito);
router.get('/circuitos', listCircuitos);

router.get('/crud/:entity', listCrud);
router.get('/crud/:entity/:id', getCrudDetail);
router.post('/crud/:entity', requireRoles('ADMIN', 'STAFF'), createCrud);
router.patch('/crud/:entity/:id', requireRoles('ADMIN', 'STAFF'), updateCrud);
router.delete('/crud/:entity/:id', requireRoles('ADMIN', 'STAFF'), deleteCrud);

export default router;
