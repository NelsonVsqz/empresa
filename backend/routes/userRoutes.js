import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  bulkCreateUsers,
  getUsersBySector
} from '../controllers/userController.js';
import { authenticateToken, requireHR, requireManager } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Todas estas rutas requieren autenticación
router.use(authenticateToken);

// Rutas específicas
router.get('/', requireHR, getAllUsers); // Solo RRHH
router.get('/by-sector', requireManager, getUsersBySector); // RRHH o Manager
router.get('/:id', getUserById); // Accesible para usuarios autenticados
router.post('/', requireHR, createUser); // Solo RRHH
router.put('/:id', requireHR, updateUser); // Solo RRHH
router.delete('/:id', requireHR, deleteUser); // Solo RRHH
router.post('/bulk-create', requireHR, upload.single('file'), bulkCreateUsers); // Solo RRHH (carga masiva con Excel)

export default router;