#!/bin/bash

# Remote Raw Viewer Development Environment Setup Script
# Interactive mode for manual control

echo "🚀 Remote Raw Viewer Development Environment"
echo "=================================================="

# Check if required commands are available
echo "🔍 Checking system requirements..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required but not installed. Aborting." >&2; exit 1; }
command -v sshpass >/dev/null 2>&1 || { echo "⚠️  sshpass not found. Installing..." >&2; sudo apt update && sudo apt install -y sshpass; }

echo "✅ System requirements satisfied"
echo ""

# Check SSH test environment
echo "🔍 Checking SSH test environment..."
if sshpass -p 'testpass123' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 testuser@localhost 'exit' 2>/dev/null; then
    echo "✅ SSH test server (testuser@localhost:22) is accessible"
else
    echo "⚠️  SSH test server is not accessible. You can still use the application with external SSH servers."
fi
echo ""

# Create log directory
mkdir -p logs

# Check for existing processes
echo "🔍 Checking for existing processes..."
existing_frontend=$(ss -tulpn | grep ":3000" | wc -l)
existing_backend=$(ss -tulpn | grep ":8000" | wc -l)

if [ $existing_frontend -gt 0 ]; then
    echo "⚠️  Port 3000 is already in use (Frontend)"
    echo "   Run './scripts/stop-dev.sh' to stop existing servers"
fi

if [ $existing_backend -gt 0 ]; then
    echo "⚠️  Port 8000 is already in use (Backend)"
    echo "   Run './scripts/stop-dev.sh' to stop existing servers"
fi

if [ $existing_frontend -gt 0 ] || [ $existing_backend -gt 0 ]; then
    echo ""
    echo "🤔 Would you like to stop existing processes and continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping existing processes..."
        ./scripts/stop-dev.sh
        sleep 2
    else
        echo "❌ Aborting. Please stop existing processes manually."
        exit 1
    fi
fi

echo ""
echo "📋 Available Commands:"
echo "=================================================="
echo "1. 🏃 Quick Start (Both servers)"
echo "2. 📦 Start Backend Only (Port 8000)"
echo "3. 🌐 Start Frontend Only (Port 3000)"
echo "4. 🔍 Check Status"
echo "5. 📝 View Logs"
echo "6. 🛑 Stop All Servers"
echo "7. ❌ Exit"
echo "=================================================="
echo ""

# Interactive menu loop
while true; do
    echo -n "👆 Select option (1-7): "
    read -r choice
    
    case $choice in
        1)
            echo ""
            echo "🏃 Starting both servers..."
            ./scripts/start-backend.sh
            sleep 3
            ./scripts/start-frontend.sh
            echo ""
            echo "✅ Both servers started!"
            echo "🌐 Frontend: http://localhost:3000"
            echo "📦 Backend:  http://localhost:8000"
            ;;
        2)
            echo ""
            echo "📦 Starting Backend Server (Port 8000)..."
            ./scripts/start-backend.sh
            ;;
        3)
            echo ""
            echo "🌐 Starting Frontend Server (Port 3000)..."
            ./scripts/start-frontend.sh
            ;;
        4)
            echo ""
            echo "🔍 Checking server status..."
            ./scripts/check-status.sh
            ;;
        5)
            echo ""
            echo "📝 Opening logs (Press Ctrl+C to exit log view)..."
            tail -f logs/backend.log logs/frontend.log 2>/dev/null || echo "No logs found. Start servers first."
            ;;
        6)
            echo ""
            echo "🛑 Stopping all servers..."
            ./scripts/stop-dev.sh
            ;;
        7)
            echo ""
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please select 1-7."
            ;;
    esac
    
    echo ""
    echo "📋 Commands: [1]Quick Start [2]Backend [3]Frontend [4]Status [5]Logs [6]Stop [7]Exit"
    echo ""
done