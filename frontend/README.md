# HelpDesk IBM i - Frontend

Interfaz web corporativa para el sistema HelpDesk IBM i, construida con React, Vite y Tailwind CSS.

## 🚀 Tecnologías

- **React 18** - Biblioteca UI
- **Vite 5** - Build tool y dev server
- **Tailwind CSS** - Framework CSS utility-first
- **React Router 6** - Enrutamiento
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos
- **date-fns** - Manipulación de fechas

## 📁 Estructura

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Layout.jsx   # Layout principal con Sidebar y Header
│   │   ├── Sidebar.jsx  # Barra lateral de navegación
│   │   ├── Header.jsx   # Header superior
│   │   └── UI.jsx       # Componentes UI (StatCard, Badge, etc.)
│   ├── pages/           # Páginas de la aplicación
│   │   ├── Dashboard.jsx         # Dashboard con métricas
│   │   ├── ChangesList.jsx       # Lista de cambios
│   │   ├── ChangeForm.jsx        # Formulario crear/editar cambios
│   │   ├── ChangeDetail.jsx      # Detalle de cambio
│   │   ├── Evidencias.jsx        # Gestión de evidencias
│   │   └── IBMiJobs.jsx          # Trabajos IBM i
│   ├── services/        # Servicios de API
│   │   └── api.js       # Cliente HTTP y servicios
│   ├── App.jsx          # Componente principal con rutas
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales con Tailwind
├── package.json
├── vite.config.js       # Configuración de Vite
├── tailwind.config.js   # Configuración de Tailwind
├── Dockerfile           # Imagen Docker multi-stage
└── nginx.conf           # Configuración de Nginx

## 🎯 Características

### Dashboard
- Métricas en tiempo real (total, pendientes, en progreso, completados)
- Gráficos de distribución por estado
- Lista de cambios recientes
- Acciones rápidas

### Control de Cambios
- Lista con paginación
- Filtros por estado, ambiente, tipo y búsqueda libre
- Crear, editar y eliminar cambios
- Vista de detalle completa

### Gestión de Evidencias
- Upload de archivos (.xlsx, .docx, .txt, .pdf, .png, .jpg)
- Validación de tipo y tamaño (10MB máx)
- Lista de evidencias por cambio
- Descargar y eliminar evidencias

### Trabajos IBM i
- Monitoreo de trabajos planificados
- Estado de conexión con IBM i
- Detalle de trabajos (fecha, hora, estado, cola, biblioteca)
- Actualización en tiempo real

## 🛠️ Desarrollo

### Instalar dependencias
```bash
npm install
```

### Iniciar servidor de desarrollo
```bash
npm run dev
```

El servidor se inicia en `http://localhost:5173` con proxy automático a la API (`http://localhost:3000`).

### Construir para producción
```bash
npm run build
```

Los archivos generados se guardan en `dist/`.

### Preview de producción
```bash
npm run preview
```

## 🐳 Docker

### Build de la imagen
```bash
docker build -t helpdesk-frontend .
```

### Ejecutar contenedor
```bash
docker run -p 80:80 helpdesk-frontend
```

### Variables de entorno
- `VITE_API_URL` - URL de la API Node.js (default: `http://localhost:3000/api`)

## 📱 Responsive Design

La aplicación es completamente responsive:
- **Móvil**: Sidebar colapsable con botón de menú
- **Tablet**: Layout de 2 columnas
- **Desktop**: Layout completo con sidebar fijo

## 🎨 Diseño

### Colores
- **Primary**: Blue (`#2563eb`)
- **Éxito**: Green
- **Advertencia**: Yellow
- **Error**: Red
- **Info**: Blue

### Componentes UI
- `StatCard` - Tarjetas de métricas con icono
- `Badge` - Etiquetas de estado con colores
- `LoadingSpinner` - Indicador de carga
- `EmptyState` - Estado vacío con acción

## 🔌 Integración con API

El archivo `src/services/api.js` centraliza todas las llamadas a la API:

```javascript
import { changesService } from '../services/api';

// Obtener todos los cambios
const response = await changesService.getAll(1, 20, '');

// Crear cambio
await changesService.create({
  titulo: 'Mi cambio',
  tipo: 'Requerimiento',
  ambiente: 'QA',
  // ...
});
```

## 📋 Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard |
| `/changes` | Lista de cambios |
| `/changes/new` | Crear cambio |
| `/changes/:id` | Detalle de cambio |
| `/changes/:id/edit` | Editar cambio |
| `/evidencias` | Evidencias generales |
| `/evidencias/:changeId` | Evidencias de un cambio |
| `/ibmi-jobs` | Trabajos IBM i |

## ✅ Checklist de Producción

- [ ] Configurar `VITE_API_URL` con URL de producción
- [ ] Build optimizado con `npm run build`
- [ ] Nginx con HTTPS configurado
- [ ] Health check activo
- [ ] CORS configurado en API Node.js
- [ ] Compresión Gzip activa

## 🔐 Seguridad

- Sanitización de inputs en formularios
- Validación de tipos de archivo
- Headers de seguridad en Nginx (X-Frame-Options, X-Content-Type-Options)
- Sin credenciales hardcodeadas

## 🐛 Troubleshooting

### Error de CORS
Asegúrate de que la API tenga `CORS_ORIGIN=*` o el dominio del frontend.

### Error de conexión a la API
Verifica que `VITE_API_URL` apunte a la URL correcta de la API Node.js.

### Error de build
Ejecuta `npm install` para asegurar que todas las dependencias están instaladas.

## 📚 Recursos

- [Documentación de React](https://react.dev/)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Versión**: 1.0.0
**Fecha**: Abril 2024
