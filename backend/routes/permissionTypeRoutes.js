import express from 'express';
import { 
  getAllPermissionTypes, 
  getPermissionTypeById, 
  createPermissionType, 
  updatePermissionType, 
  deletePermissionType,
  bulkUploadPermissionTypes
} from '../controllers/permissionTypeController.js';
import { authenticateToken, requireHR } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Configuración para manejar subida de archivos

// Todas estas rutas requieren autenticación
router.use(authenticateToken);

// Rutas específicas
router.get('/', getAllPermissionTypes); // Accesible para usuarios autenticados
router.get('/:id', getPermissionTypeById); // Accesible para usuarios autenticados
router.post('/', requireHR, createPermissionType); // Solo RRHH
router.post('/bulk-upload', requireHR, upload.single('file'), bulkUploadPermissionTypes); // Solo RRHH
router.put('/:id', requireHR, updatePermissionType); // Solo RRHH
router.delete('/:id', requireHR, deletePermissionType); // Solo RRHH

export default router;