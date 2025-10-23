import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Registro de usuario
export const registerUser = async (req, res) => {
  try {
    const { email, name, password, role, sectorId } = req.body;

    // Validar campos requeridos
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, nombre y contraseña son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Usuario con este email ya existe' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        ...(sectorId && { sectorId }),
      },
    });

    // Remover la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Inicio de sesión
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        managedSectorId: user.managedSectorId // Incluir el ID del sector que gestiona (si es jefe de sector)
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1h' } // Sesión de 1 hora como se especifica en el plan
    );

    // Remover la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Generar un token único y seguro para restablecimiento de contraseña
import crypto from 'crypto';

// Servicio de envío de correos desde el archivo existente
import { sendEmail } from '../utils/emailUtils.js';

// Recuperación de contraseña
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Para seguridad, no revelamos si el email existe o no
    if (!user) {
      return res.json({ message: 'Si el email existe, se enviará un enlace de recuperación' });
    }

    // Generar un token único y seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Expiración del token: 1 hora
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora en milisegundos

    // Guardar el token y la fecha de expiración en la base de datos
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires
      }
    });

    // Enviar correo con el enlace de restablecimiento
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const subject = 'Recuperación de Contraseña - Sistema de Permisos';
    const html = `
      <h2>Recuperación de Contraseña</h2>
      <p>Hola ${user.name},</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Por favor, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
        Restablecer Contraseña
      </a>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste restablecer tu contraseña, por favor ignora este correo.</p>
      <br>
      <p>Saludos,<br>El equipo de soporte</p>
    `;

    const emailResult = await sendEmail(user.email, subject, html);

    if (!emailResult.success) {
      console.error('Error al enviar correo de recuperación:', emailResult.error);
      return res.status(500).json({ error: 'Error al enviar el correo de recuperación' });
    }

    res.json({ message: 'Se ha enviado un enlace de recuperación a su correo electrónico' });
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Validar token de restablecimiento de contraseña
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de restablecimiento es requerido' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gte: new Date() // Mayor o igual que la fecha actual (no expirado)
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token de restablecimiento inválido o expirado' });
    }

    res.json({ success: true, message: 'Token válido' });
  } catch (error) {
    console.error('Error al validar token de restablecimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Restablecer contraseña
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gte: new Date() // Mayor o igual que la fecha actual (no expirado)
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token de restablecimiento inválido o expirado' });
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y limpiar el token de restablecimiento
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener perfil de usuario (protegido por middleware de autenticación)
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId; // Este valor se establece en el middleware de autenticación

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sectorId: true,
        sector: true,
        managedSectorId: true,
        managedSector: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};