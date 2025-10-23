import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// Obtener todos los usuarios (solo para RRHH)
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          }
        },
        managedSector: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Remover la contraseña del objeto de respuesta
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({ users: usersWithoutPassword });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un usuario específico
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          }
        },
        managedSector: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Remover la contraseña del objeto de respuesta
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear un nuevo usuario (solo para RRHH)
export const createUser = async (req, res) => {
  try {
    const { email, name, password, role, sectorId, managedSectorId } = req.body;

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

    // Variables para almacenar los IDs de sector
    let userSectorId = sectorId;
    let userManagedSectorId = managedSectorId;

    // Si el rol es MANAGER, validar que se haya proporcionado un sector
    if (role === 'MANAGER') {
      // Si se proporciona managedSectorId, usar ese sector
      if (managedSectorId) {
        userSectorId = managedSectorId; // El jefe también pertenece a su propio sector
        userManagedSectorId = managedSectorId;
      } 
      // Si se proporciona sectorId pero no managedSectorId, usar sectorId como managedSectorId
      else if (sectorId) {
        userSectorId = sectorId;
        userManagedSectorId = sectorId; // El jefe gestiona el mismo sector al que pertenece
      } 
      // Si no se proporciona ningún sector
      else {
        return res.status(400).json({ error: 'Los jefes de sector deben tener un sector asignado' });
      }
    }

    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        ...(userSectorId && { sectorId: userSectorId }),
        ...(userManagedSectorId && { managedSectorId: userManagedSectorId }),
      },
    });

    // Remover la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar un usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, sectorId, managedSectorId, password } = req.body;

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Preparar los datos de actualización
    const updateData = {
      ...(email && { email }),
      ...(name && { name }),
      ...(role && { role }),
    };

    // Si se proporciona una nueva contraseña, encriptarla
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Lógica especial cuando se cambia el rol a MANAGER
    if (role === 'MANAGER') {
      // Variables para almacenar los IDs de sector
      let userSectorId = sectorId;
      let userManagedSectorId = managedSectorId;

      // Si se proporciona managedSectorId, usar ese sector
      if (managedSectorId) {
        userSectorId = managedSectorId; // El jefe también pertenece a su propio sector
        userManagedSectorId = managedSectorId;
      } 
      // Si se proporciona sectorId pero no managedSectorId, usar sectorId como managedSectorId
      else if (sectorId) {
        userSectorId = sectorId;
        userManagedSectorId = sectorId; // El jefe gestiona el mismo sector al que pertenece
      } 
      // Si no se proporciona ningún sector pero el usuario ya tenía uno, mantenerlo
      else if (existingUser.sectorId) {
        userSectorId = existingUser.sectorId;
        userManagedSectorId = existingUser.sectorId; // El jefe gestiona el mismo sector al que pertenece
      }
      // Si no se proporciona ningún sector
      else {
        return res.status(400).json({ error: 'Los jefes de sector deben tener un sector asignado' });
      }

      // Establecer ambos campos para el rol MANAGER
      updateData.sectorId = userSectorId;
      updateData.managedSectorId = userManagedSectorId;
    } 
    // Para otros roles, manejar los sectores normalmente
    else {
      // Si se proporcionan nuevos valores de sector, usarlos
      if (sectorId !== undefined) {
        updateData.sectorId = sectorId;
      }
      
      // Para roles que no son MANAGER, eliminar managedSectorId si se estaba estableciendo
      if (role && role !== 'MANAGER') {
        updateData.managedSectorId = null;
      } 
      // Si se proporciona managedSectorId para un rol que no es MANAGER, eliminarlo
      else if (managedSectorId !== undefined && role !== 'MANAGER') {
        updateData.managedSectorId = null;
      }
      // Si no se proporciona managedSectorId pero el usuario era MANAGER, eliminarlo
      else if (existingUser.managedSectorId && role && role !== 'MANAGER') {
        updateData.managedSectorId = null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          }
        },
        managedSector: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Remover la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si el usuario es un jefe de sector, verificar que no esté asignado a un sector
    if (existingUser.managedSectorId) {
      // Remover la relación del sector
      await prisma.sector.update({
        where: { id: existingUser.managedSectorId },
        data: { manager: { disconnect: true } }
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener usuarios por sector
export const getUsersBySector = async (req, res) => {
  try {
    const { sectorId } = req.query;

    if (!sectorId) {
      return res.status(400).json({ error: 'Sector ID es requerido' });
    }

    console.log(`Usuario con rol: ${req.userRole}, managedSectorId: ${req.userManagedSectorId}, sectorId: ${sectorId}`);
    
    // Verificar autorización
    if (req.userRole !== 'HR' && req.userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Acceso denegado. No autorizado para ver usuarios por sector.' });
    }

    // Si es jefe de sector, solo puede ver usuarios de su propio sector
    if (req.userRole === 'MANAGER') {
      console.log(`Jefe con managedSectorId: ${req.userManagedSectorId}, sectorId solicitado: ${sectorId}`);
      if (req.userManagedSectorId !== sectorId) {
        console.log(`Jefe intentando acceder a un sector diferente. Acceso denegado.`);
        return res.status(403).json({ error: 'Acceso denegado. No autorizado para ver usuarios de otros sectores.' });
      }
    }

    const users = await prisma.user.findMany({
      where: { 
        sectorId: sectorId 
      },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          }
        },
        managedSector: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Remover la contraseña del objeto de respuesta
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({ users: usersWithoutPassword });
  } catch (error) {
    console.error('Error al obtener usuarios por sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Controlador para carga masiva de usuarios
export const bulkCreateUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    // Verificar el tipo de archivo
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    let records = [];

    if (fileExtension === 'csv') {
      // Leer y procesar archivo CSV
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Leer y procesar archivo Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ error: 'Formato de archivo no soportado. Se aceptan archivos CSV, XLSX y XLS.' });
    }

    // Validar campos requeridos
    const requiredFields = ['email', 'name', 'password'];
    const missingFields = requiredFields.filter(field => !Object.keys(records[0] || {}).includes(field));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Campos requeridos faltantes: ${missingFields.join(', ')}` });
    }

    // Contadores
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Procesar cada línea
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const lineNumber = index + 2; // +1 por el encabezado, +1 para empezar desde la línea 2

      try {
        // Validar campos requeridos
        if (!record.email || !record.name || !record.password) {
          throw new Error(`Línea ${lineNumber}: Los campos email, name y password son requeridos`);
        }

        // Validar rol
        const validRoles = ['EMPLOYEE', 'MANAGER', 'HR'];
        const role = record.role ? record.role.toString().toUpperCase() : 'EMPLOYEE';
        if (!validRoles.includes(role)) {
          throw new Error(`Línea ${lineNumber}: Rol inválido. Los roles válidos son: EMPLOYEE, MANAGER, HR`);
        }

        // Validar y obtener el sectorId
        let sectorId = null;
        let managedSectorId = null;

        if (role === 'HR') {
          // Los usuarios HR no deben tener un sector asignado
          if (record.sectorId) {
            console.log(`Advertencia línea ${lineNumber}: Los usuarios HR no deben tener un sector asignado, ignorando sector`);
          }
        } else if (record.sectorId) {
          // Buscar el sector en la base de datos
          const sector = await prisma.sector.findUnique({
            where: { id: record.sectorId.toString() }
          });

          if (!sector) {
            throw new Error(`Línea ${lineNumber}: Sector con ID ${record.sectorId} no encontrado`);
          }

          if (role === 'MANAGER') {
            // Si es MANAGER, el sectorId se convierte en managedSectorId
            // ¡PERO TAMBIÉN DEBE SER EL sectorId PARA QUE EL JEFE PERTENEZCA AL SECTOR!
            managedSectorId = sector.id;
            sectorId = sector.id; // El jefe también pertenece a su propio sector
          } else {
            // Si es EMPLOYEE, el sectorId permanece como sectorId
            sectorId = sector.id;
          }
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: record.email.toString() },
        });

        if (existingUser) {
          throw new Error(`Línea ${lineNumber}: Usuario con email ${record.email} ya existe`);
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(record.password.toString(), 10);

        // Crear nuevo usuario
        await prisma.user.create({
          data: {
            email: record.email.toString(),
            name: record.name.toString(),
            password: hashedPassword,
            role: role,
            ...(sectorId && { sectorId }),
            ...(managedSectorId && { managedSectorId }),
          },
        });

        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(err.message);
      }
    }

    // Eliminar el archivo temporal (solo para CSV)
    if (fileExtension === 'csv') {
      fs.unlinkSync(req.file.path);
    }

    const totalProcessed = successCount + errorCount;

    res.status(200).json({ 
      message: 'Carga masiva completada',
      totalProcessed,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error en carga masiva de usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Controlador para carga masiva de usuarios (endpoint alternativo para Excel)
export const bulkUploadUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    // Verificar el tipo de archivo
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    let records = [];

    if (fileExtension === 'csv') {
      // Leer y procesar archivo CSV
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Leer y procesar archivo Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ error: 'Formato de archivo no soportado. Se aceptan archivos CSV, XLSX y XLS.' });
    }

    // Validar campos requeridos
    const requiredFields = ['email', 'name', 'password'];
    const missingFields = requiredFields.filter(field => !Object.keys(records[0] || {}).includes(field));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Campos requeridos faltantes: ${missingFields.join(', ')}` });
    }

    // Contadores
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Procesar cada línea
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const lineNumber = index + 2; // +1 por el encabezado, +1 para empezar desde la línea 2

      try {
        // Validar campos requeridos
        if (!record.email || !record.name || !record.password) {
          throw new Error(`Línea ${lineNumber}: Los campos email, name y password son requeridos`);
        }

        // Validar rol
        const validRoles = ['EMPLOYEE', 'MANAGER', 'HR'];
        const role = record.role ? record.role.toString().toUpperCase() : 'EMPLOYEE';
        if (!validRoles.includes(role)) {
          throw new Error(`Línea ${lineNumber}: Rol inválido. Los roles válidos son: EMPLOYEE, MANAGER, HR`);
        }

        // Validar y obtener el sectorId
        let sectorId = null;
        let managedSectorId = null;

        if (role === 'HR') {
          // Los usuarios HR no deben tener un sector asignado
          if (record.sectorId) {
            console.log(`Advertencia línea ${lineNumber}: Los usuarios HR no deben tener un sector asignado, ignorando sector`);
          }
        } else if (record.sectorId) {
          // Buscar el sector en la base de datos
          const sector = await prisma.sector.findUnique({
            where: { id: record.sectorId.toString() }
          });

          if (!sector) {
            throw new Error(`Línea ${lineNumber}: Sector con ID ${record.sectorId} no encontrado`);
          }

          if (role === 'MANAGER') {
            // Si es MANAGER, el sectorId se convierte en managedSectorId
            // ¡PERO TAMBIÉN DEBE SER EL sectorId PARA QUE EL JEFE PERTENEZCA AL SECTOR!
            managedSectorId = sector.id;
            sectorId = sector.id; // El jefe también pertenece a su propio sector
          } else {
            // Si es EMPLOYEE, el sectorId permanece como sectorId
            sectorId = sector.id;
          }
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: record.email.toString() },
        });

        if (existingUser) {
          throw new Error(`Línea ${lineNumber}: Usuario con email ${record.email} ya existe`);
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(record.password.toString(), 10);

        // Crear nuevo usuario
        await prisma.user.create({
          data: {
            email: record.email.toString(),
            name: record.name.toString(),
            password: hashedPassword,
            role: role,
            ...(sectorId && { sectorId }),
            ...(managedSectorId && { managedSectorId }),
          },
        });

        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(err.message);
      }
    }

    // Eliminar el archivo temporal (solo para CSV)
    if (fileExtension === 'csv') {
      fs.unlinkSync(req.file.path);
    }

    const totalProcessed = successCount + errorCount;

    res.status(200).json({ 
      message: 'Carga masiva completada',
      totalProcessed,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error en carga masiva de usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};