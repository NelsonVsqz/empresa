// jwtUtils.js - Utilidades para la gestión de tokens JWT

import jwt from 'jsonwebtoken';

// Generar token JWT
export const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '1h' } // Sesión de 1 hora como se especifica en el plan
  );
};

// Verificar token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
  } catch (error) {
    throw new Error('Token inválido');
  }
};