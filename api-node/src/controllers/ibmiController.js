const axios = require('axios');
const config = require('../config/app');

// Obtener trabajos planificados del IBM i
exports.getScheduledJobs = async (req, res) => {
  try {
    const response = await axios.get(`${config.goBackendUrl}/api/jobs`, {
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error conectando con Backend Go:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Servicio IBM i no disponible',
        message: 'No se pudo conectar con el backend Go ODBC',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno consultando IBM i',
    });
  }
};

// Obtener detalle de un trabajo
exports.getJobDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${config.goBackendUrl}/api/jobs/detail`, {
      params: { id },
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo detalle de job:', error.message);

    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Trabajo no encontrado en IBM i',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno consultando IBM i',
    });
  }
};

// Health check del backend Go
exports.ibmHealth = async (req, res) => {
  try {
    const response = await axios.get(`${config.goBackendUrl}/api/health`, {
      timeout: 5000,
    });

    res.json(response.data);
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Backend Go no responde',
      message: error.message,
    });
  }
};
