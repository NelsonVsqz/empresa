import express from 'express';
import { 
  getAllPermissionRequests, 
  getMyPermissionRequests,
  getPendingRequestsForSector,
  getPermissionRequestById, 
  createPermissionRequest,
  createPermissionRequestWithAttachments, 
  updatePermissionRequest,
  approvePermissionRequest,
  rejectPermissionRequest
} from '../controllers/permissionRequestController.js';
import { authenticateToken, requireRole, requireHR, requireManager } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas estas rutas requieren autenticación
router.use(authenticateToken);

// Rutas específicas
router.get('/', getAllPermissionRequests); // La lógica de autorización se maneja dentro del controlador
router.get('/my-requests', getMyPermissionRequests); // Solo para el usuario autenticado
router.get('/pending-for-sector', getPendingRequestsForSector); // Jefes de sector y RRHH
router.get('/:id', getPermissionRequestById); // Accesible según autorización
router.post('/', createPermissionRequestWithAttachments); // Empleados pueden crear con adjuntos
router.put('/:id', updatePermissionRequest); // Jefes de sector y RRHH pueden actualizar
router.put('/:id/approve', approvePermissionRequest); // Jefes de sector y RRHH pueden aprobar
router.put('/:id/reject', rejectPermissionRequest); // Jefes de sector y RRHH pueden rechazar

export default router;