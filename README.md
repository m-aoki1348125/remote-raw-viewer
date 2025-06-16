# Remote Raw Viewer

🖼️ **Secure SSH-based image browser for remote servers with advanced thumbnail gallery**

Remote Raw Viewer is a production-ready web application that enables secure browsing and viewing of images stored on remote Linux servers through SSH connections. Perfect for Windows 11 clients accessing Ubuntu image servers with support for JPEG, PNG, GIF, WebP, and RAW image formats.

## ✨ Key Features

### 🔐 **Secure SSH Connectivity**
- Real-time SSH connections to remote Ubuntu/Linux servers
- Support for SSH key authentication and password authentication
- Secure credential management with encrypted storage

### 🖼️ **Advanced Image Gallery**
- **Real image thumbnail display** with SSH-based image retrieval
- **9-stage size control**: From tiny (8px) to giant (600px) thumbnails
- **RAW image processing**: Automatic handling of 640x512 and perfect square RAW files
- **Multi-format support**: JPEG, PNG, GIF, WebP, and RAW image formats

### 🎛️ **Intuitive User Interface**
- **Fullscreen responsive design** optimized for 2K/4K displays
- **Interactive directory navigation** with breadcrumb trails
- **Real-time search** across files and directories
- **Multi-select download** with batch operations
- **Toast notifications** and keyboard shortcuts

### 🚀 **Production Ready**
- **Docker containerization** with HTTPS/SSL support
- **Let's Encrypt integration** for automatic SSL certificates
- **Comprehensive monitoring** with health checks and logging
- **Auto-backup system** with configurable retention

## 🚀 Quick Installation

### One-Command Installation

```bash
# Clone and install
git clone https://github.com/your-repo/remote-raw-viewer.git
cd remote-raw-viewer
./install.sh
```

### Or Direct Installation

```bash
# Direct installation from web
curl -sSL https://raw.githubusercontent.com/your-repo/remote-raw-viewer/main/install.sh | bash
```

The installation script will automatically:
- Install Docker and Docker Compose
- Set up SSL certificates (Let's Encrypt or self-signed)
- Configure firewall rules
- Deploy the application with HTTPS
- Create monitoring and backup systems

## 📋 System Requirements

### Application Server (Remote Raw Viewer Host)
- **OS**: Ubuntu 22.04 LTS, CentOS 8+, or RHEL 8+
- **Resources**: 2 CPU cores, 4GB RAM, 20GB storage
- **Network**: Internet access and SSH access to image servers
- **Privileges**: Non-root user with sudo privileges

### Image Server (Target Ubuntu Server)
- **OS**: Ubuntu Server 16.04+
- **Services**: OpenSSH Server enabled
- **Tools**: `base64`, `ls`, `stat` commands (standard on most systems)
- **Optional**: ImageMagick for enhanced RAW image processing

### Client (Access)
- **OS**: Windows 11 (or any modern OS)
- **Browser**: Chrome 120+, Edge 120+, Firefox 115+
- **Network**: HTTPS access to Application Server

## 🔧 Configuration

### Environment Configuration

After installation, configure your environment:

```bash
# Edit production configuration
nano /opt/remote-raw-viewer/.env.production
```

Key settings:
- `APP_DOMAIN`: Your domain name
- `SSL_CERT_PATH`: SSL certificate path
- `SSH_KEYS_PATH`: SSH private keys directory

### SSH Server Setup

Configure your Ubuntu Image Server:

```bash
# Ensure SSH server is running
sudo systemctl enable ssh
sudo systemctl start ssh

# Create image user (recommended)
sudo useradd -m imageuser
sudo mkdir -p /data/images
sudo chown imageuser:imageuser /data/images

# Optional: Install ImageMagick for RAW processing
sudo apt install imagemagick
```

### SSL Certificate Setup

The installation script handles SSL automatically, but you can also configure manually:

```bash
# Let's Encrypt certificate
./scripts/setup-ssl.sh -d your-domain.com -e your-email@example.com

# Self-signed certificate
./scripts/setup-ssl.sh -d your-domain.com --self-signed
```

## 📖 Usage

### 1. Access the Web Interface

Navigate to `https://your-domain.com` in your browser.

### 2. Add Image Server Connection

1. Click **"Add Connection"**
2. Configure connection:
   - **Name**: Production Image Server
   - **Host**: `192.168.1.100` (your Ubuntu server IP)
   - **Port**: `22`
   - **Username**: `imageuser`
   - **Authentication**: SSH Key or Password

### 3. Browse Images

- **Navigate directories**: Click folders or use breadcrumb navigation
- **Adjust thumbnail size**: Use +/- controls (9 size levels)
- **Search files**: Type in the search box for instant filtering
- **Select images**: Click checkboxes for multi-selection
- **Download images**: Use download button for selected files

### 4. Advanced Features

- **Keyboard shortcuts**: Arrow keys for navigation, Space for selection
- **Fullscreen mode**: Optimized for large displays and multiple monitors
- **Performance monitoring**: Real-time performance metrics in UI
- **Error handling**: Comprehensive error messages and recovery

## 🛠️ Management

### Service Management

```bash
# Check status
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml ps

# View logs
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml logs -f

# Restart services
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml restart

# Stop services
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml down
```

### Updates

```bash
cd /opt/remote-raw-viewer
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### Backup

Automatic backups are configured, but you can create manual backups:

```bash
# Manual backup
/usr/local/bin/backup-remote-raw-viewer.sh

# View backups
ls -la /opt/backups/remote-raw-viewer/
```

## 🧪 Development Mode

For development and testing:

### Setup Dependencies

```bash
# Install Python dependencies (one-time setup)
cd agent
python3 -m venv venv
source venv/bin/activate
pip install pillow
cd ..

# Install Node.js dependencies (one-time setup)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Start Development Environment

```bash
# Use the automated startup script
./start-dev.sh

# Or start manually in separate terminals
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

### Access Development Server

- **Web Interface**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Test SSH Server**: Use `./setup-test-server-fixed.sh`

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Agent tests
cd agent && source venv/bin/activate && PYTHONPATH=src python3 -m unittest discover tests/ -v
```

## 📚 Documentation

- **[Quick Start Guide](doc/QuickStartGuide.md)**: Fastest path to deployment
- **[Production Deployment Guide](doc/ProductionDeploymentGuide.md)**: Comprehensive deployment instructions
- **[Operational Readiness](doc/OperationalReadiness.md)**: Pre-deployment checklist
- **[Requirements Specification](doc/RequirementsSpecification.md)**: Detailed technical requirements

## 🔧 Architecture

```
[Windows 11 Client] --HTTPS--> [Remote Raw Viewer] --SSH--> [Ubuntu Image Server]
       |                           |                              |
   Web Browser                React Frontend +               Image Files
   (Chrome/Edge)              Node.js Backend                (JPEG/PNG/RAW)
```

### Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript + node-ssh
- **Infrastructure**: Docker + Nginx + Let's Encrypt
- **Authentication**: SSH Key/Password authentication
- **Security**: HTTPS, secure headers, firewall configuration

## 🛡️ Security

- **HTTPS encryption** for all client-server communication
- **SSH key authentication** (recommended over passwords)
- **Secure credential storage** with backend-only SSH access
- **Firewall configuration** with minimal port exposure
- **Security headers** configured in Nginx
- **No client-side credential storage**

## 🐛 Troubleshooting

### Common Issues

**SSH Connection Failed**
```bash
# Test SSH connectivity
ssh -i /opt/ssh-keys/imageserver_key imageuser@ubuntu-server

# Check SSH service
sudo systemctl status ssh
```

**SSL Certificate Issues**
```bash
# Verify certificate
sudo openssl x509 -in /opt/ssl/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

**Application Not Starting**
```bash
# Check logs
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml logs

# Verify configuration
cd /opt/remote-raw-viewer && docker-compose config
```

### Log Files

- **Application logs**: `/opt/remote-raw-viewer/logs/`
- **System logs**: `journalctl -u remote-raw-viewer.service -f`
- **Installation logs**: `/tmp/install-*.log`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

[MIT License](LICENSE) - feel free to use this project for personal or commercial purposes.

## 🆘 Support

- **Documentation**: Check the `doc/` directory for comprehensive guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Logs**: Check application logs in `/opt/remote-raw-viewer/logs/`

---

**Made with ❤️ for secure remote image browsing**

🌟 **Star this repository if Remote Raw Viewer helped you manage your remote images securely!**