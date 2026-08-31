import { Router } from 'express';
import { deleteEventoController, publishEventoController, saveDraftEventoController } from '../controllers/admin.eventos.controller';
import { authRequired, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/publish', authRequired, requireRoles('ADMIN', 'STAFF'), publishEventoController);
router.post('/draft', authRequired, requireRoles('ADMIN', 'STAFF'), saveDraftEventoController);
router.delete('/:evento_id', authRequired, requireRoles('ADMIN', 'STAFF'), deleteEventoController);

// Development-only: allow publishing without auth for local testing
if (process.env.NODE_ENV !== 'production') {
	router.post('/publish/public', publishEventoController);
	router.post('/draft/public', saveDraftEventoController);
	router.delete('/:evento_id/public', deleteEventoController);
}

export default router;
