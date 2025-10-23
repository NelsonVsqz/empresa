import multer from 'multer';

// Configurar almacenamiento en memoria para multer (solo para la carga de archivos Excel)
const storage = multer.memoryStorage();

// Configurar filtro de archivos
const fileFilter = (req, file, cb) => {
  // Permitir solo archivos CSV y Excel
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.endsWith('.csv') ||
    file.originalname.endsWith('.xlsx') ||
    file.originalname.endsWith('.xls')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos CSV, XLSX y XLS.'), false);
  }
};

// Crear middleware de carga
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

export default upload;