const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { uploadEvidencias } = require('../middleware/upload');
const config = require('../config/app');

const router = Router();

// Subir evidencias
router.post('/upload', uploadEvidencias, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se seleccionaron archivos',
      });
    }

    const files = req.files.map((file) => ({
      originalName: file.originalname,
      storedName: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.status(201).json({
      success: true,
      message: `${files.length} archivo(s) subidos correctamente`,
      files: files,
    });
  } catch (error) {
    console.error('Error subiendo evidencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno subiendo archivos',
    });
  }
});

// Listar evidencias de un cambio
router.get('/:changeId', (req, res) => {
  try {
    const { changeId } = req.params;
    const baseDir = config.evidenciasDir;

    // Buscar en todos los directorios de fecha
    const evidencias = [];

    if (!fs.existsSync(baseDir)) {
      return res.json({
        success: true,
        data: [],
        message: 'No hay evidencias cargadas',
      });
    }

    // Recorrer directorios de fecha
    const dateDirs = fs.readdirSync(baseDir).filter((d) =>
      fs.statSync(path.join(baseDir, d)).isDirectory()
    );

    dateDirs.forEach((dateDir) => {
      const changeDir = path.join(baseDir, dateDir, changeId);

      if (fs.existsSync(changeDir)) {
        const files = fs.readdirSync(changeDir).map((file) => {
          const filePath = path.join(changeDir, file);
          const stats = fs.statSync(filePath);

          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            path: filePath,
          };
        });

        evidencias.push(...files);
      }
    });

    res.json({
      success: true,
      data: evidencias,
      count: evidencias.length,
    });
  } catch (error) {
    console.error('Error listando evidencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno consultando evidencias',
    });
  }
});

module.exports = router;
