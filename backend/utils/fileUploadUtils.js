// utils/fileUploadUtils.js - Utilidades para la gestión de archivos con Cloudflare R2

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configurar cliente de S3 para Cloudflare R2
const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

const s3Client = new S3Client({
  region: 'auto', // Cloudflare R2 no requiere región específica
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

// Función para generar un nombre único para el archivo
export const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const fileName = `${uuidv4()}${ext}`;
  return fileName;
};

// Función para subir archivo a Cloudflare R2
export const uploadFileToR2 = async (fileBuffer, fileName = null, contentType = null) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('Nombre de bucket de R2 no configurado');
    }

    // Validar que fileBuffer no sea undefined
    if (!fileBuffer) {
      throw new Error('El archivo proporcionado es nulo o indefinido');
    }

    // Si se pasa un objeto de archivo (como req.file), extraer los datos necesarios
    let buffer, name, type;
    if (fileBuffer.buffer) {
      // Caso: se pasó req.file completo
      buffer = fileBuffer.buffer;
      name = fileBuffer.originalname || fileName || `file-${Date.now()}`;
      type = fileBuffer.mimetype || contentType || 'application/octet-stream';
    } else {
      // Caso: se pasaron los parámetros por separado
      buffer = fileBuffer;
      name = fileName || `file-${Date.now()}`;
      type = contentType || 'application/octet-stream';
    }
    
    // Asegurarse de que el buffer no sea indefinido
    if (!buffer) {
      throw new Error('El contenido del archivo no está disponible');
    }

    // Asegurarse de que el buffer sea un tipo compatible (Buffer, Uint8Array, etc.)
    let compatibleBuffer;
    if (Buffer.isBuffer(buffer)) {
      compatibleBuffer = buffer;
    } else if (buffer instanceof Uint8Array) {
      compatibleBuffer = Buffer.from(buffer);
    } else {
      // Si no es un buffer reconocible, intentamos convertirlo
      compatibleBuffer = Buffer.from(buffer);
    }

    // Generar un nombre único para el archivo en Cloudflare R2
    const uniqueFileName = generateFileName(name);

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: compatibleBuffer,
      ContentType: type,
    };

    // Usar Upload en lugar de PutObjectCommand para evitar el error de Stream de longitud desconocida
    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await upload.done();

    // Devolver un objeto con la URL pública del archivo
    const publicUrl = `https://${BUCKET_NAME}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueFileName}`;
    return {
      publicUrl,
      key: uniqueFileName
    };
  } catch (error) {
    console.error('Error al subir archivo a R2:', error);
    throw error;
  }
};

// Función para generar URL firmada para acceso a archivos
export const generateSignedUrlForAttachment = async (fileName) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('Nombre de bucket de R2 no configurado');
    }

    // Decodificar el nombre del archivo en caso de que esté codificado
    let decodedFileName = fileName;
    try {
      decodedFileName = decodeURIComponent(fileName);
    } catch (decodeError) {
      console.warn('No se pudo decodificar el nombre del archivo:', fileName);
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: decodedFileName, // Usar el nombre decodificado
    });

    // Generar una URL firmada que expire en 1 hora
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hora
    return signedUrl;
  } catch (error) {
    console.error('Error al generar URL firmada para adjunto:', error);
    throw error;
  }
};

// Función para eliminar archivo de Cloudflare R2
export const deleteFileFromR2 = async (fileName) => {
  // Esta función se implementaría si necesitamos eliminar archivos
  // Por ahora solo lo dejamos como placeholder
  console.warn(`Función para eliminar archivo ${fileName} no implementada aún`);
};