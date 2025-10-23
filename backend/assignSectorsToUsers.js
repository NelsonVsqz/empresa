import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUsersWithSectors() {
  try {
    // Obtener los sectores existentes
    const sectors = await prisma.sector.findMany();
    
    if (sectors.length === 0) {
      console.log('No se encontraron sectores en la base de datos');
      return;
    }

    // Asignar sectores a los usuarios de prueba
    const employee = await prisma.user.update({
      where: { email: 'employee@clinic.com' },
      data: { 
        sectorId: sectors[0].id // Asignar al primer sector (Administración)
      },
    });

    const manager = await prisma.user.update({
      where: { email: 'manager@clinic.com' },
      data: { 
        sectorId: sectors[0].id, // Asignar al primer sector (Administración)
        managedSectorId: sectors[0].id // Este usuario es el jefe de este sector
      },
    });

    const hr = await prisma.user.update({
      where: { email: 'hr@clinic.com' },
      data: { 
        sectorId: sectors[0].id // Asignar al primer sector (Administración)
      },
    });

    console.log({ employee, manager, hr });
    console.log('Sectores asignados a los usuarios de prueba exitosamente!');
  } catch (error) {
    console.error('Error al asignar sectores a los usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsersWithSectors();