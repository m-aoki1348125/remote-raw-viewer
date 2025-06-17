#!/bin/bash

# Agent Test Script with Virtual Environment

echo "🧪 Testing Remote Raw Viewer Agent"
echo "=================================="

cd agent

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run setup first."
    exit 1
fi

echo "📦 Activating virtual environment..."
source venv/bin/activate

# Test agent functionality
echo "🔍 Testing image processor..."
python3 -c "
import sys
sys.path.append('src')
from image_processor import ImageProcessor
processor = ImageProcessor()
print('✅ ImageProcessor loaded successfully')
"

echo "🔍 Testing file manager..."
python3 -c "
import sys
sys.path.append('src')
from file_manager import FileManager
fm = FileManager()
print('✅ FileManager loaded successfully')
"

echo "🔍 Testing main agent script..."
PYTHONPATH=src python3 src/main.py --help

echo ""
echo "✅ Agent tests completed successfully!"
echo "=================================="