const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones
const poolConfig = {
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'helpdesk_ibmi',
  user: process.env.DB_USER || 'helpdesk',
  password: process.env.DB_PASSWORD || 'helpdesk_pass',
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Crear pool
const pool = new Pool(poolConfig);

// Event listeners para debugging
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
});

// Función para verificar conexión
const checkConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL responde correctamente:', res.rows[0].now);
    return true;
  } catch (err) {
    console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
    return false;
  }
};

// Función para cerrar conexiones
const closePool = async () => {
  await pool.end();
  console.log('🔌 Pool de conexiones cerrado');
};

module.exports = {
  pool,
  checkConnection,
  closePool,
};
