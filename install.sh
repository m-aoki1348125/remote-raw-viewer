#!/bin/bash

# Remote Raw Viewer - One-Click Installation Script
# Usage: curl -sSL https://raw.githubusercontent.com/your-repo/remote-raw-viewer/main/install.sh | bash
# Or: git clone <repo> && cd remote-raw-viewer && ./install.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Remote Raw Viewer"
INSTALL_DIR="/opt/remote-raw-viewer"
LOG_FILE="/tmp/install-$(date +%Y%m%d-%H%M%S).log"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  Remote Raw Viewer                          ║"
    echo "║                Production Installation                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

prompt_user() {
    local prompt="$1"
    local default="$2"
    local response
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " response
        echo "${response:-$default}"
    else
        read -p "$prompt: " response
        echo "$response"
    fi
}

check_prerequisites() {
    log "🔍 Checking system prerequisites..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine OS version"
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "centos" ]] && [[ "$ID" != "rhel" ]]; then
        warn "OS $ID may not be fully supported. Continuing anyway..."
    fi
    
    # Check available space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 5242880 ]]; then # 5GB in KB
        error "Insufficient disk space. At least 5GB required."
    fi
    
    log "✅ Prerequisites check passed"
}

install_docker() {
    if command -v docker &> /dev/null; then
        log "✅ Docker already installed"
        return 0
    fi
    
    log "📦 Installing Docker..."
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log "✅ Docker and Docker Compose installed"
    log "⚠️  Please log out and log back in to use Docker without sudo"
}

install_application() {
    log "📦 Installing Remote Raw Viewer..."
    
    # Create installation directory
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown $USER:$USER "$INSTALL_DIR"
    
    # Copy files to installation directory
    if [[ -f "./docker-compose.prod.yml" ]]; then
        # Running from cloned repository
        log "📁 Copying files from current directory..."
        rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='build' --exclude='logs' \
              ./ "$INSTALL_DIR/"
    else
        # Download from repository
        log "📥 Cloning repository..."
        git clone https://github.com/your-repo/remote-raw-viewer.git "$INSTALL_DIR"
    fi
    
    cd "$INSTALL_DIR"
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    log "✅ Application files installed"
}

configure_environment() {
    log "⚙️  Configuring environment..."
    
    cd "$INSTALL_DIR"
    
    # Create .env.production from template
    if [[ ! -f ".env.production" ]]; then
        cp .env.production.template .env.production
        
        # Interactive configuration
        echo -e "${BLUE}Environment Configuration${NC}"
        echo "Please provide the following information:"
        
        local domain=$(prompt_user "Domain name (e.g., viewer.example.com)" "localhost")
        local email=$(prompt_user "Email for SSL certificate (Leave empty for self-signed)" "")
        
        # Update .env.production
        sed -i "s/your-domain.com/$domain/g" .env.production
        
        # Generate random secrets
        local session_secret=$(openssl rand -hex 16)
        local encryption_key=$(openssl rand -hex 16)
        
        sed -i "s/REPLACE_WITH_RANDOM_32_CHAR_STRING/$session_secret/" .env.production
        sed -i "0,/REPLACE_WITH_RANDOM_32_CHAR_STRING/s/REPLACE_WITH_RANDOM_32_CHAR_STRING/$encryption_key/" .env.production
        
        log "✅ Environment configured"
        
        # Store configuration for SSL setup
        echo "DOMAIN=$domain" > /tmp/install-config
        echo "EMAIL=$email" >> /tmp/install-config
    else
        log "✅ Environment already configured"
    fi
}

setup_ssl() {
    log "🔐 Setting up SSL certificates..."
    
    cd "$INSTALL_DIR"
    
    # Load configuration
    if [[ -f "/tmp/install-config" ]]; then
        source /tmp/install-config
        rm /tmp/install-config
    else
        local domain=$(prompt_user "Domain name" "localhost")
        local email=$(prompt_user "Email for SSL (empty for self-signed)" "")
    fi
    
    # Setup SSL
    if [[ -n "$email" ]] && [[ "$domain" != "localhost" ]]; then
        log "📜 Setting up Let's Encrypt certificate..."
        ./scripts/setup-ssl.sh -d "$domain" -e "$email"
    else
        log "📜 Setting up self-signed certificate..."
        ./scripts/setup-ssl.sh -d "$domain" --self-signed
    fi
    
    log "✅ SSL certificates configured"
}

setup_firewall() {
    log "🔥 Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 443/tcp
        sudo ufw allow 80/tcp
        log "✅ UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --reload
        log "✅ firewalld configured"
    else
        warn "No supported firewall found. Please configure manually:"
        warn "  - Allow SSH (port 22)"
        warn "  - Allow HTTPS (port 443)"
        warn "  - Allow HTTP (port 80)"
    fi
}

deploy_application() {
    log "🚀 Deploying application..."
    
    cd "$INSTALL_DIR"
    
    # Run deployment script
    ./scripts/deploy-production.sh
    
    log "✅ Application deployed successfully"
}

show_completion() {
    local domain=$(grep "APP_DOMAIN=" .env.production | cut -d'=' -f2)
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   Installation Complete!                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    echo "🎉 Remote Raw Viewer has been successfully installed!"
    echo
    echo -e "${BLUE}Access Information:${NC}"
    echo "• Web Interface: https://$domain"
    echo "• Installation Directory: $INSTALL_DIR"
    echo "• Log File: $LOG_FILE"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Add your Ubuntu Image Server connections via the web interface"
    echo "2. Configure SSH authentication (keys recommended)"
    echo "3. Test image browsing functionality"
    echo
    echo -e "${BLUE}Management Commands:${NC}"
    echo "• Status: docker-compose -f $INSTALL_DIR/docker-compose.prod.yml ps"
    echo "• Logs: docker-compose -f $INSTALL_DIR/docker-compose.prod.yml logs -f"
    echo "• Restart: docker-compose -f $INSTALL_DIR/docker-compose.prod.yml restart"
    echo "• Stop: docker-compose -f $INSTALL_DIR/docker-compose.prod.yml down"
    echo
    echo -e "${BLUE}Documentation:${NC}"
    echo "• Quick Start: $INSTALL_DIR/doc/QuickStartGuide.md"
    echo "• Deployment Guide: $INSTALL_DIR/doc/ProductionDeploymentGuide.md"
    echo "• Operations Manual: $INSTALL_DIR/doc/OperationalReadiness.md"
    echo
    echo -e "${YELLOW}Important:${NC}"
    if groups $USER | grep -q docker; then
        echo "• Docker is ready to use"
    else
        echo "• Please log out and log back in to use Docker commands"
    fi
    echo "• Configure your DNS to point $domain to this server"
    echo "• Ensure your Ubuntu Image Server is accessible via SSH"
    echo
}

main() {
    print_header
    
    log "Starting Remote Raw Viewer installation..."
    log "Installation log: $LOG_FILE"
    
    check_prerequisites
    install_docker
    install_application
    configure_environment
    setup_ssl
    setup_firewall
    deploy_application
    show_completion
    
    log "🎉 Installation completed successfully!"
}

# Handle script interruption
trap 'error "Installation interrupted"' INT TERM

# Show help
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Remote Raw Viewer Installation Script"
    echo ""
    echo "Usage:"
    echo "  $0                  # Interactive installation"
    echo "  $0 --help          # Show this help"
    echo ""
    echo "Requirements:"
    echo "  - Ubuntu 20.04+ or CentOS 8+"
    echo "  - At least 5GB free disk space"
    echo "  - Internet connection"
    echo "  - Non-root user with sudo privileges"
    echo ""
    echo "This script will:"
    echo "  1. Install Docker and Docker Compose"
    echo "  2. Install Remote Raw Viewer"
    echo "  3. Configure SSL certificates"
    echo "  4. Set up firewall rules"
    echo "  5. Deploy the application"
    echo ""
    exit 0
fi

# Run main installation
main "$@"