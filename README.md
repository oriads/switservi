# HelpDesk IBM i - Sistema de Gestión de Cambios y Soporte

Sistema enterprise para gestión de requerimientos, control de cambios y soporte técnico integrado con IBM i (AS/400) mediante conexión ODBC.

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Node.js   │────▶│   PostgreSQL    │
│   (React+Vite)  │     │   (Express)     │     │   (BD Central)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │  Backend Go     │
                         │  (ODBC IBM i)   │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   IBM i (AS/400)│
                         │   DB2 Database  │
                         └─────────────────┘
```

## 📁 Estructura del Proyecto

```
helpdesk-ibmi/
├── frontend/             # Interfaz web (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── services/     # Servicios de API
│   │   └── App.jsx       # Componente principal
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── backend-go/           # Microservicio ODBC IBM i
│   ├── cmd/              # Punto de entrada
│   ├── internal/         # Código privado
│   │   ├── odbc/         # Módulo de conexión DB2
│   │   ├── api/          # API REST interna
│   │   └── config/       # Configuración
│   ├── go.mod
│   └── Dockerfile
├── api-node/             # API principal (Express)
│   ├── src/
│   │   ├── controllers/  # Lógica de endpoints
│   │   ├── routes/       # Definición de rutas
│   │   ├── middleware/   # Validaciones y uploads
│   │   ├── models/       # Modelos de datos
│   │   ├── services/     # Servicios de negocio
│   │   └── config/       # Configuración DB
│   ├── package.json
│   └── Dockerfile
├── shared/               # Esquemas compartidos
├── database/             # Scripts de BD
│   └── init/             # Inicialización PostgreSQL
├── docker-compose.yml    # Orquestación completa
└── .env.example          # Variables de entorno
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose
- Git

### Levantar todo el stack
```bash
# 1. Clonar repositorio
git clone <url>
cd helpdesk-ibmi

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar servicios
docker-compose up -d

# 4. Verificar servicios
docker-compose ps

# 5. Acceder al frontend
# http://localhost:5173
```

### Desarrollo Local del Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🚀 Inicio Fácil para Usuarios No Técnicos

Si no tienes conocimientos técnicos, solo sigue estos pasos:

### Paso 1: Crear Accesos Directos
```
1. Ve a la carpeta del proyecto
2. Ejecuta: CREAR_ACCESOS_DIRECTOS.bat
3. Verás 3 nuevos iconos en tu escritorio
```

### Paso 2: Iniciar el Sistema
```
1. En tu escritorio, haz doble clic en "INICIAR HelpDesk"
2. Espera unos segundos (la primera vez puede tardar)
3. El sistema se abrirá automáticamente en tu navegador
```

### Paso 3: Usar el Sistema
```
1. Verás una pantalla de bienvenida con un botón verde grande
2. Haz clic en ese botón verde
3. ¡Listo! Ya puedes usar el sistema
```

### Paso 4: Cerrar el Sistema
```
1. Cierra tu navegador
2. En tu escritorio, haz doble clic en "DETENER HelpDesk"
3. Confirma que deseas detener el sistema
```

### Si Tienes Problemas
```
- Lee el archivo: INSTRUCCIONES_PARA_EL_USUARIO.txt
- Ahí encontrarás soluciones a problemas comunes
```

### Servicios
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Frontend | 5173 | Interfaz web (React) |
| API Node.js | 3000 | API REST principal |
| Backend Go | 8080 | API ODBC IBM i |
| PostgreSQL | 5432 | Base de datos |
| pgAdmin | 5050 | Admin web PostgreSQL |

## 🔧 Desarrollo Local

### Backend Go
```bash
cd backend-go
go mod tidy
go run cmd/main.go
```

### API Node.js
```bash
cd api-node
npm install
npm run dev
```

## 📋 Endpoints API Node.js

### Control de Cambios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/changes` | Crear registro de cambio |
| GET | `/api/changes` | Listar cambios |
| GET | `/api/changes/:id` | Obtener cambio |
| GET | `/api/changes/search` | Buscar por nombre o SAVF |
| PUT | `/api/changes/:id` | Actualizar cambio |
| DELETE | `/api/changes/:id` | Eliminar cambio |

### Evidencias
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/evidencias/upload` | Subir archivos |
| GET | `/api/evidencias/:changeId` | Listar evidencias |

### IBM i Jobs
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ibmi/jobs` | Listar trabajos planificados |
| GET | `/api/ibmi/jobs/:id` | Obtener detalle job |

## 🗄️ Base de Datos

**PostgreSQL** es la BD seleccionada por:
- ✅ Estabilidad probada en producción
- ✅ Soporte ACID completo
- ✅ JSONB para datos flexibles
- ✅ Full-text search integrado
- ✅ Extensible y robusto
- ✅ Excelente soporte Docker

## 🔐 Variables de Entorno

Ver archivo `.env.example` para referencia completa.

## 📦 Despliegue

### Producción con Docker
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Variables para producción
- Configurar `NODE_ENV=production`
- Usar secretos para credenciales
- Configurar backup automático de PostgreSQL

## 🧪 Testing

```bash
# API Node.js
cd api-node
npm test

# Backend Go
cd backend-go
go test ./...
```

## 📝 Licencia

MIT

## 👥 Equipo

Desarrollado para gestión de HelpDesk y Control de Cambios IBM i.
