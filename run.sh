#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================================="
echo " Starting KisanMandi + Kerala Soil Erosion Monitor"
echo "=========================================================="

# 1. Activate Python virtual environment & start FastAPI backend on :8000
echo "--> Starting FastAPI backend on http://localhost:8000 ..."
"$PROJECT_ROOT/.venv/bin/python" main.py &
BACKEND_PID=$!

# Cleanup handler for graceful shutdown on Ctrl+C
trap 'echo ""; echo "Shutting down servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' SIGINT SIGTERM

# Give the backend a moment to bind port 8000
sleep 1.5

# 2. Start Vite React frontend on :5173
echo "--> Starting React + Vite frontend on http://localhost:5173 ..."
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host &
FRONTEND_PID=$!

echo ""
echo "----------------------------------------------------------"
echo " Web App URL:      http://localhost:5173"
echo " API Docs URL:     http://localhost:8000/docs"
echo " Press [Ctrl+C] to stop all servers."
echo "----------------------------------------------------------"
echo ""

# Wait for background server processes
wait
