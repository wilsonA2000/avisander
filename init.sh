#!/bin/bash

# Avisander - Premium Butcher Shop E-commerce
# Environment Setup Script

set -e

echo "=============================================="
echo "  Avisander - Configuracion del Entorno"
echo "=============================================="
echo ""

# Check Node.js version
echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no esta instalado. Por favor instala Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Se requiere Node.js 18+. Version actual: $(node -v)"
    exit 1
fi
echo "Node.js $(node -v) - OK"

# Check npm
echo "Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm no esta instalado"
    exit 1
fi
echo "npm $(npm -v) - OK"

echo ""
echo "----------------------------------------------"
echo "  Instalando dependencias del Backend"
echo "----------------------------------------------"

cd backend
npm install
cd ..

echo ""
echo "----------------------------------------------"
echo "  Instalando dependencias del Frontend"
echo "----------------------------------------------"

cd frontend
npm install
cd ..

echo ""
echo "----------------------------------------------"
echo "  Configurando Base de Datos"
echo "----------------------------------------------"

cd backend
if [ ! -f "database.sqlite" ]; then
    echo "Inicializando base de datos SQLite..."
    npm run db:init 2>/dev/null || node scripts/init-db.js 2>/dev/null || echo "Base de datos se creara al iniciar el servidor"
else
    echo "Base de datos ya existe - OK"
fi
cd ..

echo ""
echo "----------------------------------------------"
echo "  Iniciando Servidores"
echo "----------------------------------------------"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Deteniendo servidores..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
echo "Iniciando servidor backend (Express)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend server
echo "Iniciando servidor frontend (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=============================================="
echo "  Avisander esta listo!"
echo "=============================================="
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  API:      http://localhost:3000/api"
echo ""
echo "  Informacion del Negocio:"
echo "  - Nombre: Avisander"
echo "  - Direccion: Cra 23 #20-70 Local 2, Bucaramanga"
echo "  - WhatsApp: 3162530287"
echo ""
echo "  Presiona Ctrl+C para detener los servidores"
echo "=============================================="
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
