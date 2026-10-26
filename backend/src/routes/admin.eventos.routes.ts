import { Router } from 'express';
import { deleteEventoController, publishEventoController, saveDraftEventoController } from '../controllers/admin.eventos.controller';
import { authRequired, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

const puedeOrganizar = requireRoles('ADMIN', 'STAFF', 'STAFF_TECNICO', 'JUEZ_MESA');

router.post('/publish', authRequired, puedeOrganizar, publishEventoController);
router.post('/draft', authRequired, puedeOrganizar, saveDraftEventoController);
router.delete('/:evento_id', authRequired, puedeOrganizar, deleteEventoController);

// Development-only: allow publishing without auth for local testing
if (process.env.NODE_ENV !== 'production') {
	router.post('/publish/public', publishEventoController);
	router.post('/draft/public', saveDraftEventoController);
	router.delete('/:evento_id/public', deleteEventoController);
}

export default router;
