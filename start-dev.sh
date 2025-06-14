#!/bin/bash

# Remote Raw Viewer Development Server Startup Script

echo "🚀 Starting Remote Raw Viewer Development Environment"
echo "=================================================="

# Check if required commands are available
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required but not installed. Aborting." >&2; exit 1; }

# Create log directory
mkdir -p logs

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📦 Starting Backend Server (Port 8000)..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend development server
echo "🌐 Starting Frontend Development Server (Port 3000)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

echo ""
echo "✅ Development Environment Ready!"
echo "=================================================="
echo "🌐 Frontend:  http://localhost:3000"
echo "📦 Backend:   http://localhost:8000"
echo "📊 Health:    http://localhost:8000/health"
echo "📝 Logs:      tail -f logs/backend.log logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=================================================="

# Monitor processes
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
    sleep 1
done

echo "❌ One or more servers stopped unexpectedly"
cleanup