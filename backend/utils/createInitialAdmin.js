import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createInitialAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@clinicaledesma.com';
    const adminName = process.env.ADMIN_NAME || 'Admin Empresa';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    // Verificar si ya existe un usuario con el rol HR
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'HR'
      }
    });
    
    if (existingAdmin) {
      console.log('Ya existe un usuario con rol HR. No se creará un nuevo admin inicial.');
      return;
    }
    
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Crear el usuario admin
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'HR' // Rol de administrador
      }
    });
    
    console.log(`Usuario admin creado exitosamente:`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Nombre: ${adminUser.name}`);
    console.log(`Rol: ${adminUser.role}`);
  } catch (error) {
    console.error('Error al crear el usuario admin inicial:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificar si este módulo es el módulo principal ejecutado
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  createInitialAdmin();
}

export { createInitialAdmin };