import express from 'express';
import { getSignedAttachmentUrl } from '../controllers/attachmentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas estas rutas requieren autenticación
router.use(authenticateToken);

// Ruta para obtener URL firmada para un adjunto
router.get('/:id/signed-url', getSignedAttachmentUrl);

export default router;