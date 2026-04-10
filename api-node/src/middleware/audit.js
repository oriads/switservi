const { pool } = require('../config/database');

/**
 * Middleware de Auditoría
 * Registra TODAS las acciones: crear, modificar, eliminar, descargar
 * Guarda: Quién, Qué, Cuándo, IP, User-Agent
 */

function auditLog(action, entityType = null, entityId = null, details = null) {
  return (req, res, next) => {
    // Guardar el método original de res.json
    const originalJson = res.json;

    res.json = function (data) {
      // Solo loguear acciones exitosas
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      if (isSuccess && action) {
        // Extraer IP real
        const ip = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        const ipStr = typeof ip === 'string' ? ip.split(',')[0].trim() : ip;

        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : 'anonymous';

        const logDetails = {
          ...(details || {}),
          ...(data && data.data ? { result: 'success' } : {}),
          method: req.method,
          path: req.originalUrl || req.url,
        };

        // Fire and forget - no bloqueante
        pool.query(
          `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            username,
            action,
            entityType,
            entityId,
            JSON.stringify(logDetails),
            ipStr,
            req.headers['user-agent'] || '',
          ]
        ).catch(err => {
          console.error('Error en audit log:', err.message);
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Middleware para loguear descargas de reportes
 */
function auditDownload(reportType) {
  return async (req, res, next) => {
    const userId = req.user ? req.user.id : null;
    const username = req.user ? req.user.username : 'anonymous';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipStr = typeof ip === 'string' ? ip.split(',')[0].trim() : ip;

    pool.query(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        username,
        'download_report',
        reportType,
        JSON.stringify({ filters: req.query }),
        ipStr,
        req.headers['user-agent'] || '',
      ]
    ).catch(err => console.error('Error en audit log:', err.message));

    next();
  };
}

/**
 * Obtener logs de auditoría (para admin)
 */
async function getAuditLogs(req, res) {
  try {
    const { page = 1, limit = 50, action, entityType, userId } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];
    let idx = 1;

    if (action) {
      where.push(`action = $${idx}`);
      params.push(action);
      idx++;
    }
    if (entityType) {
      where.push(`entity_type = $${idx}`);
      params.push(entityType);
      idx++;
    }
    if (userId) {
      where.push(`user_id = $${idx}`);
      params.push(userId);
      idx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT al.*, u.full_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs al ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error obteniendo audit logs:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

module.exports = {
  auditLog,
  auditDownload,
  getAuditLogs,
};
