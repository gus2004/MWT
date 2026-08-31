import { Router } from 'express';
import {
  buscarPiloto,
  categoriasPorEvento,
  crearInscripcion,
  dorsalDisponible,
  dorsalesTomados,
  eventosDisponibles,
  validarPiloto,
} from '../controllers/inscripciones.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/eventos-disponibles', eventosDisponibles);
router.get('/categorias', categoriasPorEvento);
router.get('/buscar-piloto', buscarPiloto);
router.get('/validar-piloto', validarPiloto);
router.get('/dorsal-disponible', dorsalDisponible);
router.get('/dorsales-tomados', dorsalesTomados);
router.post('/', crearInscripcion);

export default router;
