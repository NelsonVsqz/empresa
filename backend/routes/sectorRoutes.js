import express from 'express';
import { 
  getAllSectors, 
  getSectorById, 
  createSector, 
  updateSector, 
  deleteSector,
  bulkUploadSectors
} from '../controllers/sectorController.js';
import { authenticateToken, requireHR } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Configuración para manejar subida de archivos

// Todas estas rutas requieren autenticación
router.use(authenticateToken);

// Rutas específicas
router.get('/', getAllSectors); // Accesible para usuarios autenticados
router.get('/:id', getSectorById); // Accesible para usuarios autenticados
router.post('/', requireHR, createSector); // Solo RRHH
router.post('/bulk-upload', requireHR, upload.single('file'), bulkUploadSectors); // Solo RRHH
router.put('/:id', requireHR, updateSector); // Solo RRHH
router.delete('/:id', requireHR, deleteSector); // Solo RRHH

export default router;