import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    // Hashear la contraseña para los usuarios de prueba
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Crear un usuario con rol EMPLOYEE
    const employeeUser = await prisma.user.upsert({
      where: { email: 'employee@clinic.com' },
      update: {},
      create: {
        email: 'employee@clinic.com',
        name: 'Empleado Prueba',
        password: hashedPassword,
        role: 'EMPLOYEE',
      },
    });

    // Crear un usuario con rol MANAGER
    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@clinic.com' },
      update: {},
      create: {
        email: 'manager@clinic.com',
        name: 'Jefe de Sector',
        password: hashedPassword,
        role: 'MANAGER',
      },
    });

    // Crear un usuario con rol HR
    const hrUser = await prisma.user.upsert({
      where: { email: 'hr@clinic.com' },
      update: {},
      create: {
        email: 'hr@clinic.com',
        name: 'Recursos Humanos',
        password: hashedPassword,
        role: 'HR',
      },
    });

    console.log({ employeeUser, managerUser, hrUser });
    console.log('Usuarios de prueba creados exitosamente!');
  } catch (error) {
    console.error('Error al sembrar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();