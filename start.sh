#!/bin/bash
# ============================================
# Script de Inicio Rápido - HelpDesk IBM i
# Linux/macOS
# ============================================

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║     HelpDesk IBM i - Script de Inicio         ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker no está instalado."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] docker-compose no está instalado."
    exit 1
fi

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "[INFO] Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "[INFO] IMPORTANTE: Editar .env con tus configuraciones."
    echo ""
fi

# Iniciar servicios
echo "[INFO] Iniciando servicios con Docker Compose..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║         Servicios Iniciados Correctamente     ║"
    echo "╠════════════════════════════════════════════════╣"
    echo "║  PostgreSQL:   localhost:5432                  ║"
    echo "║  API Node.js:  http://localhost:3000           ║"
    echo "║  Backend Go:   http://localhost:8080           ║"
    echo "║  pgAdmin:      http://localhost:5050           ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "[INFO] Verificando servicios..."
    echo ""
    
    sleep 5
    
    echo "[INFO] Verificando API Node.js..."
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "[OK] API Node.js responde correctamente"
    else
        echo "[ESPERA] API Node.js aún iniciando, espera unos segundos..."
    fi
    
    echo ""
    echo "[INFO] Verificando Backend Go..."
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo "[OK] Backend Go responde correctamente"
    else
        echo "[ESPERA] Backend Go aún iniciando, espera unos segundos..."
    fi
    
    echo ""
    echo "[INFO] Para ver logs: docker-compose logs -f"
    echo "[INFO] Para detener: docker-compose down"
    echo ""
else
    echo ""
    echo "[ERROR] Error iniciando servicios."
    echo "Revisa la configuración en .env"
    echo ""
fi
