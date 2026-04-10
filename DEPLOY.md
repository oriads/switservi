# Manual de Despliegue - HelpDesk IBM i

## 📋 Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración del Repositorio Git](#configuración-del-repositorio-git)
3. [Levantar el Proyecto con Docker](#levantar-el-proyecto-con-docker)
4. [Configuración de IBM i ODBC](#configuración-de-ibm-i-odbc)
5. [Desarrollo Local sin Docker](#desarrollo-local-sin-docker)
6. [Despliegue en Producción](#despliegue-en-producción)
7. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

### Software Requerido
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **RAM mínima**: 4GB
- **Disco**: 10GB libres

### Para conexión IBM i
- IBM i Access Client Solutions (ACS)
- Driver ODBC de IBM i instalado
- Conexión VPN a red local (si aplica)

---

## Configuración del Repositorio Git

### Paso 1: Inicializar repositorio
```bash
cd C:\Users\mpas1\VISUAL CODE\switservi\helpdesk-ibmi

# Inicializar Git
git init

# Verificar estado
git status
```

### Paso 2: Primer commit
```bash
# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "feat: inicialización del proyecto HelpDesk IBM i

- Backend Go con conexión ODBC a IBM i
- API Node.js con Express y PostgreSQL
- Docker Compose para orquestación
- Scripts de inicialización de BD
- Sistema de gestión de evidencias"
```

### Paso 3: Crear repositorio remoto
```bash
# GitHub (ejemplo)
git remote add origin https://github.com/tu-usuario/helpdesk-ibmi.git

# Push al remoto
git push -u origin main
```

### Paso 4: Crear ramas de desarrollo
```bash
# Rama de desarrollo
git checkout -b develop
git push -u origin develop

# Ramas para features
git checkout -b feature/configurar-odbc
git checkout -b fix/conexion-ibmi
```

### .gitignore incluido
El archivo `.gitignore` ya está configurado para excluir:
- ✅ `node_modules/`
- ✅ Archivos `.env` (secretos)
- ✅ Evidencias cargadas
- ✅ Binarios compilados
- ✅ Logs

---

## Levantar el Proyecto con Docker

### Paso 1: Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores (usa VS Code, Notepad++, etc.)
# IMPORTANTE: Configurar IBMI_HOST, IBMI_USER, IBMI_PASSWORD
```

### Paso 2: Levantar todos los servicios
```bash
# Construir e iniciar
docker-compose up -d

# Verificar servicios
docker-compose ps

# Ver logs
docker-compose logs -f
```

### Paso 3: Verificar instalación
```bash
# Verificar API Node.js
curl http://localhost:3000/health

# Verificar Backend Go
curl http://localhost:8080/api/health

# Verificar PostgreSQL
docker-compose exec postgres pg_isready -U helpdesk
```

### Servicios disponibles
| Servicio | URL | Credenciales |
|----------|-----|--------------|
| API Node.js | http://localhost:3000 | - |
| Backend Go | http://localhost:8080 | - |
| pgAdmin | http://localhost:5050 | admin@helpdesk.com / admin_pass |
| PostgreSQL | localhost:5432 | helpdesk / helpdesk_pass |

### Comandos útiles de Docker
```bash
# Detener servicios
docker-compose down

# Detener y borrar volúmenes (¡CUIDADO! Pierde datos)
docker-compose down -v

# Reiniciar un servicio
docker-compose restart api-node

# Ver logs de un servicio
docker-compose logs -f backend-go

# Reconstruir imágenes
docker-compose build --no-cache

# Actualizar y reiniciar
docker-compose pull
docker-compose up -d
```

---

## Configuración de IBM i ODBC

### Opción 1: Usando Docker (Recomendado)

El Dockerfile del Backend Go ya incluye la configuración básica. Sin embargo, necesitas:

1. **Obtener el driver ODBC de IBM i**:
   - Descargar de IBM Fix Central o desde IBM i Access Client Solutions
   - Archivos necesarios: `libcwbodbc.so`, `libcwbcore.so`, etc.

2. **Montar drivers como volumen**:
   ```yaml
   # En docker-compose.yml, agregar:
   backend-go:
     volumes:
       - /ruta/a/drivers-ibmi:/opt/ibmi-driver
   ```

3. **Configurar .env**:
   ```env
   IBMI_HOST=192.168.1.100
   IBMI_PORT=446
   IBMI_USER=QSECOFR
   IBMI_PASSWORD=tu_password
   IBMI_LIBRARY=QGPL
   ```

### Opción 2: Instalación manual en Linux/Ubuntu

```bash
# Instalar unixODBC
sudo apt-get update
sudo apt-get install -y unixodbc unixodbc-dev

# Instalar IBM i Access Client Solutions
# Descargar desde: https://www.ibm.com/support/pages/ibm-i-access-client-solutions

# Configurar ODBC
sudo nano /etc/odbcinst.ini
# Agregar:
[iSeries Access ODBC Driver]
Description = IBM i Access ODBC Driver
Driver = /opt/ibm/iaccess/lib64/libcwbodbc.so
Setup = /opt/ibm/iaccess/lib64/libcwbodbc.so
FileUsage = 1

# Configurar DSN
nano ~/.odbc.ini
# Agregar:
[IBMi]
Driver = iSeries Access ODBC Driver
System = 192.168.1.100
UserID = QSECOFR
Password = tu_password
Library = QGPL

# Probar conexión
isql -v IBMi QSECOFR tu_password
```

### Opción 3: Windows

1. Instalar IBM i Access Client Solutions
2. Configurar DSN en Panel de Control → ODBC Data Sources
3. Probar conexión desde PowerShell:
   ```powershell
   Test-NetConnection -ComputerName 192.168.1.100 -Port 446
   ```

---

## Desarrollo Local sin Docker

### Backend Go
```bash
cd backend-go

# Instalar dependencias
go mod tidy

# Configurar variables de entorno
export IBMI_HOST=192.168.1.100
export IBMI_USER=QSECOFR
export IBMI_PASSWORD=tu_password

# Ejecutar
go run cmd/main.go
```

### API Node.js
```bash
cd api-node

# Instalar dependencias
npm install

# Configurar .env
cp ../.env.example .env

# Ejecutar en modo desarrollo
npm run dev
```

### PostgreSQL Local
```bash
# Instalar PostgreSQL (Ubuntu)
sudo apt-get install -y postgresql-15

# Crear usuario y BD
sudo -u postgres psql
CREATE USER helpdesk WITH PASSWORD 'helpdesk_pass';
CREATE DATABASE helpdesk_ibmi OWNER helpdesk;
\q

# Ejecutar script de inicialización
psql -U helpdesk -d helpdesk_ibmi -f database/init/01_init.sql
```

---

## Despliegue en Producción

### Paso 1: Preparar servidor
```bash
# Servidor Ubuntu 22.04 LTS (ejemplo)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nginx

# Iniciar Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### Paso 2: Clonar repositorio
```bash
git clone https://github.com/tu-usuario/helpdesk-ibmi.git
cd helpdesk-ibmi
```

### Paso 3: Configurar variables seguras
```bash
# Crear .env con valores de producción
cat > .env << EOF
DB_PASSWORD=secure_random_password_here
IBMI_HOST=10.0.0.100
IBMI_USER=QSECOFR
IBMI_PASSWORD=secure_ibmi_password
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
EOF

# Proteger archivo .env
chmod 600 .env
```

### Paso 4: Desplegar con Docker
```bash
# Construir imágenes optimizadas
docker-compose build --no-cache

# Iniciar servicios
docker-compose up -d

# Verificar
docker-compose ps
curl http://localhost:3000/health
```

### Paso 5: Configurar Nginx como Reverse Proxy
```nginx
# /etc/nginx/sites-available/helpdesk
server {
    listen 80;
    server_name helpdesk.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Activar configuración
sudo ln -s /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 6: Configurar SSL con Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d helpdesk.tu-dominio.com
```

### Paso 7: Configurar Backups
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backup/helpdesk"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U helpdesk helpdesk_ibmi | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup evidencias
tar czf $BACKUP_DIR/evidencias_$DATE.tar.gz api-node/evidencias/

# Mantener últimos 7 días
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Agregar a crontab (diario a las 2 AM)
crontab -e
0 2 * * * /ruta/backup.sh >> /var/log/backup.log 2>&1
```

---

## Troubleshooting

### Problema: Backend Go no conecta al IBM i
```bash
# Verificar VPN
ping 192.168.1.100

# Verificar puerto
telnet 192.168.1.100 446

# Ver logs
docker-compose logs backend-go

# Solución común: Verificar credenciales en .env
```

### Problema: PostgreSQL no inicia
```bash
# Ver logs
docker-compose logs postgres

# Si hay corrupción de datos:
docker-compose down -v
docker-compose up -d
# NOTA: Esto borra todos los datos
```

### Problema: API Node.js no responde
```bash
# Verificar logs
docker-compose logs api-node

# Reiniciar servicio
docker-compose restart api-node

# Verificar conexión a BD
docker-compose exec api-node node -e "require('./src/config/database').checkConnection()"
```

### Problema: Error de ODBC en Docker
```bash
# Verificar que los drivers estén montados
docker-compose exec backend-go ls -la /opt/ibmi-driver

# Verificar configuración ODBC
docker-compose exec backend-go cat /etc/odbcinst.ini
docker-compose exec backend-go cat /etc/odbc.ini
```

### Logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Solo Backend Go
docker-compose logs -f backend-go

# Solo API Node
docker-compose logs -f api-node
```

---

## Endpoints de Verificación

```bash
# Health check API
curl http://localhost:3000/health

# Health check Backend Go
curl http://localhost:8080/api/health

# Crear cambio de prueba
curl -X POST http://localhost:3000/api/changes \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Test de despliegue",
    "tipo": "Requerimiento",
    "ambiente": "QA",
    "savf_name": "TEST_SAVF",
    "implementador": "Admin"
  }'

# Listar cambios
curl http://localhost:3000/api/changes
```

---

## Contacto y Soporte

Para problemas no documentados:
1. Revisar logs: `docker-compose logs -f`
2. Verificar configuración: `cat .env`
3. Reiniciar servicios: `docker-compose restart`

---

**Última actualización**: Abril 2024
**Versión**: 1.0.0
