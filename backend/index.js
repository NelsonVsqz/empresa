import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createInitialAdmin } from './utils/createInitialAdmin.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import sectorRoutes from './routes/sectorRoutes.js';
import permissionTypeRoutes from './routes/permissionTypeRoutes.js';
import permissionRequestRoutes from './routes/permissionRequestRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import uploadRoutes from './src/routes/upload.routes.js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? 
  process.env.CORS_ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:5173']; // Valor por defecto para desarrollo

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Crear usuario admin inicial si no existe
async function initializeApp() {
  try {
    await createInitialAdmin();
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
  }
}

// Iniciar la aplicación
initializeApp();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sectors', sectorRoutes);
app.use('/api/permission-types', permissionTypeRoutes);
app.use('/api/permission-requests', permissionRequestRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API para el Sistema de Gestión de Permisos está funcionando!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '¡Algo salió mal!' });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Servidor está corriendo en el puerto ${PORT}`);
});