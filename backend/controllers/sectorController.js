import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// Obtener todos los sectores
export const getAllSectors = async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    res.json({ sectors });
  } catch (error) {
    console.error('Error al obtener sectores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un sector específico
export const getSectorById = async (req, res) => {
  try {
    const { id } = req.params;

    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!sector) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    res.json({ sector });
  } catch (error) {
    console.error('Error al obtener sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear un nuevo sector
export const createSector = async (req, res) => {
  try {
    const { name, description, managerId } = req.body;

    // Validar campos requeridos
    if (!name) {
      return res.status(400).json({ error: 'Nombre del sector es requerido' });
    }

    // Verificar si el sector ya existe
    const existingSector = await prisma.sector.findUnique({
      where: { name },
    });

    if (existingSector) {
      return res.status(400).json({ error: 'Sector con este nombre ya existe' });
    }

    // Si se proporciona un managerId, verificar que el usuario existe y es MANAGER
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (!manager) {
        return res.status(404).json({ error: 'Usuario manager no encontrado' });
      }

      if (manager.role !== 'MANAGER') {
        return res.status(400).json({ error: 'El usuario no tiene el rol de MANAGER' });
      }
    }

    const sector = await prisma.sector.create({
      data: {
        name,
        description,
        ...(managerId && { manager: { connect: { id: managerId } } })
      },
    });

    res.status(201).json({
      message: 'Sector creado exitosamente',
      sector,
    });
  } catch (error) {
    console.error('Error al crear sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar un sector
export const updateSector = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, managerId } = req.body;

    // Verificar si el sector existe
    const existingSector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!existingSector) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    // Si se proporciona un nuevo managerId, verificar que el usuario existe y es MANAGER
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (!manager) {
        return res.status(404).json({ error: 'Usuario manager no encontrado' });
      }

      if (manager.role !== 'MANAGER') {
        return res.status(400).json({ error: 'El usuario no tiene el rol de MANAGER' });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
    };

    // Actualizar el manager si se proporciona
    if (managerId !== undefined) {
      if (managerId) {
        // Conectar un nuevo manager
        updateData.manager = { connect: { id: managerId } };
      } else {
        // Desconectar el manager actual
        updateData.manager = { disconnect: true };
      }
    }

    const updatedSector = await prisma.sector.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    res.json({
      message: 'Sector actualizado exitosamente',
      sector: updatedSector,
    });
  } catch (error) {
    console.error('Error al actualizar sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar un sector
export const deleteSector = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el sector existe
    const existingSector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!existingSector) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    // Verificar si hay usuarios en este sector
    const usersInSector = await prisma.user.findMany({
      where: { sectorId: id },
    });

    if (usersInSector.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el sector porque hay usuarios asignados a él' 
      });
    }

    await prisma.sector.delete({
      where: { id },
    });

    res.json({ message: 'Sector eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cargar sectores masivamente desde Excel
export const bulkUploadSectors = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Validar campos requeridos
    const requiredFields = ['name', 'description'];
    const missingFields = requiredFields.filter(field => !Object.keys(jsonData[0] || {}).includes(field));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Campos requeridos faltantes: ${missingFields.join(', ')}` });
    }

    // Validar los registros
    for (let i = 0; i < jsonData.length; i++) {
      const record = jsonData[i];
      if (!record.name || !record.description) {
        return res.status(400).json({ 
          error: `El registro en la fila ${i + 2} no tiene los campos "name" y "description" requeridos` 
        });
      }
    }

    // Procesar los registros y crear sectores
    const results = [];
    for (const record of jsonData) {
      try {
        // Verificar si ya existe un sector con el mismo nombre
        const existingSector = await prisma.sector.findUnique({
          where: { name: record.name.toString().trim() }
        });
        
        if (existingSector) {
          results.push({
            success: false,
            name: record.name.toString().trim(),
            error: 'Ya existe un sector con este nombre'
          });
          continue;
        }
        
        let managerId = null;
        if (record.managerId && record.managerId.toString().trim() !== '') {
          managerId = parseInt(record.managerId);
          if (isNaN(managerId)) {
            throw new Error(`managerId inválido: ${record.managerId}`);
          }
          
          // Verificar que el usuario exista y tenga rol MANAGER
          const user = await prisma.user.findUnique({
            where: { id: managerId }
          });
          
          if (!user) {
            throw new Error(`Usuario con ID ${managerId} no existe`);
          }
          
          if (user.role !== 'MANAGER') {
            throw new Error(`El usuario con ID ${managerId} no tiene rol de MANAGER`);
          }
        }
        
        // Crear el sector
        const sector = await prisma.sector.create({
          data: {
            name: record.name.toString().trim(),
            description: record.description.toString().trim(),
            ...(managerId && { manager: { connect: { id: managerId } } })
          }
        });
        
        results.push({
          success: true,
          name: sector.name,
          id: sector.id
        });
      } catch (creationError) {
        results.push({
          success: false,
          name: record.name.toString().trim(),
          error: creationError.message
        });
      }
    }

    res.status(200).json({ 
      message: 'Carga masiva completada',
      results 
    });
  } catch (error) {
    console.error('Error durante la carga masiva:', error);
    res.status(500).json({ error: 'Error durante la carga masiva: ' + error.message });
  }
};