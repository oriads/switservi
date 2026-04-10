/**
 * Esquemas compartidos entre Backend Go y API Node.js
 * Este archivo define los tipos de datos estándar para el sistema
 */

// Tipos de cambio soportados
const TIPOS_CAMBIO = {
  PROYECTO: 'Proyecto',
  REQUERIMIENTO: 'Requerimiento',
  INCIDENCIA: 'Incidencia',
};

// Ambientes disponibles
const AMBIENTES = {
  DEV: 'DEV',
  QA: 'QA',
  STG: 'STG',
  PRD: 'PRD',
};

// Estados de cambio
const ESTADOS_CAMBIO = {
  PENDIENTE: 'pendiente',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
};

// Tipos de archivo permitidos para evidencias
const TIPOS_ARCHIVO_PERMITIDOS = [
  '.xlsx',
  '.docx',
  '.txt',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
];

// Esquema de un cambio
const CHANGE_SCHEMA = {
  titulo: 'string (required, max 200)',
  tipo: `enum (${Object.values(TIPOS_CAMBIO).join(', ')})`,
  descripcion: 'string (optional, max 5000)',
  solicitante: 'string (optional, max 100)',
  ambiente: `enum (${Object.values(AMBIENTES).join(', ')})`,
  savf_name: 'string (optional, max 100)',
  implementador: 'string (optional, max 100)',
  fecha_implementacion: 'datetime (optional)',
  metadata: 'object (optional)',
  estado: `enum (${Object.values(ESTADOS_CAMBIO).join(', ')})`,
  efectivo: 'boolean (default: false)',
  novedades: 'string (optional, max 2000)',
};

// Esquema de trabajo IBM i
const IBM_JOB_SCHEMA = {
  job_name: 'string',
  submitter: 'string',
  job_type: 'string',
  schedule_date: 'date',
  schedule_time: 'time',
  status: 'string',
  job_queue: 'string',
  job_library: 'string',
  description: 'string (optional)',
};

// Respuesta API estándar
const API_RESPONSE_SCHEMA = {
  success: 'boolean',
  data: 'any (optional)',
  error: 'string (optional)',
  message: 'string (optional)',
};

module.exports = {
  TIPOS_CAMBIO,
  AMBIENTES,
  ESTADOS_CAMBIO,
  TIPOS_ARCHIVO_PERMITIDOS,
  CHANGE_SCHEMA,
  IBM_JOB_SCHEMA,
  API_RESPONSE_SCHEMA,
};
