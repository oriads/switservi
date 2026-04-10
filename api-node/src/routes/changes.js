const { Router } = require('express');
const changesController = require('../controllers/changesController');
const { validateChange, validateSearch, validateId } = require('../middleware/validators');
const { auditLog } = require('../middleware/audit');

const router = Router();

// Rutas de Control de Cambios
router.post('/changes', validateChange, auditLog('create_change', 'change'), changesController.createChange);
router.get('/changes', changesController.getChanges);
router.get('/changes/:id', validateId, changesController.getChangeById);
router.put('/changes/:id', validateId, validateChange, auditLog('update_change', 'change'), changesController.updateChange);
router.delete('/changes/:id', validateId, auditLog('delete_change', 'change'), changesController.deleteChange);

// Rutas de búsqueda
router.get('/changes/search/titulo', changesController.searchByTitulo);
router.get('/changes/search/savf', changesController.searchBySAVF);

// Dashboard Analytics
router.get('/changes/analytics', changesController.getDashboardAnalytics);

// Exportar a Excel
router.get('/changes/export', auditLog('export_excel', 'report'), changesController.exportToExcel);

module.exports = router;
