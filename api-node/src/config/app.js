require('dotenv').config();

module.exports = {
  port: process.env.NODE_PORT || 2050,
  host: process.env.NODE_HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  goBackendUrl: process.env.GO_BACKEND_URL || 'http://backend-go:8080',
  evidenciasDir: process.env.EVIDENCIAS_DIR || './evidencias',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.xlsx', '.docx', '.txt', '.pdf', '.png', '.jpg'],
};
