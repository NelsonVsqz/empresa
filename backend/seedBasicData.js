import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBasicData() {
  try {
    // Crear algunos sectores si no existen
    const adminSector = await prisma.sector.upsert({
      where: { name: 'Administración' },
      update: {},
      create: {
        name: 'Administración',
        description: 'Departamento de administración'
      },
    });

    const medicalSector = await prisma.sector.upsert({
      where: { name: 'Medicina' },
      update: {},
      create: {
        name: 'Medicina',
        description: 'Departamento médico'
      },
    });

    const nursingSector = await prisma.sector.upsert({
      where: { name: 'Enfermería' },
      update: {},
      create: {
        name: 'Enfermería',
        description: 'Departamento de enfermería'
      },
    });

    // Crear algunos tipos de permiso
    const medicalLeave = await prisma.permissionType.upsert({
      where: { name: 'Permiso Médico' },
      update: {},
      create: {
        name: 'Permiso Médico',
        description: 'Permiso por razones médicas'
      },
    });

    const personalLeave = await prisma.permissionType.upsert({
      where: { name: 'Permiso Personal' },
      update: {},
      create: {
        name: 'Permiso Personal',
        description: 'Permiso por razones personales'
      },
    });

    const vacation = await prisma.permissionType.upsert({
      where: { name: 'Vacaciones' },
      update: {},
      create: {
        name: 'Vacaciones',
        description: 'Solicitud de vacaciones'
      },
    });

    console.log({
      sectors: [adminSector, medicalSector, nursingSector],
      permissionTypes: [medicalLeave, personalLeave, vacation]
    });
    console.log('Datos básicos creados exitosamente!');
  } catch (error) {
    console.error('Error al sembrar datos básicos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData();