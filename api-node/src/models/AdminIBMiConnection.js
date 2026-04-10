const { pool } = require('../config/database');
const { encrypt, decrypt } = require('../services/encryption');

/**
 * Modelo para conexiones IBM i de administración
 * Las contraseñas se cifran con AES-256-GCM
 */
class AdminIBMiConnection {
  /**
   * Crear una nueva conexión IBM i
   */
  static async create(data) {
    const {
      connection_name,
      environment,
      host,
      port = 446,
      ibmi_user,
      ibmi_password,
      library = 'QGPL',
      description,
      created_by,
    } = data;

    // Cifrar contraseña
    const passwordEncrypted = ibmi_password ? encrypt(ibmi_password) : null;

    const result = await pool.query(
      `INSERT INTO ibmi_connections 
       (connection_name, environment, host, port, ibmi_user, ibmi_password_encrypted, 
        library, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, connection_name, environment, host, port, ibmi_user, 
                 library, description, is_active, created_at`,
      [connection_name, environment, host, port, ibmi_user, passwordEncrypted, 
       library, description, created_by]
    );

    return result.rows[0];
  }

  /**
   * Obtener todas las conexiones (paginado)
   */
  static async findAll({ page = 1, limit = 20, filtro = '' } = {}) {
    const offset = (page - 1) * limit;
    const searchFilter = `%${filtro}%`;

    const result = await pool.query(
      `SELECT c.id, c.connection_name, c.environment, c.host, c.port, 
              c.ibmi_user, c.library, c.description, c.is_active, 
              c.created_at, c.updated_at,
              u.username as created_by_name
       FROM ibmi_connections c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.connection_name ILIKE $1 OR c.host ILIKE $1 OR c.description ILIKE $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchFilter, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ibmi_connections c
       WHERE c.connection_name ILIKE $1 OR c.host ILIKE $1 OR c.description ILIKE $1`,
      [searchFilter]
    );

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    };
  }

  /**
   * Obtener conexión por ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT c.*, u.username as created_by_name
       FROM ibmi_connections c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Obtener contraseña descifrada
   */
  static async getDecryptedPassword(id) {
    const result = await pool.query(
      `SELECT ibmi_password_encrypted FROM ibmi_connections WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].ibmi_password_encrypted) {
      return null;
    }

    return decrypt(result.rows[0].ibmi_password_encrypted);
  }

  /**
   * Actualizar conexión
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    // Si se proporciona nueva contraseña
    if (data.ibmi_password) {
      fields.push(`ibmi_password_encrypted = $${idx}`);
      values.push(encrypt(data.ibmi_password));
      idx++;
    }

    // Otros campos
    const allowedFields = ['connection_name', 'environment', 'host', 'port', 
                           'ibmi_user', 'library', 'description', 'is_active'];
    
    allowedFields.forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE ibmi_connections SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, connection_name, environment, host, port, ibmi_user, 
                 library, description, is_active, updated_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Probar conexión vía Telnet (simulado con socket TCP)
   */
  static async testTelnetConnection(host, port = 446) {
    const net = require('net');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve({
            success: false,
            message: `Timeout: No se pudo conectar a ${host}:${port} en 10 segundos`,
            host,
            port,
            responseTime: 10000,
            details: 'El servidor no respondió en el tiempo esperado',
          });
        }
      }, 10000);

      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const responseTime = Date.now() - startTime;
          socket.destroy();
          resolve({
            success: true,
            message: `✅ Conexión exitosa a ${host}:${port} (${responseTime}ms)`,
            host,
            port,
            responseTime,
            details: 'Puerto accesible. El servicio IBM i está respondiendo.',
          });
        }
      });

      socket.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const responseTime = Date.now() - startTime;
          resolve({
            success: false,
            message: `❌ Error de conexión: ${err.message}`,
            host,
            port,
            responseTime,
            details: `Código: ${err.code}`,
          });
        }
      });

      socket.connect(parseInt(port), host);
    });
  }

  /**
   * Eliminar conexión
   */
  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM ibmi_connections WHERE id = $1
       RETURNING id, connection_name`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Obtener conexiones por ambiente
   */
  static async findByEnvironment(environment) {
    const result = await pool.query(
      `SELECT id, connection_name, environment, host, port, ibmi_user,
              library, description, is_active, created_at
       FROM ibmi_connections
       WHERE environment = $1 AND is_active = true
       ORDER BY connection_name`,
      [environment]
    );

    return result.rows;
  }
}

module.exports = AdminIBMiConnection;
