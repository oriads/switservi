const jwt = require('jsonwebtoken');
const User = require('../models/User');
const IBMiConnection = require('../models/IBMiConnection');
const AdminIBMiConnection = require('../models/AdminIBMiConnection');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * Controller para módulo de administración
 * - Login/Registro
 * - CRUD de Usuarios (Admin)
 * - Gestión de conexiones IBM i
 * - Perfil de usuario
 */

// ============================================
// AUTH - Login y Registro
// ============================================

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos',
      });
    }

    const user = await User.findByLogin(identifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    const validPassword = await User.verifyPassword(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Registrar último login
    await User.recordLastLogin(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          profile_photo: user.profile_photo,
          dark_mode: user.dark_mode,
          language: user.language,
        },
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email y contraseña son requeridos',
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      full_name: full_name || username,
      role: 'user',
    });

    // Generar token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          dark_mode: user.dark_mode,
        },
      },
    });
  } catch (error) {
    if (error.message.includes('ya')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// ============================================
// CRUD USUARIOS (Solo Admin)
// ============================================

exports.getUsers = async (req, res) => {
  try {
    const { page, limit, filtro } = req.query;
    const result = await User.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      filtro: filtro || '',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error.message.includes('ya')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir cambiar contraseña vía este endpoint (usar changePassword)
    const { password, ...updateData } = req.body;
    
    const user = await User.update(id, updateData);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.deactivate(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuario desactivado correctamente',
    });
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.delete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado permanentemente',
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// ============================================
// PERFIL DE USUARIO
// ============================================

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { full_name, language } = req.body;

    const user = await User.update(req.user.id, {
      full_name,
      language,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva contraseña son requeridas',
      });
    }

    // Obtener usuario con hash
    const user = await User.findByLogin(req.user.username);

    const validPassword = await User.verifyPassword(currentPassword, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta',
      });
    }

    await User.update(req.user.id, { password: newPassword });

    res.json({
      success: true,
      message: 'Contraseña cambiada correctamente',
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo de imagen',
      });
    }

    // Guardar solo el nombre del archivo (no la ruta completa)
    const photoName = req.file.filename;

    // Eliminar foto anterior si existe
    const currentUser = await User.findById(req.user.id);
    if (currentUser.profile_photo) {
      const { deleteOldPhoto } = require('../middleware/profileUpload');
      deleteOldPhoto(currentUser.profile_photo);
    }

    await User.updateProfilePhoto(req.user.id, photoName);

    res.json({
      success: true,
      data: {
        profile_photo: photoName,
      },
      message: 'Foto de perfil actualizada correctamente',
    });
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.toggleDarkMode = async (req, res) => {
  try {
    const { dark_mode } = req.body;

    const user = await User.update(req.user.id, { dark_mode });

    res.json({
      success: true,
      data: {
        dark_mode: user.dark_mode,
      },
    });
  } catch (error) {
    console.error('Error actualizando modo oscuro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// ============================================
// CONEXIONES IBM i
// ============================================

exports.getConnections = async (req, res) => {
  try {
    const connections = await IBMiConnection.findByUserId(req.user.id);

    res.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    console.error('Error obteniendo conexiones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.createConnection = async (req, res) => {
  try {
    const connectionData = {
      ...req.body,
      user_id: req.user.id,
    };

    const connection = await IBMiConnection.create(connectionData);

    res.status(201).json({
      success: true,
      data: connection,
    });
  } catch (error) {
    console.error('Error creando conexión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.updateConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await IBMiConnection.update(id, req.user.id, req.body);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexión no encontrada',
      });
    }

    res.json({
      success: true,
      data: connection,
    });
  } catch (error) {
    console.error('Error actualizando conexión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await IBMiConnection.delete(id, req.user.id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexión no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Conexión eliminada correctamente',
    });
  } catch (error) {
    console.error('Error eliminando conexión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

exports.testConnection = async (req, res) => {
  try {
    const { host, port, username, password } = req.body;

    if (!host || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Host, usuario y contraseña son requeridos para probar la conexión',
      });
    }

    const result = await IBMiConnection.testConnection({
      host,
      port,
      username,
      password,
    });

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error probando conexión:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// ============================================
// CONEXIONES IBM i - ADMINISTRACIÓN (Solo Admin)
// ============================================

exports.getAdminIBMiConnections = async (req, res) => {
  try {
    const { page, limit, filtro } = req.query;
    const result = await AdminIBMiConnection.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      filtro: filtro || '',
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error obteniendo conexiones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

exports.createAdminIBMiConnection = async (req, res) => {
  try {
    const connection = await AdminIBMiConnection.create({
      ...req.body,
      created_by: req.user.id,
    });
    res.status(201).json({ success: true, data: connection });
  } catch (error) {
    console.error('Error creando conexión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

exports.updateAdminIBMiConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await AdminIBMiConnection.update(id, req.body);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Conexión no encontrada' });
    }
    res.json({ success: true, data: connection });
  } catch (error) {
    console.error('Error actualizando conexión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

exports.deleteAdminIBMiConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await AdminIBMiConnection.delete(id);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Conexión no encontrada' });
    }
    res.json({ success: true, message: 'Conexión eliminada' });
  } catch (error) {
    console.error('Error eliminando conexión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

exports.testAdminIBMiConnection = async (req, res) => {
  try {
    const { host, port = 446 } = req.body;
    if (!host) {
      return res.status(400).json({ success: false, error: 'La IP del servidor IBM i es requerida' });
    }
    const result = await AdminIBMiConnection.testTelnetConnection(host, port);
    res.json({ success: result.success, data: result });
  } catch (error) {
    console.error('Error probando conexión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

exports.getConnectionsByEnvironment = async (req, res) => {
  try {
    const { environment } = req.params;
    const connections = await AdminIBMiConnection.findByEnvironment(environment);
    res.json({ success: true, data: connections });
  } catch (error) {
    console.error('Error obteniendo conexiones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
