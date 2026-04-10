const { body, query, param, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Validadores para crear/actualizar cambio
const validateChange = [
  body('titulo')
    .trim()
    .notEmpty()
    .withMessage('El título es obligatorio')
    .isLength({ max: 200 })
    .withMessage('El título no puede exceder 200 caracteres'),

  body('tipo')
    .isIn(['Proyecto', 'Requerimiento', 'Incidencia'])
    .withMessage('Tipo debe ser: Proyecto, Requerimiento o Incidencia'),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('La descripción no puede exceder 5000 caracteres'),

  body('solicitante')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El solicitante no puede exceder 100 caracteres'),

  body('ambiente')
    .optional()
    .isIn(['QA', 'PRD', 'DEV', 'STG'])
    .withMessage('Ambiente debe ser: QA, PRD, DEV o STG'),

  body('savf_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre SAVF no puede exceder 100 caracteres'),

  body('implementador')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El implementador no puede exceder 100 caracteres'),

  body('efectivo')
    .optional()
    .isBoolean()
    .withMessage('Efectivo debe ser un booleano'),

  body('novedades')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Las novedades no pueden exceder 2000 caracteres'),

  handleValidationErrors,
];

// Validadores de búsqueda
const validateSearch = [
  query('titulo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('El título debe tener entre 2 y 200 caracteres'),

  query('savf')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El SAVF debe tener entre 2 y 100 caracteres'),

  handleValidationErrors,
];

// Validador de ID
const validateId = [
  param('id')
    .isUUID()
    .withMessage('ID debe ser un UUID válido'),

  handleValidationErrors,
];

module.exports = {
  validateChange,
  validateSearch,
  validateId,
};
