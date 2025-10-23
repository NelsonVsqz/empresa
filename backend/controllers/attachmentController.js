import { PrismaClient } from '@prisma/client';
import { uploadFileToR2, generateSignedUrlForAttachment } from '../utils/fileUploadUtils.js';

const prisma = new PrismaClient();

// Subir un adjunto para una solicitud de permiso
export const uploadAttachment = async (req, res) => {
  try {
    // Verificar si hay un archivo en la solicitud
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }

    // Obtener el ID de la solicitud de permiso del cuerpo de la solicitud
    const { permissionRequestId } = req.body;

    // Verificar si se proporcionó el ID de la solicitud
    if (!permissionRequestId) {
      return res.status(400).json({ error: 'ID de solicitud de permiso requerido' });
    }

    // Verificar si el usuario es el propietario de la solicitud o tiene permisos de RRHH/jefe de sector
    const permissionRequest = await prisma.permissionRequest.findUnique({
      where: { id: permissionRequestId },
      include: { user: true }
    });

    if (!permissionRequest) {
      return res.status(404).json({ error: 'Solicitud de permiso no encontrada' });
    }

    // Verificar autorización: propietario, RRHH o jefe de sector
    if (
      req.userRole !== 'HR' &&
      req.userRole !== 'MANAGER' &&
      permissionRequest.userId !== req.userId
    ) {
      return res.status(403).json({ error: 'No autorizado para subir adjuntos a esta solicitud' });
    }

    // Si es jefe de sector, solo puede subir adjuntos a solicitudes de su sector
    if (req.userRole === 'MANAGER' && permissionRequest.sectorId !== req.userSectorId) {
      return res.status(403).json({ error: 'No autorizado para subir adjuntos a solicitudes de otros sectores' });
    }

    // Subir archivo a Cloudflare R2
    const fileResult = await uploadFileToR2(
      req.file.buffer, 
      req.file.originalname, 
      req.file.mimetype
    );

    // Guardar el adjunto en la base de datos
    const attachment = await prisma.attachment.create({
      data: {
        fileName: fileResult.key, // Usar el nombre de archivo generado como clave en Cloudflare R2
        url: fileResult.publicUrl,
        permissionRequestId: permissionRequestId,
        uploadedById: req.userId
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Adjunto subido exitosamente',
      attachment
    });
  } catch (error) {
    console.error('Error al subir adjunto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los adjuntos de una solicitud de permiso
export const getAttachmentsByPermissionRequest = async (req, res) => {
  try {
    const { permissionRequestId } = req.params;

    // Verificar si la solicitud de permiso existe
    const permissionRequest = await prisma.permissionRequest.findUnique({
      where: { id: permissionRequestId },
      include: { user: true }
    });

    if (!permissionRequest) {
      return res.status(404).json({ error: 'Solicitud de permiso no encontrada' });
    }

    // Verificar autorización: propietario, RRHH o jefe de sector
    if (
      req.userRole !== 'HR' &&
      req.userRole !== 'MANAGER' &&
      permissionRequest.userId !== req.userId
    ) {
      return res.status(403).json({ error: 'No autorizado para ver adjuntos de esta solicitud' });
    }

    // Si es jefe de sector, solo puede ver adjuntos de solicitudes de su sector
    if (req.userRole === 'MANAGER' && permissionRequest.sectorId !== req.userSectorId) {
      return res.status(403).json({ error: 'No autorizado para ver adjuntos de solicitudes de otros sectores' });
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        permissionRequestId: permissionRequestId
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({ attachments });
  } catch (error) {
    console.error('Error al obtener adjuntos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar un adjunto
export const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información del adjunto
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        permissionRequest: {
          include: { user: true }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Adjunto no encontrado' });
    }

    // Verificar autorización: propietario de la solicitud, RRHH, jefe de sector o quien subió el archivo
    if (
      req.userRole !== 'HR' &&
      req.userRole !== 'MANAGER' &&
      attachment.permissionRequest.userId !== req.userId &&
      attachment.uploadedById !== req.userId
    ) {
      return res.status(403).json({ error: 'No autorizado para eliminar este adjunto' });
    }

    // Si es jefe de sector, solo puede eliminar adjuntos de solicitudes de su sector
    if (
      req.userRole === 'MANAGER' &&
      attachment.permissionRequest.sectorId !== req.userSectorId
    ) {
      return res.status(403).json({ error: 'No autorizado para eliminar adjuntos de solicitudes de otros sectores' });
    }

    // Eliminar el adjunto de la base de datos
    await prisma.attachment.delete({
      where: { id }
    });

    res.json({ message: 'Adjunto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar adjunto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Controlador para obtener una URL firmada para un adjunto
export const getSignedAttachmentUrl = async (req, res) => {
  try {
    const { id: attachmentId } = req.params;
    const userId = req.userId; // Obtenido del middleware de autenticación
    const userRole = req.userRole;

    console.log('Solicitud para adjunto ID:', attachmentId);

    if (!attachmentId) {
      return res.status(400).json({ error: 'ID de adjunto es requerido' });
    }

    // Verificar si el adjunto existe
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        permissionRequest: {
          include: {
            user: true // para verificar el propietario de la solicitud
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Adjunto no encontrado' });
    }

    console.log('Adjunto encontrado:', attachment);

    // Verificar autorización: propietario, RRHH o jefe de sector
    if (
      userRole !== 'HR' && 
      userRole !== 'MANAGER' && 
      attachment.permissionRequest.userId !== userId
    ) {
      return res.status(403).json({ error: 'No autorizado para acceder a este adjunto' });
    }

    // Si es jefe de sector, solo puede acceder a adjuntos de solicitudes de su sector
    if (userRole === 'MANAGER' && attachment.permissionRequest.sectorId !== req.userSectorId) {
      return res.status(403).json({ error: 'No autorizado para acceder a adjuntos de solicitudes de otros sectores' });
    }

    // Verificar que el fileName exista, si es null intentar extraerlo de la URL
    let fileName = attachment.fileName;
    if (!fileName) {
      // Intentar extraer el nombre del archivo de la URL
      try {
        const url = new URL(attachment.url);
        const pathname = url.pathname;
        // Extraer el último segmento de la ruta como nombre de archivo
        const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
        if (pathSegments.length > 0) {
          fileName = pathSegments[pathSegments.length - 1];
          console.log('Nombre de archivo extraído de la URL:', fileName);
        }
      } catch (urlError) {
        console.error('Error al extraer nombre de archivo de la URL:', urlError);
      }
      
      // Si aún no tenemos fileName, usar un nombre predeterminado
      if (!fileName) {
        console.error('No se pudo obtener el nombre de archivo para el adjunto:', attachment);
        fileName = 'archivo_adjunto';
      }
    }
    
    // Aseguramos que el fileName esté correctamente formateado para Cloudflare R2
    // En el caso de archivos subidos desde frontend, puede no incluir "permisos/" si se guardó solo el nombre
    if (!fileName.startsWith('permisos/')) {
      fileName = `permisos/${fileName}`;
    }

    // Generar URL firmada para el archivo
    const signedUrl = await generateSignedUrlForAttachment(fileName);

    res.json({ 
      signedUrl,
      fileName: fileName,
      originalFileName: fileName
    });
  } catch (error) {
    console.error('Error al generar URL firmada para adjunto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};