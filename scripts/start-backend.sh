#!/bin/bash

# Start Backend Server Script

echo "📦 Starting Backend Server..."

# Check if backend is already running
if ss -tulpn | grep -q ":8000"; then
    echo "⚠️  Backend server is already running on port 8000"
    echo "   Run './scripts/stop-dev.sh' to stop existing server first"
    exit 1
fi

# Change to backend directory and start server
cd backend || { echo "❌ Backend directory not found"; exit 1; }

echo "📦 Starting Express.js server on port 8000..."
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# Save PID for later cleanup
echo $BACKEND_PID > ../logs/backend.pid

echo "✅ Backend server started (PID: $BACKEND_PID)"
echo "📦 Backend URL: http://localhost:8000"
echo "📊 Health Check: http://localhost:8000/health"
echo "📝 Logs: tail -f logs/backend.log"

# Wait a moment and check if server started successfully
sleep 3
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server is running successfully"
else
    echo "❌ Backend server failed to start. Check logs/backend.log for details"
    exit 1
fi

cd ..