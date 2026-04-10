const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Middleware de autenticación JWT
 * Verifica el token y adjunta el usuario al request
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-production');
    
    // Verificar que el usuario existe y está activo
    const result = await pool.query(
      'SELECT id, username, email, role, is_active, dark_mode FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Usuario desactivado',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        error: 'Token expirado',
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Token inválido',
    });
  }
}

/**
 * Middleware de autorización por rol
 * @param  {...string} roles - Roles permitidos (ej: 'admin', 'user')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
}

/**
 * Middleware opcional: intenta autenticar pero no falla si no hay token
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-production');
    const result = await pool.query(
      'SELECT id, username, email, role, is_active, dark_mode FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].is_active) {
      req.user = result.rows[0];
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
}

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth,
};
