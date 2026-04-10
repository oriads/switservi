const { pool } = require('../config/database');

class Change {
  // Crear un nuevo registro de cambio con SAVFs múltiples
  static async create(data) {
    const {
      titulo,
      tipo,
      descripcion,
      solicitante,
      ambiente,
      savf_name,
      implementador,
      fecha_implementacion,
      metadata,
      savfs, // Array de SAVFs
    } = data;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO changes (
          titulo, tipo, descripcion, solicitante, ambiente,
          savf_name, implementador, fecha_implementacion, metadata,
          estado, efectivo, novedades
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        titulo,
        tipo,
        descripcion,
        solicitante,
        ambiente || 'QA',
        savf_name,
        implementador,
        fecha_implementacion || new Date(),
        metadata ? JSON.stringify(metadata) : null,
        'pendiente',
        false,
        null,
      ];

      const result = await client.query(query, values);
      const changeId = result.rows[0].id;

      // Insertar SAVFs múltiples si existen
      if (savfs && Array.isArray(savfs) && savfs.length > 0) {
        for (const savf of savfs) {
          await client.query(
            `INSERT INTO savf_list (change_id, savf_name, savf_library, description)
             VALUES ($1, $2, $3, $4)`,
            [changeId, savf.name, savf.library || 'QGPL', savf.description || null]
          );
        }
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener todos los cambios con paginación
  static async findAll({ page = 1, limit = 20, filtro = '' } = {}) {
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM changes
      WHERE titulo ILIKE $1 OR savf_name ILIKE $1 OR solicitante ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const searchFilter = `%${filtro}%`;
    const result = await pool.query(query, [searchFilter, limit, offset]);

    // Obtener total
    const countQuery = `
      SELECT COUNT(*) FROM changes
      WHERE titulo ILIKE $1 OR savf_name ILIKE $1 OR solicitante ILIKE $1
    `;
    const countResult = await pool.query(countQuery, [searchFilter]);

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

  // Obtener cambio por ID
  static async findById(id) {
    const query = 'SELECT * FROM changes WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Actualizar cambio
  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    // Construir query dinámicamente
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        if (key === 'metadata' && typeof data[key] === 'object') {
          values.push(JSON.stringify(data[key]));
        } else {
          values.push(data[key]);
        }
        idx++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);
    const query = `UPDATE changes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Eliminar cambio
  static async delete(id) {
    const query = 'DELETE FROM changes WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Buscar por nombre de requerimiento
  static async searchByTitulo(titulo) {
    const query = `
      SELECT * FROM changes
      WHERE titulo ILIKE $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [`%${titulo}%`]);
    return result.rows;
  }

  // Buscar por SAVF
  static async searchBySAVF(savfName) {
    const query = `
      SELECT * FROM changes
      WHERE savf_name ILIKE $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [`%${savfName}%`]);
    return result.rows;
  }
}

module.exports = Change;
