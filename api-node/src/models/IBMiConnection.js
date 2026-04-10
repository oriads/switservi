const { pool } = require('../config/database');
const { encrypt, decrypt } = require('../services/encryption');

class IBMiConnection {
  /**
   * Crear una nueva conexión IBM i
   */
  static async create(data) {
    const {
      user_id,
      connection_name,
      host,
      port = 446,
      username,
      password,
      library = 'QGPL',
      is_default = false,
    } = data;

    // Cifrar la contraseña
    const passwordEncrypted = encrypt(password);

    // Si es default, desmarcar otras conexiones default del usuario
    if (is_default) {
      await pool.query(
        'UPDATE ibmi_connections SET is_default = false WHERE user_id = $1',
        [user_id]
      );
    }

    const result = await pool.query(
      `INSERT INTO ibmi_connections 
       (user_id, connection_name, host, port, username, password_encrypted, library, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, connection_name, host, port, username, library, 
                 is_active, is_default, created_at`,
      [user_id, connection_name, host, port, username, passwordEncrypted, library, is_default]
    );

    return result.rows[0];
  }

  /**
   * Obtener todas las conexiones de un usuario
   */
  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT id, connection_name, host, port, username, library,
              is_active, is_default, last_tested, last_status, created_at
       FROM ibmi_connections
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Obtener conexión por ID (y verificar que pertenezca al usuario)
   */
  static async findById(id, userId) {
    const result = await pool.query(
      `SELECT id, user_id, connection_name, host, port, username, library,
              is_active, is_default, last_tested, last_status, created_at
       FROM ibmi_connections
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    return result.rows[0];
  }

  /**
   * Obtener contraseña descifrada (solo para uso interno del sistema)
   */
  static async getDecryptedPassword(id, userId) {
    const result = await pool.query(
      `SELECT password_encrypted FROM ibmi_connections
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Conexión no encontrada');
    }

    return decrypt(result.rows[0].password_encrypted);
  }

  /**
   * Actualizar conexión
   */
  static async update(id, userId, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    // Si se proporciona nueva contraseña, cifrarla
    if (data.password) {
      fields.push(`password_encrypted = $${idx}`);
      values.push(encrypt(data.password));
      idx++;
    }

    // Otros campos
    const allowedFields = ['connection_name', 'host', 'port', 'username', 'library', 'is_active', 'is_default'];
    
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

    // Si se establece como default, desmarcar las demás
    if (data.is_default) {
      await pool.query(
        'UPDATE ibmi_connections SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, id]
      );
    }

    values.push(id, userId);
    const result = await pool.query(
      `UPDATE ibmi_connections SET ${fields.join(', ')} 
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING id, connection_name, host, port, username, library,
                 is_active, is_default, last_tested, last_status, updated_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Registrar resultado de prueba de conexión
   */
  static async recordTestResult(id, userId, success, message) {
    await pool.query(
      `UPDATE ibmi_connections 
       SET last_tested = CURRENT_TIMESTAMP, 
           last_status = $1
       WHERE id = $2 AND user_id = $3`,
      [success ? 'success' : `failed: ${message}`, id, userId]
    );
  }

  /**
   * Eliminar conexión
   */
  static async delete(id, userId) {
    const result = await pool.query(
      `DELETE FROM ibmi_connections WHERE id = $1 AND user_id = $2
       RETURNING id, connection_name`,
      [id, userId]
    );

    return result.rows[0];
  }

  /**
   * Probar conexión (simulado - en producción usaría ODBC real)
   */
  static async testConnection(data) {
    const { host, port = 446, username, password } = data;

    // Validar campos requeridos
    if (!host || !username || !password) {
      return {
        success: false,
        message: 'Host, usuario y contraseña son requeridos',
      };
    }

    try {
      // En producción: intentar conexión ODBC real al IBM i
      // Por ahora: simulamos la prueba
      
      const net = require('net');
      
      return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(5000); // 5 segundos timeout
        
        socket.on('connect', () => {
          socket.destroy();
          resolve({
            success: true,
            message: `Conexión exitosa a ${host}:${port}`,
            host,
            port,
            username,
          });
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          resolve({
            success: false,
            message: 'Timeout: No se pudo conectar en 5 segundos',
          });
        });
        
        socket.on('error', (err) => {
          resolve({
            success: false,
            message: `Error de conexión: ${err.message}`,
          });
        });
        
        socket.connect(port, host);
      });
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }
}

module.exports = IBMiConnection;
