import { Router } from 'express';
import {
  createMotocicleta,
  createPiloto,
  getPiloto,
  listPilotos,
  updatePiloto,
  deletePiloto,
} from '../controllers/pilotos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createPiloto);
router.post('/:piloto_id/motocicletas', createMotocicleta);
router.get('/', listPilotos);
router.get('/:piloto_id', getPiloto);
router.put('/:piloto_id', updatePiloto);
router.delete('/:piloto_id', deletePiloto);

export default router;
