const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/app');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Organizar archivos por fecha y ID de cambio
    const { changeId } = req.body || {};
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const folder = changeId || 'sin-asignar';

    const uploadPath = path.join(config.evidenciasDir, date, folder);

    // Crear directorios si no existen
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (config.allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de archivo no permitido: ${ext}. Permitidos: ${config.allowedFileTypes.join(', ')}`
      ),
      false
    );
  }
};

// Middleware de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter: fileFilter,
});

// Manejo de errores de multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `Archivo demasiado grande. Máximo: ${config.maxFileSize / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({
      success: false,
      error: `Error de subida: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next();
};

// Middleware para subir múltiples archivos
const uploadEvidencias = (req, res, next) => {
  upload.array('evidencias', 10)(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
};

module.exports = {
  uploadEvidencias,
};
