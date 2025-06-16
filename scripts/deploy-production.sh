#!/bin/bash

# Remote Raw Viewer - Production Deployment Script
# Usage: ./scripts/deploy-production.sh

set -e

echo "🚀 Remote Raw Viewer - Production Deployment"
echo "============================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Configuration
APP_DIR="/opt/remote-raw-viewer"
SSL_DIR="/opt/ssl"
BACKUP_DIR="/opt/backups/remote-raw-viewer"
LOG_FILE="/tmp/deployment-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log "❌ Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log "❌ Docker Compose is not installed"
        exit 1
    fi
    
    # Check if .env.production exists
    if [[ ! -f ".env.production" ]]; then
        log "❌ .env.production file not found"
        log "📝 Please copy .env.production.template to .env.production and configure it"
        exit 1
    fi
    
    # Check SSL certificates
    if [[ ! -f "$SSL_DIR/cert.pem" ]] || [[ ! -f "$SSL_DIR/private.key" ]]; then
        log "⚠️  SSL certificates not found in $SSL_DIR"
        log "📝 Please ensure SSL certificates are properly configured"
        read -p "Continue without SSL? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log "✅ Prerequisites check completed"
}

create_directories() {
    log "📁 Creating necessary directories..."
    
    sudo mkdir -p "$APP_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p /opt/ssh-keys
    
    # Set permissions
    sudo chown $USER:$USER "$APP_DIR"
    sudo chmod 755 "$APP_DIR"
    
    log "✅ Directories created"
}

backup_existing() {
    if [[ -d "$APP_DIR" ]] && [[ "$(ls -A $APP_DIR)" ]]; then
        log "💾 Creating backup of existing installation..."
        
        BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        sudo mkdir -p "$BACKUP_DIR"
        
        tar -czf "$BACKUP_FILE" -C "$APP_DIR" . 2>/dev/null || true
        log "✅ Backup created: $BACKUP_FILE"
    fi
}

deploy_application() {
    log "📦 Deploying application..."
    
    # Copy files to deployment directory
    rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='build' \
          ./ "$APP_DIR/"
    
    cd "$APP_DIR"
    
    # Build and start services
    log "🔨 Building Docker images..."
    docker-compose -f docker-compose.prod.yml build
    
    log "🚀 Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log "✅ Application deployed successfully"
}

verify_deployment() {
    log "🔍 Verifying deployment..."
    
    # Wait for services to start
    sleep 30
    
    # Check if containers are running
    if docker-compose -f "$APP_DIR/docker-compose.prod.yml" ps | grep -q "Up"; then
        log "✅ Containers are running"
    else
        log "❌ Some containers failed to start"
        docker-compose -f "$APP_DIR/docker-compose.prod.yml" logs
        exit 1
    fi
    
    # Test HTTP endpoints
    if curl -f http://localhost:3000/health &>/dev/null; then
        log "✅ Frontend health check passed"
    else
        log "⚠️  Frontend health check failed"
    fi
    
    if curl -f http://localhost:8000/api/health &>/dev/null; then
        log "✅ Backend health check passed"
    else
        log "⚠️  Backend health check failed"
    fi
}

setup_monitoring() {
    log "📊 Setting up monitoring..."
    
    # Create log rotation
    sudo tee /etc/logrotate.d/remote-raw-viewer > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF
    
    # Create systemd service for monitoring
    sudo tee /etc/systemd/system/remote-raw-viewer.service > /dev/null <<EOF
[Unit]
Description=Remote Raw Viewer
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable remote-raw-viewer.service
    
    log "✅ Monitoring setup completed"
}

show_completion_info() {
    log "🎉 Deployment completed successfully!"
    echo
    echo "📋 Deployment Summary:"
    echo "====================="
    echo "• Application Directory: $APP_DIR"
    echo "• SSL Directory: $SSL_DIR"
    echo "• Backup Directory: $BACKUP_DIR"
    echo "• Deployment Log: $LOG_FILE"
    echo
    echo "🔗 Access URLs:"
    echo "• Frontend: https://$(hostname):443"
    echo "• Backend API: https://$(hostname):443/api"
    echo "• Health Check: https://$(hostname):443/health"
    echo
    echo "🛠️  Management Commands:"
    echo "• View logs: docker-compose -f $APP_DIR/docker-compose.prod.yml logs -f"
    echo "• Restart: docker-compose -f $APP_DIR/docker-compose.prod.yml restart"
    echo "• Stop: docker-compose -f $APP_DIR/docker-compose.prod.yml down"
    echo "• Status: docker-compose -f $APP_DIR/docker-compose.prod.yml ps"
    echo
    echo "📝 Next Steps:"
    echo "1. Configure SSL certificates in $SSL_DIR"
    echo "2. Add Ubuntu Image Server connections via web interface"
    echo "3. Test image browsing functionality"
    echo "4. Configure firewall rules"
    echo "5. Set up regular backups"
    echo
}

# Main execution
main() {
    log "Starting deployment process..."
    
    check_prerequisites
    create_directories
    backup_existing
    deploy_application
    verify_deployment
    setup_monitoring
    show_completion_info
    
    log "🎉 Deployment process completed successfully!"
}

# Execute main function
main "$@"