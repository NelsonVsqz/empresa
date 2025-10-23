import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateManagerSector() {
  try {
    // Obtener el jefe de sector
    const manager = await prisma.user.findUnique({
      where: { email: 'manager@clinic.com' },
    });

    if (!manager) {
      console.log('No se encontró el jefe de sector');
      return;
    }

    // Asegurar que el campo managedSectorId esté correctamente configurado
    const updatedManager = await prisma.user.update({
      where: { email: 'manager@clinic.com' },
      data: { 
        managedSectorId: manager.sectorId // Aseguramos que sea el mismo sector en el que está
      },
      include: {
        managedSector: true
      }
    });

    console.log('Jefe de sector actualizado:', updatedManager);
    console.log('Sector gestionado:', updatedManager.managedSector);
  } catch (error) {
    console.error('Error al actualizar el sector del manager:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateManagerSector();