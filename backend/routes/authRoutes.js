import express from 'express';
import { registerUser, loginUser, forgotPassword, validateResetToken, resetPassword, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);

// Ruta protegida para obtener perfil de usuario
router.get('/profile', authenticateToken, getProfile);

export default router;