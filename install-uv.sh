#!/bin/bash

echo "🐍 Installing uv package manager"
echo "================================"

# Check if uv is already installed
if command -v uv &> /dev/null; then
    echo "✅ uv is already installed"
    uv --version
    exit 0
fi

# Install uv using the official installer
echo "📦 Downloading and installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH for current session
export PATH="$HOME/.local/bin:$PATH"

# Check installation
if command -v uv &> /dev/null; then
    echo "✅ uv installed successfully!"
    uv --version
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart your terminal or run: source ~/.bashrc"
    echo "2. Run: uv run setup-env"
    echo "3. Run: uv run start-dev"
else
    echo "❌ uv installation failed"
    echo "Manual installation: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi