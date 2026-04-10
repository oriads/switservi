const { Router } = require('express');
const ibmiController = require('../controllers/ibmiController');

const router = Router();

// Rutas de IBM i
router.get('/ibmi/jobs', ibmiController.getScheduledJobs);
router.get('/ibmi/jobs/:id', ibmiController.getJobDetail);
router.get('/ibmi/health', ibmiController.ibmHealth);

module.exports = router;
