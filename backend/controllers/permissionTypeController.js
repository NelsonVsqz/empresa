import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// Obtener todos los tipos de permiso
export const getAllPermissionTypes = async (req, res) => {
  try {
    const permissionTypes = await prisma.permissionType.findMany();

    res.json({ permissionTypes });
  } catch (error) {
    console.error('Error al obtener tipos de permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un tipo de permiso específico
export const getPermissionTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const permissionType = await prisma.permissionType.findUnique({
      where: { id },
    });

    if (!permissionType) {
      return res.status(404).json({ error: 'Tipo de permiso no encontrado' });
    }

    res.json({ permissionType });
  } catch (error) {
    console.error('Error al obtener tipo de permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear un nuevo tipo de permiso
export const createPermissionType = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validar campos requeridos
    if (!name) {
      return res.status(400).json({ error: 'Nombre del tipo de permiso es requerido' });
    }

    // Verificar si el tipo de permiso ya existe
    const existingPermissionType = await prisma.permissionType.findUnique({
      where: { name },
    });

    if (existingPermissionType) {
      return res.status(400).json({ error: 'Tipo de permiso con este nombre ya existe' });
    }

    const permissionType = await prisma.permissionType.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json({
      message: 'Tipo de permiso creado exitosamente',
      permissionType,
    });
  } catch (error) {
    console.error('Error al crear tipo de permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar un tipo de permiso
export const updatePermissionType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Verificar si el tipo de permiso existe
    const existingPermissionType = await prisma.permissionType.findUnique({
      where: { id },
    });

    if (!existingPermissionType) {
      return res.status(404).json({ error: 'Tipo de permiso no encontrado' });
    }

    const updatedPermissionType = await prisma.permissionType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    });

    res.json({
      message: 'Tipo de permiso actualizado exitosamente',
      permissionType: updatedPermissionType,
    });
  } catch (error) {
    console.error('Error al actualizar tipo de permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar un tipo de permiso
export const deletePermissionType = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el tipo de permiso existe
    const existingPermissionType = await prisma.permissionType.findUnique({
      where: { id },
    });

    if (!existingPermissionType) {
      return res.status(404).json({ error: 'Tipo de permiso no encontrado' });
    }

    // Verificar si hay solicitudes con este tipo de permiso
    const requestsWithThisType = await prisma.permissionRequest.findMany({
      where: { typeId: id },
    });

    if (requestsWithThisType.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el tipo de permiso porque hay solicitudes asociadas a él' 
      });
    }

    await prisma.permissionType.delete({
      where: { id },
    });

    res.json({ message: 'Tipo de permiso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tipo de permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cargar tipos de permisos masivamente desde Excel
export const bulkUploadPermissionTypes = async (req, res) => {
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

    // Procesar los registros y crear tipos de permisos
    const results = [];
    for (const record of jsonData) {
      try {
        // Verificar si ya existe un tipo de permiso con el mismo nombre
        const existingPermissionType = await prisma.permissionType.findUnique({
          where: { name: record.name.toString().trim() }
        });
        
        if (existingPermissionType) {
          results.push({
            success: false,
            name: record.name.toString().trim(),
            error: 'Ya existe un tipo de permiso con este nombre'
          });
          continue;
        }
        
        // Crear el tipo de permiso
        const permissionType = await prisma.permissionType.create({
          data: {
            name: record.name.toString().trim(),
            description: record.description.toString().trim()
          }
        });
        
        results.push({
          success: true,
          name: permissionType.name,
          id: permissionType.id
        });
      } catch (creationError) {
        results.push({
          success: false,
          name: record.name.toString().trim(),
          error: creationError.message
        });
      }
    }

    // Contar resultados
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const totalProcessed = results.length;

    res.status(200).json({ 
      message: 'Carga masiva completada',
      totalProcessed,
      successCount,
      errorCount,
      results 
    });
  } catch (error) {
    console.error('Error durante la carga masiva:', error);
    res.status(500).json({ error: 'Error durante la carga masiva: ' + error.message });
  }
};