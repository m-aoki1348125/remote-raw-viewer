#!/bin/bash

# Start Frontend Server Script

echo "🌐 Starting Frontend Server..."

# Check if frontend is already running
if ss -tulpn | grep -q ":3000"; then
    echo "⚠️  Frontend server is already running on port 3000"
    echo "   Run './scripts/stop-dev.sh' to stop existing server first"
    exit 1
fi

# Change to frontend directory and start server
cd frontend || { echo "❌ Frontend directory not found"; exit 1; }

echo "🌐 Starting Vite development server on port 3000..."
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Save PID for later cleanup
echo $FRONTEND_PID > ../logs/frontend.pid

echo "✅ Frontend server started (PID: $FRONTEND_PID)"
echo "🌐 Frontend URL: http://localhost:3000"
echo "📝 Logs: tail -f logs/frontend.log"

# Wait a moment and check if server started successfully
sleep 3
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend server is running successfully"
else
    echo "❌ Frontend server failed to start. Check logs/frontend.log for details"
    exit 1
fi

cd ..