# Remote Raw Viewer

3-tier web application for securely browsing and viewing images stored on remote servers through SSH connections.

## Project Status

✅ **ALL PHASES COMPLETE**: Full implementation with working features

### Current Implementation

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (Port 3000)
- **Backend**: Node.js + Express + TypeScript (Port 8000)  
- **Agent**: Python 3.12 + Pillow for image processing
- **Testing**: Jest (Frontend), Supertest (Backend), unittest (Agent)

## Features Implemented

✅ **SSH Connection Management**: CRUD operations for server connections  
✅ **Directory Tree Browsing**: Recursive directory navigation  
✅ **Image Gallery**: Thumbnail grid with lazy loading  
✅ **RAW Image Processing**: Support for 640x512 and perfect square formats  
✅ **Image Preview**: Lightbox modal with metadata display  
✅ **Download Functionality**: Single and multiple image downloads  
✅ **Responsive UI**: Optimized for large image directories

## Quick Start (WSL/Linux)

### 1. Setup Dependencies

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

### 2. Start Development Environment

```bash
# Option A: Use the automated startup script
./start-dev.sh

# Option B: Start manually in separate terminals
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

### 3. Access the Application

- **Web Interface**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## API Testing

Test the agent functionality:

```bash
# Test agent commands
./test-agent.sh

# Manual agent testing
cd agent && source venv/bin/activate

# List directory contents
PYTHONPATH=src python3 src/main.py list --path /path/to/images

# Generate thumbnail
PYTHONPATH=src python3 src/main.py thumbnail --path /path/to/image.raw

# Get file metadata
PYTHONPATH=src python3 src/main.py metadata --path /path/to/file
```

## Test Data

Sample test files are available in `test-data/images/`:
- `test_640x512.raw` - 640×512 grayscale RAW image (327,680 bytes)
- `test_100x100.raw` - 100×100 perfect square RAW image (10,000 bytes)
- `test.txt` - Text file for testing file filtering

## Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Agent tests
cd agent && source venv/bin/activate && PYTHONPATH=src python3 -m unittest discover tests/ -v
```

## Development Notes

- **SSH Connections**: In development, connections will fail unless you have actual SSH servers configured
- **Image Processing**: RAW images are processed as grayscale data
- **Security**: All browser-server communication uses HTTPS in production
- **Performance**: UI handles large directories (>1000 images) with lazy loading

## File Structure

```
├── backend/          # Express.js API server
├── frontend/         # React web application  
├── agent/           # Python CLI for remote operations
├── doc/             # Requirements and implementation plans
├── test-data/       # Sample files for testing
├── start-dev.sh     # Development environment startup
└── test-agent.sh    # Agent functionality testing
```

## Technology Stack

| Component | Technologies |
|-----------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express, TypeScript, node-ssh, Winston |
| Agent | Python 3.12, Pillow (PIL), argparse |
| Testing | Jest, Supertest, unittest, @testing-library/react |

## Next Steps

1. Configure actual SSH connections to remote servers
2. Add authentication and user management
3. Implement production deployment with Docker
4. Add advanced image filtering and search capabilities
5. Enable bulk operations and directory synchronization

---

🚀 **Status**: Core functionality implemented and tested

## Documentation

- [Requirements Specification](doc/RequirementsSpecification.md)
- [Implementation Plan](doc/ImplementationPlan.md)
- [Project Guidelines](CLAUDE.md)