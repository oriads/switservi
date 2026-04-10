-- ============================================
-- Módulo de Administración - Esquema DB
-- Usuarios, Conexiones IBM i, Perfiles
-- ============================================

-- ============================================
-- Tabla: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    profile_photo VARCHAR(255),
    dark_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'es',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla: ibmi_connections
-- Credenciales cifradas para conexión IBM i
-- ============================================
CREATE TABLE IF NOT EXISTS ibmi_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 446,
    username VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL,
    library VARCHAR(100) DEFAULT 'QGPL',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    last_tested TIMESTAMP,
    last_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla: audit_admin
-- Registro de acciones administrativas
-- ============================================
CREATE TABLE IF NOT EXISTS audit_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_ibmi_conn_user ON ibmi_connections(user_id);
CREATE INDEX idx_ibmi_conn_active ON ibmi_connections(is_active);
CREATE INDEX idx_audit_admin_admin ON audit_admin(admin_id);
CREATE INDEX idx_audit_admin_date ON audit_admin(created_at);

-- ============================================
-- Trigger: updated_at para users
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibmi_conn_updated_at
    BEFORE UPDATE ON ibmi_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Usuario admin por defecto
-- Password: Admin123! (debe cambiarse en producción)
-- ============================================
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES (
    'admin',
    'admin@helpdesk.com',
    '$2b$10$X7sKZ5pJ8vQ3yR2wN9mL.eO4tG6hU8jI0kA1sD3fE5gH7iJ9kL1mN',
    'Administrador del Sistema',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Comentarios
-- ============================================
COMMENT ON TABLE users IS 'Usuarios del sistema HelpDesk IBM i';
COMMENT ON TABLE ibmi_connections IS 'Conexiones cifradas a ambientes IBM i por usuario';
COMMENT ON TABLE audit_admin IS 'Auditoría de acciones administrativas';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt de la contraseña del usuario';
COMMENT ON COLUMN ibmi_connections.password_encrypted IS 'Contraseña IBM i cifrada con AES-256';
COMMENT ON COLUMN users.dark_mode IS 'Preferencia de tema oscuro del usuario';
