# Arquitectura del Sistema - HelpDesk IBM i

## 📐 Vista General

El sistema está diseñado como un **monorepositorio** con servicios desacoplados que se comunican entre sí mediante APIs REST.

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Futuro)                 │
│                  React / Vue / Angular               │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────┐
│              API Node.js (Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Changes     │  │  Evidencias  │  │  IBM i    │ │
│  │  Controller  │  │  Controller  │  │  Proxy    │ │
│  └──────────────┘  └──────────────┘  └─────┬─────┘ │
└─────────────────────────────────────────────┼───────┘
                         │                    │
              ┌──────────┴──────┐    ┌────────┴────────┐
              │   PostgreSQL    │    │   Backend Go    │
              │   (BD Central)  │    │   (ODBC IBM i)  │
              └─────────────────┘    └────────┬────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │   IBM i (AS/400)│
                                     │   DB2 Database  │
                                     └─────────────────┘
```

## 🏗️ Componentes

### 1. Backend Go (`/backend-go`)

**Propósito**: Comunicación ODBC con IBM i (AS/400)

**Tecnología**: Go 1.21

**Dependencias Clave**:
- `alexbrainman/odbc` - Driver ODBC
- `gorilla/mux` - Router HTTP

**Estructura**:
```
backend-go/
├── cmd/
│   └── main.go              # Punto de entrada
├── internal/
│   ├── config/
│   │   └── config.go        # Configuración desde .env
│   ├── odbc/
│   │   └── ibmi.go          # Módulo de conexión ODBC
│   └── api/
│       ├── handlers.go      # Handlers HTTP
│       └── routes.go        # Definición de rutas
├── odbc.ini                  # Configuración ODBC
├── odbcinst.ini             # Driver ODBC
├── go.mod                   # Dependencias Go
└── Dockerfile               # Imagen Docker
```

**Responsabilidades**:
- ✅ Pool de conexiones ODBC al IBM i
- ✅ Consulta de trabajos planificados
- ✅ Ejecución de comandos CL (con validación de seguridad)
- ✅ Detección de caída de VPN/red
- ✅ API REST interna para Node.js

**Endpoints**:
```
GET  /api/health         - Health check
GET  /api/jobs           - Listar trabajos planificados
GET  /api/jobs/detail    - Detalle de un trabajo
POST /api/jobs/execute   - Ejecutar comando CL
```

### 2. API Node.js (`/api-node`)

**Propósito**: API principal, gestión de cambios y evidencias

**Tecnología**: Node.js 18 + Express 4

**Dependencias Clave**:
- `express` - Framework web
- `pg` - Driver PostgreSQL
- `multer` - Upload de archivos
- `helmet` - Seguridad HTTP
- `express-validator` - Validaciones

**Estructura**:
```
api-node/
├── src/
│   ├── server.js            # Punto de entrada principal
│   ├── config/
│   │   ├── app.js           # Configuración de app
│   │   └── database.js      # Pool de PostgreSQL
│   ├── controllers/
│   │   ├── changesController.js   # CRUD de cambios
│   │   └── ibmiController.js      # Proxy a Backend Go
│   ├── models/
│   │   └── Change.js        # Modelo de datos + queries
│   ├── routes/
│   │   ├── changes.js       # Rutas de cambios
│   │   ├── ibmi.js          # Rutas de IBM i
│   │   └── evidencias.js    # Rutas de evidencias
│   └── middleware/
│       ├── upload.js        # Multer para archivos
│       └── validators.js    # Validaciones de entrada
├── evidencias/              # Almacén de archivos
├── package.json
└── Dockerfile
```

**Responsabilidades**:
- ✅ CRUD completo de Control de Cambios
- ✅ Validación de entradas (tipo, ambiente, metadata)
- ✅ Upload de evidencias (.xlsx, .docx, .txt, etc.)
- ✅ Búsqueda por nombre de requerimiento y SAVF
- ✅ Proxy a Backend Go para datos del IBM i
- ✅ Seguridad (Helmet, CORS, validaciones)

**Endpoints**:
```
Health:
GET  /health

Changes:
POST   /api/changes              - Crear cambio
GET    /api/changes              - Listar cambios (paginado)
GET    /api/changes/:id          - Obtener cambio
PUT    /api/changes/:id          - Actualizar cambio
DELETE /api/changes/:id          - Eliminar cambio
GET    /api/changes/search/titulo?titulo= - Buscar por título
GET    /api/changes/search/savf?savf=     - Buscar por SAVF

IBM i:
GET  /api/ibmi/jobs              - Listar trabajos IBM i
GET  /api/ibmi/jobs/:id          - Detalle de trabajo
GET  /api/ibmi/health            - Estado de Backend Go

Evidencias:
POST /api/evidencias/upload              - Subir archivos
GET  /api/evidencias/:changeId           - Listar evidencias
```

### 3. PostgreSQL (`/database`)

**Propósito**: Base de datos central del sistema

**Versión**: PostgreSQL 15

**Esquema**:
```sql
changes          - Registros de Control de Cambios
evidencias       - Archivos subidos (metadata)
ibm_jobs         - Cache de trabajos IBM i
audit_log        - Registro de auditoría
```

**Características**:
- ✅ UUIDs como claves primarias
- ✅ JSONB para metadata flexible
- ✅ Full-text search con GIN indexes
- ✅ Triggers para `updated_at`
- ✅ Constraints para integridad
- ✅ Datos de ejemplo incluidos

### 4. Shared (`/shared`)

**Propósito**: Esquemas y tipos compartidos

**Contenido**:
- Definiciones de tipos de cambio
- Enumeraciones de ambientes
- Esquemas de validación
- Constantes reutilizables

## 🔐 Seguridad

### Capas de Seguridad

1. **Red**:
   - Docker network aislada
   - Puertos expuestos configurables
   - VPN requerida para IBM i

2. **Aplicación**:
   - Helmet.js para headers HTTP seguros
   - CORS configurado
   - Validaciones de entrada
   - Whitelist de comandos CL

3. **Base de Datos**:
   - Usuario dedicado con permisos mínimos
   - Contraseña en variables de entorno
   - SSL opcional

4. **Archivos**:
   - Validación de tipos de archivo
   - Límite de tamaño (10MB default)
   - Nombres únicos con UUID

### Variables Sensibles
NUNCA subir al repositorio:
- `.env` (está en .gitignore)
- Certificados SSL
- Keys de API
- Credenciales ODBC

## 🔄 Flujos de Datos

### Crear Control de Cambio
```
1. Cliente → POST /api/changes
2. Express valida entrada (validators.js)
3. Change.model crea registro en PostgreSQL
4. Retorna UUID del cambio creado
```

### Subir Evidencia
```
1. Cliente → POST /api/evidencias/upload
2. Multer valida tipo y tamaño
3. Archivo guardado en /evidencias/YYYY-MM-DD/{changeId}/
4. Nombre único generado con UUID
5. Retorna metadata de archivos subidos
```

### Consultar IBM i
```
1. Cliente → GET /api/ibmi/jobs
2. Node.js proxy request a Backend Go
3. Backend Go consulta vía ODBC
4. DB2 retorna datos
5. Respuesta via Node.js al cliente
```

### Búsqueda por SAVF
```
1. Cliente → GET /api/changes/search/savf?savf=XXX
2. Change.searchBySAVF ejecuta query con ILIKE
3. Índice en savf_name optimiza búsqueda
4. Retorna resultados ordenados
```

## 🚀 Despliegue

### Docker Compose
Orquesta todos los servicios:
- PostgreSQL con health check
- Backend Go con drivers ODBC
- API Node.js con volumes para evidencias
- pgAdmin para administración web

### Producción
- Build multi-stage para imágenes optimizadas
- Usuario non-root en contenedores
- Health checks automátos
- Reverse proxy con Nginx
- SSL con Let's Encrypt
- Backups automátos

## 📊 Decisiones de Diseño

### ¿Por qué PostgreSQL?
- ✅ Estabilidad probada (30+ años)
- ✅ ACID completo
- ✅ JSONB para datos flexibles
- ✅ Full-text search nativo
- ✅ Excelente soporte Docker
- ✅ Mejor que MySQL para datos relacionales complejos

### ¿Por qué Go para ODBC?
- ✅ Performance nativo
- ✅ Manejo eficiente de conexiones
- ✅ Binario autocontenido
- ✅ Menor consumo de memoria
- ✅ Mejor manejo de drivers C

### ¿Por qué Node.js para API?
- ✅ Ecosistema rico (multer, express-validator)
- ✅ Fácil manejo de JSON
- ✅ Middleware pattern
- ✅ Rápido desarrollo
- ✅ Mejor para I/O operations

### ¿Por qué monorepositorio?
- ✅ Código visible entre servicios
- ✅ Deploy coordinado
- ✅ Shared types/schemas
- ✅ Un solo .env
- ✅ Facilita desarrollo

## 📈 Escalabilidad

### Horizontal
- API Node.js: Múltiples instancias con load balancer
- Backend Go: Stateless, fácil de replicar
- PostgreSQL: Read replicas para consultas

### Vertical
- Aumentar pool de conexiones
- Optimizar queries con EXPLAIN
- Agregar índices según necesidad

### Futuras Mejoras
- [ ] Redis para cache
- [ ] GraphQL en lugar de REST
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Autenticación JWT
- [ ] Frontend React/Vue
- [ ] CI/CD con GitHub Actions
- [ ] Testing automatizado

---

**Documento técnico de arquitectura**
**Versión**: 1.0.0
**Fecha**: Abril 2024
