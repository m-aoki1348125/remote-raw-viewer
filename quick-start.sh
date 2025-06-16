#!/bin/bash

# Quick Start Script - Non-interactive mode

echo "🚀 Quick Start - Remote Raw Viewer"
echo "=================================================="

# Stop any existing processes first
echo "🛑 Stopping any existing processes..."
./scripts/stop-dev.sh

sleep 2

echo ""
echo "🏃 Starting development servers..."

# Start backend
echo "📦 Starting backend server..."
./scripts/start-backend.sh

# Wait for backend to be ready
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
./scripts/start-frontend.sh

echo ""
echo "✅ Quick start complete!"
echo "=================================================="
echo "🌐 Frontend:  http://localhost:3000"
echo "📦 Backend:   http://localhost:8000"
echo "📊 Health:    http://localhost:8000/health"
echo ""
echo "📝 To view logs: tail -f logs/backend.log logs/frontend.log"
echo "🛑 To stop: ./scripts/stop-dev.sh"
echo "🔍 To check status: ./scripts/check-status.sh"
echo "⚙️  For interactive mode: ./start-dev.sh"