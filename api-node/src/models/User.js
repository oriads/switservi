const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Crear un nuevo usuario
   */
  static async create(data) {
    const {
      username,
      email,
      password,
      full_name,
      role = 'user',
      dark_mode = false,
      language = 'es',
    } = data;

    // Validar que el username no exista
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    // Validar que el email no exista
    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      throw new Error('El correo electrónico ya está registrado');
    }

    // Hashear contraseña con bcrypt (10 rondas)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, dark_mode, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, full_name, role, dark_mode, language, is_active, created_at`,
      [username, email, passwordHash, full_name, role, dark_mode, language]
    );

    return result.rows[0];
  }

  /**
   * Obtener todos los usuarios (paginado)
   */
  static async findAll({ page = 1, limit = 20, filtro = '' } = {}) {
    const offset = (page - 1) * limit;
    const searchFilter = `%${filtro}%`;

    const result = await pool.query(
      `SELECT id, username, email, full_name, role, profile_photo, 
              dark_mode, language, is_active, last_login, created_at
       FROM users
       WHERE username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchFilter, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users
       WHERE username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1`,
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
   * Obtener usuario por ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, username, email, full_name, role, profile_photo,
              dark_mode, language, is_active, last_login, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Obtener usuario por username o email (para login)
   */
  static async findByLogin(identifier) {
    const result = await pool.query(
      `SELECT id, username, email, password_hash, full_name, role, 
              profile_photo, dark_mode, language, is_active
       FROM users
       WHERE (username = $1 OR email = $1) AND is_active = true`,
      [identifier]
    );

    return result.rows[0];
  }

  /**
   * Actualizar usuario
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && key !== 'password') {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    });

    // Si se proporciona nueva contraseña
    if (data.password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);
      fields.push(`password_hash = $${idx}`);
      values.push(passwordHash);
      idx++;
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, username, email, full_name, role, profile_photo, dark_mode, language, is_active, updated_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Actualizar solo foto de perfil
   */
  static async updateProfilePhoto(id, photoPath) {
    const result = await pool.query(
      `UPDATE users SET profile_photo = $1 WHERE id = $2
       RETURNING id, username, profile_photo`,
      [photoPath, id]
    );

    return result.rows[0];
  }

  /**
   * Eliminar (desactivar) usuario
   */
  static async deactivate(id) {
    const result = await pool.query(
      `UPDATE users SET is_active = false WHERE id = $1
       RETURNING id, username`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Eliminar permanentemente
   */
  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, username`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Verificar contraseña
   */
  static async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  }

  /**
   * Registrar último login
   */
  static async recordLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }
}

module.exports = User;
