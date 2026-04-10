# ============================================
# API Node.js - HelpDesk IBM i
# Multi-stage build para producción
# ============================================

# Stage 1: Install dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Copiar package files
COPY package.json ./

# Instalar dependencias
RUN npm install --omit=dev && \
    npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Stage 3: Production runtime
FROM node:18-alpine

# Instalar curl para healthchecks
RUN apk add --no-cache curl

WORKDIR /app

# Crear usuario non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias del stage 1
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar aplicación del builder
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Crear directorios de almacenamiento
RUN mkdir -p /app/evidencias && chown -R nodejs:nodejs /app/evidencias && \
    mkdir -p /app/profile-photos && chown -R nodejs:nodejs /app/profile-photos

# Cambiar a usuario non-root
USER nodejs

# Exponer puerto
EXPOSE 2050

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV NODE_HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:2050/health || exit 1

# Iniciar aplicación
CMD ["node", "src/server.js"]
