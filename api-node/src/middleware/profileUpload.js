const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Configuración de Multer para fotos de perfil
 * - Solo permite imágenes JPG, JPEG, PNG
 * - Tamaño máximo: 5MB
 * - Nombres únicos con UUID
 */

// Directorio de almacenamiento
const PROFILE_PHOTOS_DIR = path.join(__dirname, '../../profile-photos');

// Crear directorio si no existe
if (!fs.existsSync(PROFILE_PHOTOS_DIR)) {
  fs.mkdirSync(PROFILE_PHOTOS_DIR, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PROFILE_PHOTOS_DIR);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: user-{userId}-{uuid}.{ext}
    const userId = req.user?.id || 'anonymous';
    const uniqueName = `user-${userId}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
  // Extensiones permitidas
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // MIME types permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF, WEBP)'), false);
  }
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('El tipo de archivo no es una imagen válida'), false);
  }
  
  cb(null, true);
};

// Configuración de Multer
const uploadProfilePhoto = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

/**
 * Middleware para eliminar fotos de perfil antiguas
 */
function deleteOldPhoto(photoPath) {
  if (!photoPath) return;
  
  // Ruta completa relativa al directorio de perfil
  const fullPath = path.join(PROFILE_PHOTOS_DIR, path.basename(photoPath));
  
  // Solo eliminar si está dentro del directorio de perfil
  if (fullPath.startsWith(PROFILE_PHOTOS_DIR) && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (error) {
      console.error('Error eliminando foto antigua:', error.message);
    }
  }
}

module.exports = {
  uploadProfilePhoto,
  deleteOldPhoto,
  PROFILE_PHOTOS_DIR,
};
