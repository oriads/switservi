const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/profileUpload');

const router = Router();

// ============================================
// AUTH (Público)
// ============================================
router.post('/auth/login', adminController.login);
router.post('/auth/register', adminController.register);

// ============================================
// PERFIL (Autenticado)
// ============================================
router.get('/profile', authenticateToken, adminController.getMyProfile);
router.put('/profile', authenticateToken, adminController.updateMyProfile);
router.post('/profile/change-password', authenticateToken, adminController.changePassword);
router.post('/profile/photo', authenticateToken, uploadProfilePhoto.single('photo'), adminController.uploadProfilePhoto);
router.post('/profile/dark-mode', authenticateToken, adminController.toggleDarkMode);

// ============================================
// CONEXIONES IBM i (Autenticado)
// ============================================
router.get('/ibmi-connections', authenticateToken, adminController.getConnections);
router.post('/ibmi-connections', authenticateToken, adminController.createConnection);
router.post('/ibmi-connections/test', authenticateToken, adminController.testConnection);
router.put('/ibmi-connections/:id', authenticateToken, adminController.updateConnection);
router.delete('/ibmi-connections/:id', authenticateToken, adminController.deleteConnection);

// ============================================
// CONEXIONES IBM i - ADMINISTRACIÓN (Solo Admin)
// ============================================
router.get('/admin/ibmi-connections', authenticateToken, authorize('admin'), adminController.getAdminIBMiConnections);
router.post('/admin/ibmi-connections', authenticateToken, authorize('admin'), adminController.createAdminIBMiConnection);
router.post('/admin/ibmi-connections/test', authenticateToken, authorize('admin'), adminController.testAdminIBMiConnection);
router.put('/admin/ibmi-connections/:id', authenticateToken, authorize('admin'), adminController.updateAdminIBMiConnection);
router.delete('/admin/ibmi-connections/:id', authenticateToken, authorize('admin'), adminController.deleteAdminIBMiConnection);
router.get('/admin/ibmi-connections/env/:environment', authenticateToken, authorize('admin'), adminController.getConnectionsByEnvironment);

// ============================================
// CRUD USUARIOS (Solo Admin)
// ============================================
router.get('/users', authenticateToken, authorize('admin'), adminController.getUsers);
router.get('/users/:id', authenticateToken, authorize('admin'), adminController.getUserById);
router.post('/users', authenticateToken, authorize('admin'), adminController.createUser);
router.put('/users/:id', authenticateToken, authorize('admin'), adminController.updateUser);
router.post('/users/:id/deactivate', authenticateToken, authorize('admin'), adminController.deactivateUser);
router.delete('/users/:id', authenticateToken, authorize('admin'), adminController.deleteUser);

module.exports = router;
