import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Configuración de Cloudflare R2
const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

// Crear cliente S3 compatible con Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Subir un archivo a Cloudflare R2
 * @param {Buffer|Stream|Object} fileBuffer - Contenido del archivo o req.file
 * @param {string} fileName - Nombre original del archivo
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {Promise<string>} URL pública del archivo
 */
export const uploadFileToR2 = async (fileBuffer, fileName, mimeType) => {
  try {
    // Validar que fileBuffer no sea undefined o null
    if (!fileBuffer) {
      throw new Error('El archivo proporcionado es nulo o indefinido');
    }
    
    let buffer, name, type;
    if (fileBuffer.buffer) {
      // Caso: se pasó req.file completo
      buffer = fileBuffer.buffer;
      name = fileName || fileBuffer.originalname || `file-${Date.now()}`;
      type = mimeType || fileBuffer.mimetype || 'application/octet-stream';
    } else {
      // Caso: se pasaron los parámetros por separado
      buffer = fileBuffer;
      name = fileName || `file-${Date.now()}`;
      type = mimeType || 'application/octet-stream';
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
    
    // Generar un nombre único para el archivo
    const uniqueFileName = `${uuidv4()}-${name}`;
    
    // Parámetros para subir el archivo
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: compatibleBuffer,
      ContentType: type,
    };

    // Subir el archivo usando Upload para evitar el error de Stream de longitud desconocida
    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await upload.done();

    // Generar URL firmada válida por 24 horas
    const getObjectParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
    };
    
    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), {
      expiresIn: 86400, // 24 horas
    });

    return {
      fileName: uniqueFileName,
      url: signedUrl,
      publicUrl: `https://${BUCKET_NAME}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueFileName}`
    };
  } catch (error) {
    console.error('Error al subir archivo a Cloudflare R2:', error);
    throw new Error('Error al subir archivo a Cloudflare R2');
  }
};

/**
 * Generar URL firmada para descargar un archivo
 * @param {string} fileName - Nombre del archivo en R2
 * @param {number} expiresIn - Segundos de validez de la URL (por defecto 1 hora)
 * @returns {Promise<string>} URL firmada para descargar el archivo
 */
export const getSignedDownloadUrl = async (fileName, expiresIn = 3600) => {
  try {
    const getObjectParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
    };
    
    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error('Error al generar URL firmada para descarga:', error);
    throw new Error('Error al generar URL para descarga del archivo');
  }
};

/**
 * Eliminar un archivo de Cloudflare R2
 * @param {string} fileName - Nombre del archivo en R2
 * @returns {Promise<void>}
 */
export const deleteFileFromR2 = async (fileName) => {
  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
  } catch (error) {
    console.error('Error al eliminar archivo de Cloudflare R2:', error);
    throw new Error('Error al eliminar archivo de Cloudflare R2');
  }
};

export default {
  uploadFileToR2,
  getSignedDownloadUrl,
  deleteFileFromR2
};