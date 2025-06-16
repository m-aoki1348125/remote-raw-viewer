#!/bin/bash

# Check Development Environment Status Script

echo "🔍 Development Environment Status"
echo "=================================================="

# Function to check port status
check_port() {
    local port=$1
    local service_name=$2
    local url=$3
    
    if ss -tulpn | grep -q ":$port"; then
        local pid=$(ss -tulpn | grep ":$port" | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
        echo "✅ $service_name: Running (PID: $pid) - $url"
        
        # Try to make a simple HTTP request to verify service is responding
        if [ "$port" = "8000" ]; then
            local health_check=$(curl -s http://localhost:8000/health 2>/dev/null | grep -o '"status":"OK"')
            if [ -n "$health_check" ]; then
                echo "   💚 Health check: OK"
            else
                echo "   ⚠️  Health check: Failed"
            fi
        elif [ "$port" = "3000" ]; then
            if curl -s http://localhost:3000 >/dev/null 2>&1; then
                echo "   💚 HTTP response: OK"
            else
                echo "   ⚠️  HTTP response: Failed"
            fi
        fi
    else
        echo "❌ $service_name: Not running - $url"
    fi
}

# Check backend status
echo "📦 Backend Server (Express.js)"
check_port "8000" "Backend API" "http://localhost:8000"

echo ""

# Check frontend status
echo "🌐 Frontend Server (Vite)"
check_port "3000" "Frontend App" "http://localhost:3000"

echo ""

# Check for additional ports
echo "🔍 Additional Ports Check"
check_port "3001" "Additional Frontend" "http://localhost:3001"
check_port "3002" "Additional Frontend" "http://localhost:3002"

echo ""

# Show PID files status
echo "📝 PID Files Status"
if [ -f "logs/backend.pid" ]; then
    backend_pid=$(cat logs/backend.pid)
    if kill -0 "$backend_pid" 2>/dev/null; then
        echo "✅ Backend PID file: Valid (PID: $backend_pid)"
    else
        echo "⚠️  Backend PID file: Stale (PID: $backend_pid - process not running)"
    fi
else
    echo "ℹ️  Backend PID file: Not found"
fi

if [ -f "logs/frontend.pid" ]; then
    frontend_pid=$(cat logs/frontend.pid)
    if kill -0 "$frontend_pid" 2>/dev/null; then
        echo "✅ Frontend PID file: Valid (PID: $frontend_pid)"
    else
        echo "⚠️  Frontend PID file: Stale (PID: $frontend_pid - process not running)"
    fi
else
    echo "ℹ️  Frontend PID file: Not found"
fi

echo ""

# Show log files status
echo "📋 Log Files"
if [ -f "logs/backend.log" ]; then
    backend_log_size=$(stat -f%z logs/backend.log 2>/dev/null || stat -c%s logs/backend.log 2>/dev/null)
    echo "📦 Backend log: logs/backend.log (${backend_log_size} bytes)"
else
    echo "❌ Backend log: Not found"
fi

if [ -f "logs/frontend.log" ]; then
    frontend_log_size=$(stat -f%z logs/frontend.log 2>/dev/null || stat -c%s logs/frontend.log 2>/dev/null)
    echo "🌐 Frontend log: logs/frontend.log (${frontend_log_size} bytes)"
else
    echo "❌ Frontend log: Not found"
fi

echo ""

# Quick recommendations
echo "💡 Quick Actions"
if ! ss -tulpn | grep -q ":8000" && ! ss -tulpn | grep -q ":3000"; then
    echo "🏃 Both servers stopped - Run: ./scripts/start-backend.sh && ./scripts/start-frontend.sh"
elif ! ss -tulpn | grep -q ":8000"; then
    echo "📦 Backend stopped - Run: ./scripts/start-backend.sh"
elif ! ss -tulpn | grep -q ":3000"; then
    echo "🌐 Frontend stopped - Run: ./scripts/start-frontend.sh"
else
    echo "✅ All servers running - Access: http://localhost:3000"
fi

echo "📝 View logs - Run: tail -f logs/backend.log logs/frontend.log"
echo "🛑 Stop all - Run: ./scripts/stop-dev.sh"