#!/bin/bash

# SSH Test Server Setup Script
# Creates a test environment with SSH server and sample images

echo "🚀 Setting up SSH Test Server Environment"
echo "=================================================="

# Check if running as root (allow in WSL test environment)
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root - this is acceptable in WSL test environment"
    SUDO_PREFIX=""
else
    SUDO_PREFIX="sudo"
fi

# Install required packages
echo "📦 Installing required packages..."
$SUDO_PREFIX apt update
$SUDO_PREFIX apt install -y openssh-server imagemagick python3

# Create test user
echo "👤 Setting up test user..."
TEST_USER="testuser"
TEST_PASS="testpass123"

# Create user if it doesn't exist
if ! id "$TEST_USER" &>/dev/null; then
    $SUDO_PREFIX useradd -m -s /bin/bash "$TEST_USER"
    echo "$TEST_USER:$TEST_PASS" | $SUDO_PREFIX chpasswd
    echo "✅ Created user: $TEST_USER"
else
    echo "ℹ️  User $TEST_USER already exists"
    echo "$TEST_USER:$TEST_PASS" | $SUDO_PREFIX chpasswd
    echo "✅ Updated password for: $TEST_USER"
fi

# Add test user to required groups
$SUDO_PREFIX usermod -a -G sudo "$TEST_USER" 2>/dev/null || true

# Configure SSH
echo "🔐 Configuring SSH server..."
$SUDO_PREFIX mkdir -p /etc/ssh/sshd_config.d

# Create SSH config for test environment
$SUDO_PREFIX tee /etc/ssh/sshd_config.d/test-server.conf > /dev/null << 'EOF'
# Test SSH Server Configuration
Port 22
PasswordAuthentication yes
PubkeyAuthentication yes
PermitRootLogin no
AllowUsers testuser
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# Create sample directory structure
echo "📁 Setting up sample directory structure..."
sudo -u "$TEST_USER" bash << 'EOF'
cd /home/testuser

# Create directory structure
mkdir -p images/raw images/jpeg images/png documents temp

# Create sample text files
echo "This is a sample document" > documents/readme.txt
echo "Configuration file" > documents/config.txt
echo "Test data $(date)" > temp/test.log

# Create sample RAW file (640x512 grayscale = 327,680 bytes)
python3 -c "
import random
width, height = 640, 512
data = bytes([random.randint(0, 255) for _ in range(width * height)])
with open('images/raw/sample_640x512.raw', 'wb') as f:
    f.write(data)
print(f'Created sample_640x512.raw ({len(data)} bytes)')
"

# Create perfect square RAW file (256x256 = 65,536 bytes)
python3 -c "
import random
size = 256
data = bytes([random.randint(0, 255) for _ in range(size * size)])
with open('images/raw/sample_256x256.raw', 'wb') as f:
    f.write(data)
print(f'Created sample_256x256.raw ({len(data)} bytes)')
"

# Create sample images using ImageMagick if available
if command -v convert >/dev/null; then
    convert -size 100x100 xc:blue images/jpeg/sample_blue.jpg 2>/dev/null || echo "Failed to create JPEG"
    convert -size 150x150 xc:red images/jpeg/sample_red.jpg 2>/dev/null || echo "Failed to create JPEG"
    convert -size 200x200 xc:green images/png/sample_green.png 2>/dev/null || echo "Failed to create PNG"
    convert -size 120x120 xc:yellow images/png/sample_yellow.png 2>/dev/null || echo "Failed to create PNG"
    echo "✅ Created sample images"
else
    echo "⚠️  ImageMagick not available, skipping sample image creation"
fi

# Set permissions
chmod 755 /home/testuser
chmod -R 644 /home/testuser/images/*/* 2>/dev/null || true
chmod -R 755 /home/testuser/images/*/ 2>/dev/null || true
find /home/testuser -type d -exec chmod 755 {} \; 2>/dev/null || true

EOF

# Start SSH service
echo "🔌 Starting SSH service..."
$SUDO_PREFIX systemctl enable ssh
$SUDO_PREFIX systemctl start ssh

# Check SSH service status
if $SUDO_PREFIX systemctl is-active --quiet ssh; then
    echo "✅ SSH service is running"
else
    echo "❌ SSH service failed to start"
    $SUDO_PREFIX systemctl status ssh
    exit 1
fi

# Test SSH connection (install sshpass if needed)
echo "🧪 Testing SSH connection..."
if ! command -v sshpass >/dev/null; then
    echo "Installing sshpass for testing..."
    $SUDO_PREFIX apt install -y sshpass
fi

sleep 2

if sshpass -p "$TEST_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 "$TEST_USER@localhost" 'exit' 2>/dev/null; then
    echo "✅ SSH connection test successful"
else
    echo "❌ SSH connection test failed"
    echo "   Checking SSH service status..."
    $SUDO_PREFIX systemctl status ssh --no-pager
fi

# Display file structure
echo ""
echo "📂 Created directory structure:"
sudo -u "$TEST_USER" bash << 'EOF'
cd /home/testuser
find . -type f -exec ls -lh {} \; | head -20
EOF

echo ""
echo "✅ SSH Test Server Setup Complete!"
echo "=================================================="
echo "🔗 Connection Details:"
echo "   Host: localhost"
echo "   Port: 22"
echo "   Username: $TEST_USER"
echo "   Password: $TEST_PASS"
echo ""
echo "📂 Test Directories:"
echo "   /home/$TEST_USER/images/raw/     - RAW image files"
echo "   /home/$TEST_USER/images/jpeg/    - JPEG image files"
echo "   /home/$TEST_USER/images/png/     - PNG image files"
echo "   /home/$TEST_USER/documents/      - Text documents"
echo "   /home/$TEST_USER/temp/           - Temporary files"
echo ""
echo "🧪 Test Connection:"
echo "   ssh $TEST_USER@localhost"
echo "   sshpass -p '$TEST_PASS' ssh $TEST_USER@localhost"
echo ""
echo "🔒 Security Note:"
echo "   This is a TEST environment only!"
echo "   Do not use these credentials in production!"