const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/app');
const database = require('./config/database');
const changesRoutes = require('./routes/changes');
const ibmiRoutes = require('./routes/ibmi');
const evidenciasRoutes = require('./routes/evidencias');
const adminRoutes = require('./routes/admin');

// Inicializar Express
const app = express();

// ============================================
// Middlewares globales
// ============================================

// Seguridad HTTP
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use(morgan('dev'));

// Parse JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// Rutas
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API Routes
app.use('/api', changesRoutes);
app.use('/api', ibmiRoutes);
app.use('/api/evidencias', evidenciasRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

// ============================================
// Iniciar servidor
// ============================================

const startServer = async () => {
  try {
    // Verificar conexión a BD
    const dbConnected = await database.checkConnection();

    if (!dbConnected) {
      console.warn('⚠️ Iniciando sin conexión a PostgreSQL');
    }

    // Crear directorio de evidencias si no existe
    if (!require('fs').existsSync(config.evidenciasDir)) {
      require('fs').mkdirSync(config.evidenciasDir, { recursive: true });
      console.log('📁 Directorio de evidencias creado');
    }

    // Iniciar servidor HTTP
    app.listen(config.port, config.host, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║     🚀 HelpDesk IBM i - API Node.js           ║');
      console.log('╠════════════════════════════════════════════════╣');
      console.log(`║  📍 Servidor: http://${config.host}:${config.port}      ║`);
      console.log(`║  🌍 Ambiente: ${config.env.padEnd(30)}║`);
      console.log(`║  📦 Evidencias: ${config.evidenciasDir.padEnd(28)}║`);
      console.log('╠════════════════════════════════════════════════╣');
      console.log('║  Endpoints disponibles:                        ║');
      console.log('║  - GET  /health                                ║');
      console.log('║  - CRUD /api/changes                           ║');
      console.log('║  - GET  /api/ibmi/jobs                         ║');
      console.log('║  - POST /api/evidencias/upload                 ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔚 Señal SIGTERM recibida, cerrando...');
  await database.closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔚 Señal SIGINT recibida, cerrando...');
  await database.closePool();
  process.exit(0);
});

startServer();

module.exports = app;
