#!/bin/bash

# Stop Development Servers Script

echo "🛑 Stopping development servers..."

# Function to stop process by PID file
stop_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Stopping $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                echo "⚠️  Force killing $service_name..."
                kill -9 "$pid"
            fi
            echo "✅ $service_name stopped"
        else
            echo "ℹ️  $service_name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "ℹ️  No PID file found for $service_name"
    fi
}

# Function to stop process by port
stop_by_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(ss -tulpn | grep ":$port" | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
    if [ -n "$pid" ]; then
        echo "🛑 Stopping $service_name on port $port (PID: $pid)..."
        kill "$pid" 2>/dev/null
        sleep 2
        if kill -0 "$pid" 2>/dev/null; then
            echo "⚠️  Force killing $service_name..."
            kill -9 "$pid" 2>/dev/null
        fi
        echo "✅ $service_name stopped"
    else
        echo "ℹ️  No process found on port $port"
    fi
}

# Stop backend server
echo "📦 Stopping backend server..."
stop_by_pid_file "logs/backend.pid" "Backend"
stop_by_port "8000" "Backend"

# Stop frontend server
echo "🌐 Stopping frontend server..."
stop_by_pid_file "logs/frontend.pid" "Frontend"
stop_by_port "3000" "Frontend"

# Also check for any rogue processes
echo "🔍 Checking for remaining processes..."

# Kill any remaining Vite processes
pkill -f "vite" 2>/dev/null && echo "✅ Stopped remaining Vite processes"

# Kill any remaining npm run dev processes
pkill -f "npm run dev" 2>/dev/null && echo "✅ Stopped remaining npm processes"

# Clean up any processes on ports 3001, 3002 (in case they exist)
stop_by_port "3001" "Additional Frontend"
stop_by_port "3002" "Additional Frontend"

echo ""
echo "✅ All development servers stopped"
echo "🔍 Current port status:"
ss -tulpn | grep -E ":(3000|3001|3002|8000)" || echo "   No services running on development ports"