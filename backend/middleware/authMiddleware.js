import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido.' });
    }
    
    // Obtener información completa del usuario desde la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        managedSector: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(403).json({ error: 'Usuario no encontrado.' });
    }
    
    req.userId = user.id;
    req.userRole = user.role;
    req.userEmail = user.email;
    req.userSectorId = user.sectorId; // Sector al que pertenece el usuario
    
    // Verificar si el managedSectorId está en el token (para sesiones anteriores al cambio)
    // Si no está en el token, usar el valor de la base de datos
    req.userManagedSectorId = decoded.managedSectorId || user.managedSectorId; // Sector que el usuario gestiona (si es jefe)
    
    // Agregar información adicional para verificación en el controlador
    req.user = user;
    
    next();
  });
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Acceso denegado. Autenticación requerida.' });
    }
    
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Middleware para verificar si es empleado
export const requireEmployee = (req, res, next) => {
  requireRole(['EMPLOYEE', 'MANAGER', 'HR'])(req, res, next);
};

// Middleware para verificar si es jefe de sector
export const requireManager = (req, res, next) => {
  requireRole(['MANAGER', 'HR'])(req, res, next);
};

// Middleware para verificar si es RRHH
export const requireHR = (req, res, next) => {
  requireRole(['HR'])(req, res, next);
};