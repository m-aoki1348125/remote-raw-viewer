#!/bin/bash

# SSL Certificate Setup Script for Remote Raw Viewer
# Supports Let's Encrypt and self-signed certificates

set -e

DOMAIN=""
EMAIL=""
SSL_DIR="/opt/ssl"
SELF_SIGNED=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        --self-signed)
            SELF_SIGNED=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 -d DOMAIN [-e EMAIL] [--self-signed]"
            echo ""
            echo "Options:"
            echo "  -d, --domain      Domain name for the certificate"
            echo "  -e, --email       Email for Let's Encrypt registration"
            echo "  --self-signed     Generate self-signed certificate instead"
            echo "  -h, --help        Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate input
if [[ -z "$DOMAIN" ]]; then
    echo "❌ Domain is required. Use -d or --domain option."
    exit 1
fi

if [[ "$SELF_SIGNED" == false ]] && [[ -z "$EMAIL" ]]; then
    echo "❌ Email is required for Let's Encrypt. Use -e or --email option, or --self-signed for self-signed certificate."
    exit 1
fi

echo "🔐 SSL Certificate Setup for Remote Raw Viewer"
echo "=============================================="
echo "Domain: $DOMAIN"
echo "Certificate Type: $([ "$SELF_SIGNED" == true ] && echo "Self-signed" || echo "Let's Encrypt")"
echo

# Create SSL directory
sudo mkdir -p "$SSL_DIR"

if [[ "$SELF_SIGNED" == true ]]; then
    echo "📝 Generating self-signed certificate..."
    
    # Generate private key
    sudo openssl genrsa -out "$SSL_DIR/private.key" 2048
    
    # Generate certificate signing request
    sudo openssl req -new -key "$SSL_DIR/private.key" -out "$SSL_DIR/cert.csr" -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Generate self-signed certificate
    sudo openssl x509 -req -days 365 -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/private.key" -out "$SSL_DIR/cert.pem"
    
    # Clean up CSR
    sudo rm "$SSL_DIR/cert.csr"
    
    echo "✅ Self-signed certificate generated"
    echo "⚠️  Note: Browsers will show security warnings for self-signed certificates"
    
else
    echo "🔒 Setting up Let's Encrypt certificate..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing certbot..."
        if command -v apt &> /dev/null; then
            sudo apt update
            sudo apt install -y certbot
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot
        else
            echo "❌ Unable to install certbot. Please install it manually."
            exit 1
        fi
    fi
    
    # Stop any running web servers that might conflict
    echo "⏹️  Stopping existing web servers..."
    sudo systemctl stop nginx 2>/dev/null || true
    sudo systemctl stop apache2 2>/dev/null || true
    
    # Generate certificate
    echo "🌐 Generating Let's Encrypt certificate..."
    sudo certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"
    
    # Copy certificates to our SSL directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/private.key"
    
    echo "✅ Let's Encrypt certificate generated"
    
    # Setup auto-renewal
    echo "🔄 Setting up automatic renewal..."
    
    # Create renewal script
    sudo tee /usr/local/bin/renew-ssl.sh > /dev/null <<EOF
#!/bin/bash
certbot renew --quiet
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/private.key"
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml restart frontend
EOF
    
    sudo chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add to crontab
    (sudo crontab -l 2>/dev/null || true; echo "0 2 * * 0 /usr/local/bin/renew-ssl.sh") | sudo crontab -
    
    echo "✅ Auto-renewal configured"
fi

# Set proper permissions
sudo chown root:root "$SSL_DIR"/*
sudo chmod 600 "$SSL_DIR"/private.key
sudo chmod 644 "$SSL_DIR"/cert.pem

# Verify certificates
echo "🔍 Verifying certificate..."
if sudo openssl x509 -in "$SSL_DIR/cert.pem" -text -noout > /dev/null 2>&1; then
    echo "✅ Certificate verification successful"
    
    # Show certificate info
    echo
    echo "📜 Certificate Information:"
    echo "=========================="
    sudo openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)"
else
    echo "❌ Certificate verification failed"
    exit 1
fi

# Show firewall configuration
echo
echo "🔥 Firewall Configuration:"
echo "========================="
echo "Make sure these ports are open:"
echo "• Port 443 (HTTPS)"
echo "• Port 80 (HTTP redirect)"
echo
echo "For UFW:"
echo "sudo ufw allow 443/tcp"
echo "sudo ufw allow 80/tcp"
echo
echo "For iptables:"
echo "sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT"
echo "sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT"

echo
echo "🎉 SSL setup completed!"
echo "Certificate files:"
echo "• Certificate: $SSL_DIR/cert.pem"
echo "• Private Key: $SSL_DIR/private.key"
echo
echo "Next steps:"
echo "1. Update your DNS to point $DOMAIN to this server"
echo "2. Configure your firewall to allow HTTPS traffic"
echo "3. Deploy the application using ./scripts/deploy-production.sh"