# ============================================
# Backend Go - IBM i Service
# Multi-stage build simplificado
# ============================================

# Stage 1: Build
FROM golang:1.21-alpine AS builder

# Instalar git para dependencias
RUN apk add --no-cache git

WORKDIR /app

# Copiar módulos
COPY go.mod go.sum ./
RUN go mod download && go mod tidy

# Copiar código fuente
COPY . .

# Compilar binario
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/

# Stage 2: Runtime
FROM alpine:3.19

# Instalar solo curl para healthchecks
RUN apk add --no-cache curl ca-certificates tzdata

WORKDIR /app

# Copiar binario compilado
COPY --from=builder /app/main .

# Crear usuario non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

ENV GO_SERVER_PORT=8080
ENV GO_SERVER_HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["./main"]
