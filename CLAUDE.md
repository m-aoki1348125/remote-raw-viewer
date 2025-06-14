# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conversation Guidelines
- 常に日本語で会話する

## Development Philosophy

### Test-Driven Development (TDD)

- 原則としてテスト駆動開発（TDD）で進める
- 期待される入出力に基づき、まずテストを作成する
- 実装コードは書かず、テストのみを用意する
- テストを実行し、失敗を確認する
- テストが正しいことを確認できた段階でコミットする
- その後、テストをパスさせる実装を進める
- 実装中はテストを変更せず、コードを修正し続ける
- すべてのテストが通過するまで繰り返す
## Project Overview

Remote Image Viewer is a web application that runs as a Docker container, allowing users to securely browse and view images stored on remote servers through a web browser. The application eliminates the need for manual file transfers and provides a thumbnail gallery interface for image inspection.

## Architecture

3-tier architecture:
- **Frontend**: Web browser client (HTML/CSS/JavaScript, likely React or Vue.js)
- **Backend**: Web application server running in Docker container (candidates: Node.js/Express, Python/Django/Flask, or Go)  
- **Agent**: CLI script deployed on target image storage servers for file operations

## Key Features to Implement

### Core Functionality
- SSH connection management to remote servers
- Directory tree browsing interface with breadcrumb navigation
- Thumbnail gallery generation with lazy loading
- **5-stage thumbnail size control** (Small, Medium, Large, XLarge, XXLarge)
- Full-size image preview in modal/lightbox
- Multi-image download capability
- File metadata display on hover

### Special Requirements
- RAW image processing:
  - 327,680 bytes → 640x512 grayscale
  - Perfect square file sizes → sqrt(size) x sqrt(size) grayscale
  - Invalid sizes should be skipped with error logging
- Support for JPEG, PNG, GIF, WebP, and RAW formats
- HTTPS encryption for all communications
- Responsive UI for large directories (>1000 images)

## Security Considerations
- SSH credentials must be securely stored on backend
- All browser-server communication via HTTPS
- No client-side credential storage

## Deployment Target
- Backend: Docker container on Linux
- Client: Modern browsers on Windows 11
- Storage servers: Major Linux distributions

## Detailed Requirements

### Functional Requirements

**FR-1: Server Connection**
- Backend server manages SSH connections
- Users select pre-configured target servers from Web UI

**FR-2: Directory Tree View**
- Display server's file system in tree-like structure after connection

**FR-3: Thumbnail Gallery**
- Display thumbnail gallery for supported image files (JPEG, PNG, GIF, WebP, RAW) in selected directory

**FR-4: Image Preview**
- Clicking thumbnail opens full-size image in modal window (lightbox)

**FR-5: Image Download**
- Users can select one or more images to download via browser's download functionality

**FR-6: Metadata Display**
- Hovering over thumbnail displays filename, size, and last modified date

**FR-7: RAW Image Processing**
- Support rendering monochrome raw image data:
  - 327,680 bytes → 640x512 grayscale image
  - Perfect square file size (N*N) → sqrt(size) x sqrt(size) grayscale image
  - Non-conforming files skipped with error logging

**FR-8: Thumbnail Size Control**
- 5-stage size adjustment: Small, Medium, Large, XLarge, XXLarge
- Responsive grid layout that adapts to screen size
- Intuitive controls with +/- buttons and size indicator
- Settings persistence across browser sessions

### Non-Functional Requirements

**NFR-1: Performance**
- UI responsive with large directories (>1000 images)
- Lazy-loaded thumbnails for improved page load times and reduced network traffic

**NFR-2: Security**
- HTTPS encryption for all browser-server communication
- Secure SSH credential storage and management on backend server

**NFR-3: Usability**
- Simple and intuitive web interface for non-technical users
- Flexible thumbnail size adjustment for different screen sizes and user preferences
- Breadcrumb navigation for easy directory traversal

**NFR-4: Platform Support**
- Client: Modern web browsers (Chrome, Edge) on Windows 11
- Storage Server: Major Linux distributions

**NFR-5: Deployment**
- Backend packaged as Docker container for portability

### Component Responsibilities

**Frontend (Web Browser)**
- Renders user interface and handles user interactions
- Implementation: HTML, CSS, JavaScript (React or Vue.js recommended)

**Backend (Web Application Server)**
- Serves frontend UI (HTML/CSS/JS)
- Securely manages SSH credentials and connections
- Executes server-side agent via SSH and returns results
- Tech Stack: Node.js (Express), Python (Django, Flask), or Go

**Server-side Agent (CLI Script)**
- Performs file operations and image processing on target server
- Generates file lists (JSON format) for directories
- Creates thumbnails dynamically (including RAW images) using ImageMagick or Pillow
- Returns data via standard output or temporary files

### Out of Scope
- Image editing or manipulation features
- Advanced file management (upload, delete, rename, move)
- Support for protocols other than SSH/SFTP

## Implementation Status

### ✅ Completed Features
- **SSH Connection Management**: Full CRUD operations with secure credential storage
- **Directory Navigation**: Tree view with breadcrumb navigation and parent directory navigation
- **Image Gallery**: Responsive thumbnail grid with lazy loading
- **RAW Image Processing**: Support for 640x512 and perfect square RAW files
- **Thumbnail Size Control**: 5-stage size adjustment with persistent settings
- **Image Preview**: Modal lightbox with full-size image display
- **Multi-format Support**: JPEG, PNG, GIF, WebP, and RAW image formats
- **Download Functionality**: Single and multiple image download as ZIP
- **End-to-End Testing**: Comprehensive test suite covering all major components

### 🔧 Technical Implementation
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Agent**: Python 3 + PIL/Pillow for image processing
- **Architecture**: 3-tier with SSH-based remote execution
- **Testing**: Jest + Supertest for comprehensive coverage
- **Development Environment**: WSL2 + Docker support