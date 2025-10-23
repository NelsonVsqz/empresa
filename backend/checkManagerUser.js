import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkManagerUser() {
  try {
    // Obtener al usuario MANAGER
    const managerUser = await prisma.user.findUnique({
      where: { email: 'manager@clinic.com' },
    });

    console.log('Usuario MANAGER:', managerUser);
    console.log('¿Tiene managedSectorId?', managerUser?.managedSectorId ? 'Sí' : 'No');
    console.log('¿Tiene sectorId?', managerUser?.sectorId ? 'Sí' : 'No');
  } catch (error) {
    console.error('Error verificando el usuario MANAGER:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkManagerUser();