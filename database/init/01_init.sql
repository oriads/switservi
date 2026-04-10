-- ============================================
-- HelpDesk IBM i - Esquema de Base de Datos
-- PostgreSQL 14+
-- ============================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tabla: Changes (Control de Cambios)
-- ============================================
CREATE TABLE IF NOT EXISTS changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información principal
  titulo VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Proyecto', 'Requerimiento', 'Incidencia')),
  descripcion TEXT,
  solicitante VARCHAR(100),
  
  -- Detalles de implementación
  ambiente VARCHAR(10) DEFAULT 'QA' CHECK (ambiente IN ('DEV', 'QA', 'STG', 'PRD')),
  savf_name VARCHAR(100),
  implementador VARCHAR(100),
  fecha_implementacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Estado y seguimiento
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'cancelado')),
  efectivo BOOLEAN DEFAULT FALSE,
  novedades TEXT,
  
  -- Metadata flexible (JSONB)
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_changes_titulo ON changes USING gin(to_tsvector('spanish', titulo));
CREATE INDEX idx_changes_savf ON changes(savf_name);
CREATE INDEX idx_changes_tipo ON changes(tipo);
CREATE INDEX idx_changes_estado ON changes(estado);
CREATE INDEX idx_changes_ambiente ON changes(ambiente);
CREATE INDEX idx_changes_created ON changes(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_changes_updated_at
  BEFORE UPDATE ON changes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Tabla: Evidencias (Archivos subidos)
-- ============================================
CREATE TABLE IF NOT EXISTS evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_id UUID REFERENCES changes(id) ON DELETE CASCADE,
  
  -- Información del archivo
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  
  -- Metadata
  uploaded_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evidencias_change_id ON evidencias(change_id);
CREATE INDEX idx_evidencias_created ON evidencias(created_at DESC);

-- ============================================
-- Tabla: IBM Jobs (Cache de trabajos IBM i)
-- ============================================
CREATE TABLE IF NOT EXISTS ibm_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificación del job
  job_name VARCHAR(100) NOT NULL UNIQUE,
  submitter VARCHAR(100),
  job_type VARCHAR(50),
  
  -- Programación
  schedule_date DATE,
  schedule_time TIME,
  
  -- Estado
  status VARCHAR(50),
  job_queue VARCHAR(100),
  job_library VARCHAR(100),
  description TEXT,
  
  -- Metadata completa del IBM i
  metadata JSONB,
  
  -- Timestamps
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ibm_jobs_status ON ibm_jobs(status);
CREATE INDEX idx_ibm_jobs_schedule ON ibm_jobs(schedule_date, schedule_time);

-- ============================================
-- Tabla: Audit Log (Registro de actividades)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  
  -- Detalle
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================
-- Datos de ejemplo (opcional)
-- ============================================

INSERT INTO changes (titulo, tipo, descripcion, solicitante, ambiente, savf_name, implementador, estado) VALUES
('Migración sistema de facturación', 'Proyecto', 'Migrar sistema de facturación a nueva versión', 'Juan Pérez', 'PRD', 'FACTURAS_SAVF', 'Carlos López', 'en_progreso'),
('Actualizar módulo de inventarios', 'Requerimiento', 'Actualizar stock automáticamente', 'María García', 'QA', 'INVENTARIOS_SAVF', 'Ana Martínez', 'pendiente'),
('Error en reporte de ventas', 'Incidencia', 'El reporte de ventas no genera correctamente', 'Pedro Sánchez', 'PRD', 'VENTAS_SAVF', 'Luis Rodríguez', 'completado')
ON CONFLICT DO NOTHING;

-- ============================================
-- Verificación
-- ============================================
SELECT 'Database initialization completed successfully' AS status;
SELECT COUNT(*) AS tables_created FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('changes', 'evidencias', 'ibm_jobs', 'audit_log');
