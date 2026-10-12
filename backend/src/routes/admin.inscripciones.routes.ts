import { Router } from 'express';
import { createInscripcionController, deleteInscripcionController, updateInscripcionController } from '../controllers/admin.inscripciones.controller';
import { dorsalesDisponibles } from '../controllers/inscripciones.controller';
import { authRequired, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create', authRequired, requireRoles('ADMIN', 'STAFF'), createInscripcionController);
router.put('/:id', authRequired, requireRoles('ADMIN', 'STAFF'), updateInscripcionController);
router.delete('/:id', authRequired, requireRoles('ADMIN', 'STAFF'), deleteInscripcionController);

if (process.env.NODE_ENV !== 'production') {
  router.post('/create/public', createInscripcionController);
  router.put('/:id/public', updateInscripcionController);
  router.delete('/:id/public', deleteInscripcionController);
}
router.get('/dorsales-disponibles', authRequired, requireRoles('ADMIN', 'STAFF'), dorsalesDisponibles);

export default router;