# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conversation Guidelines
- 常に日本語で会話する

## Project Status: Production Deployment Ready 🚀

**Current Version**: v1.2.2 (Complete Thumbnail & Sort System)
**Last Updated**: 2025-06-17 19:40 JST
**Development Phase**: Production Ready with Advanced UI/UX Features

### Recent Major Achievements
- ✅ 完全なSSH接続とディレクトリブラウジング機能実装
- ✅ WSLテスト環境でのリアルタイムSSH接続検証済み
- ✅ RAW画像処理（640x512、256x256）動作確認済み
- ✅ 100+ UI/UXサイクル完了（軽量・高速・ユーザーフレンドリー）
- ✅ Toast通知、キーボードショートカット、検索機能実装
- ✅ パフォーマンスモニタリングとエラーハンドリング強化
- ✅ サムネイル表示でのファイル名・ディレクトリ名表示改善完了
- ✅ ディレクトリナビゲーション問題解決（SSHService修正）
- ✅ 実際のファイル操作とサムネイル生成動作確認済み
- ✅ **実際の画像サムネイル表示機能完全実装**
- ✅ **9段階サムネイルサイズ調整機能（tiny → giant 600x600px）**
- ✅ **フルスクリーンレスポンシブ対応完了**
- ✅ **大型画像詳細表示機能（最大600x600px）**
- ✅ **本番環境デプロイ用インフラ構築完了**
- ✅ **Docker設定、SSL証明書、自動デプロイスクリプト作成済み**
- ✅ **🔥 完全なSSH接続フォーム実装（パスワード、ポート、認証方式、テスト接続）**
- ✅ **🔥 無制限画像ズーム機能完全実装（Ctrl+スクロール、0.1x-50x、パン移動対応）**
- ✅ **🚀 UV-based自動化開発環境実装（3コマンドセットアップ、統合サーバー管理）**
- ✅ **⚡ ダウンロード機能完全修復（SSH経由ファイルダウンロード、UIレイアウト改善）**
- ✅ **🎯 完全なサムネイル表示システム（統一150x150正方形、アスペクト比保持、背景付き配置）**
- ✅ **📋 多機能ソートシステム（名前・サイズ・更新日時・種別、昇順/降順切り替え）**
- ✅ **📜 スクロール対応ギャラリー（レスポンシブ高さ制限、カスタムスクロールバー）**
- ✅ **🔐 Private Key認証完全対応（ペースト入力・ファイル選択両対応）**
- ✅ **🎨 UI/UX改善（画像とファイル名分離表示、Toast半透明化、全画面ディレクトリツリー）**

## Development Commands

### Server Management

#### UV-based自動化環境（推奨）
```bash
# 1. UVインストール（初回のみ）
./install-uv.sh

# 2. 環境セットアップ（初回のみ）
uv run setup-env

# 3. 開発サーバー起動（日常使用）
uv run start-dev
```

#### 従来方法
```bash
# バックエンド起動
./scripts/start-backend.sh

# フロントエンド起動  
./scripts/start-frontend.sh

# 統合開発環境起動（インタラクティブメニュー）
./start-dev.sh

# SSH テストサーバー起動
./setup-test-server-fixed.sh
```

### Test Environment
- **SSH Host**: localhost:22
- **Username**: testuser
- **Password**: testpass123
- **Test Directory**: /home/testuser/images/
- **Available**: RAW files, JPEG, PNG samples
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

**FR-8: Thumbnail Size Control** ✅ **COMPLETED**
- **9-stage size adjustment**: Tiny(8px), Small(12px), Medium(20px), Large(32px), XLarge(48px), XXLarge(64px), Huge(80px), Massive(96px), Giant(600px)
- **Responsive grid layout** that adapts to screen size with fullscreen support
- **Intuitive controls** with +/- buttons and 9-dot size indicator
- **Dynamic column adjustment** for 2K/4K displays (up to 32 columns)

**FR-9: Enhanced Thumbnail Display System** ✅ **COMPLETED**
- **Uniform square thumbnails**: All thumbnails generated as 150x150px squares
- **Aspect ratio preservation**: Original image proportions maintained with gray background
- **Distortion-free display**: No image stretching or cropping
- **ImageMagick optimization**: Background-centered placement for perfect visual consistency

**FR-10: Multi-Criteria Sorting System** ✅ **COMPLETED**
- **4 sort criteria**: Name (alphabetical), Size (file size), Modified (date/time), Type (directories first)
- **Bidirectional sorting**: Ascending/descending order with visual indicators
- **Real-time updates**: Instant sorting when criteria or direction changes
- **Search integration**: Sorting applies to filtered search results
- **Natural numeric sorting**: Intelligent file name ordering (file1, file2, file10)

**FR-11: Scrollable Gallery Interface** ✅ **COMPLETED**
- **Responsive height limits**: 384px (mobile) to 700px (desktop)
- **Custom scrollbar design**: Thin, semi-transparent with hover effects
- **Overflow handling**: Vertical scrolling for large image collections
- **Performance optimized**: Maintains smooth scrolling with 100+ images

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

### ✅ Completed & Verified Features (Enhanced Production Complete)
- **Real SSH Connection Management**: Live SSH connections with CRUD operations
- **Directory Navigation**: Real-time directory browsing over SSH with breadcrumb navigation
- **RAW Image Detection**: Automatic detection and processing of 640x512 and perfect square RAW files
- **Multi-format Support**: JPEG, PNG, GIF, WebP, and RAW image formats with proper icons
- **Modern UI Components**: Toast notifications, keyboard shortcuts, search functionality
- **Performance Monitoring**: Real-time performance metrics and error tracking
- **Status Indicators**: Connection status, system health, and operation feedback
- **Interactive Browse Experience**: Click-to-navigate directory tree with live SSH data
- **Thumbnail Gallery**: サムネイル表示でファイル名・ディレクトリ名が明確に表示
- **Working Directory Navigation**: ダブルクリックでのディレクトリ移動が正常動作
- **Real File Operations**: 実際のSSH経由でのファイル・ディレクトリ操作が完全動作
- **🎯 Actual Image Thumbnail Display**: SSH経由での実際の画像データ取得・表示機能完全実装
- **🎯 9-Stage Size Control**: tiny(8px) → giant(600px) の柔軟なサムネイルサイズ調整
- **🎯 Fullscreen Responsive Design**: ブラウザ幅最大活用・2K/4K対応レスポンシブレイアウト
- **🎯 Large Image Detail View**: 最大600x600pxでの詳細画像確認機能
- **🔥 Complete SSH Connection Form**: Password, Port, Auth Method, Test Connection機能完全実装
- **🔥 Unlimited Image Zoom System**: Ctrl+スクロール、0.1x-50x倍率、パン移動、リアルタイム拡大縮小表示
- **🎯 Perfect Thumbnail System**: 統一150x150px正方形、アスペクト比保持、ImageMagick背景付き配置
- **📋 Advanced Sorting Features**: 名前・サイズ・更新日時・種別ソート、昇順/降順切り替え、自然数順対応
- **📜 Responsive Gallery Scrolling**: モバイル384px〜デスクトップ700px、カスタムスクロールバー、大量画像対応

### 🔧 Current Technical Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript + node-ssh
- **SSH Service**: Real SSH connections with NodeSSH library
- **UI Framework**: Modern component library with toast system and shortcuts
- **Architecture**: 3-tier with live SSH-based remote execution
- **Development Environment**: UV-based Python automation + WSL2 + Interactive scripts
- **Automation Tools**: Python UV package manager, automated setup scripts
- **Test Environment**: Complete SSH server setup with sample RAW files

### 🚀 Production Features
- **Live SSH Testing**: Complete test environment with localhost SSH server
- **Real Directory Browsing**: Actual file system navigation over SSH
- **User-Controlled Scripts**: Interactive development menu system
- **Performance Optimized**: Lazy loading, efficient state management
- **Error Handling**: Comprehensive error handling with user feedback

### 📁 Project Structure
```
remote-raw-viewer/
├── frontend/src/
│   ├── components/ui/     # Toast, Status, Loading components  
│   ├── hooks/            # useToast, useKeyboardShortcuts, usePerformanceMonitor
│   ├── pages/            # WorkingMainPage with real SSH integration
│   └── services/         # API services for SSH connections
├── backend/src/
│   ├── services/         # SSHService, connectionService, directoryService
│   ├── controllers/      # Real API controllers for SSH operations
│   └── routes/           # Express routes for SSH and directory APIs
├── scripts/              # Individual server startup scripts + UV automation
│   ├── setup_environment.py  # UV-based automated environment setup
│   └── start_development.py  # UV-based integrated development server
├── setup-test-server-fixed.sh  # Complete SSH test environment setup
├── install-uv.sh         # UV package manager installation script
├── pyproject.toml        # Python/UV project configuration
└── start-dev.sh          # Legacy interactive development menu
```

### 🎯 Core Functionality: COMPLETE ✅
**All Primary Features Successfully Implemented**
- ✅ SSH Connection & Directory Browsing
- ✅ Perfect Thumbnail Display System (150x150px, aspect ratio preserved)
- ✅ Advanced Sorting System (Name/Size/Date/Type, Asc/Desc)
- ✅ Responsive Gallery with Scrolling (384px-700px)
- ✅ 9-Stage Size Control (8px → 600px)
- ✅ Fullscreen Responsive Layout
- ✅ RAW Image Processing
- ✅ Multi-format Image Support

### 🎯 Production Deployment Infrastructure (COMPLETE)
- ✅ **Docker Configuration**: 本番用Dockerfile、docker-compose.prod.yml完成
- ✅ **SSL Setup**: Let's Encrypt & 自己署名証明書対応スクリプト
- ✅ **Nginx Configuration**: HTTPS、圧縮、セキュリティヘッダー設定済み
- ✅ **Auto Deploy Script**: ワンクリック本番デプロイ機能
- ✅ **Monitoring & Backup**: ログローテーション、ヘルスチェック、バックアップ自動化
- ✅ **Documentation**: 完全な運用ガイド、チェックリスト、クイックスタート

### 📋 Ready for Production Deployment
- **Target Environment**: Windows 11 Client → Application Server → Ubuntu Image Server
- **SSL/HTTPS**: フル対応、Let's Encrypt自動更新対応
- **Security**: ファイアウォール設定、SSH Key認証、セキュリティヘッダー
- **Operations**: 自動バックアップ、ログ監視、サービス管理

### 🚀 Optional Future Enhancements  
- **Advanced Features**: 追加のエンタープライズ機能
- **Enhanced Automation**: より高度な自動化機能

### 🔧 最新の技術的課題解決 (2025-06-16 Sessions)

#### Session 3: UV自動化環境実装
- **Download Button Functionality**: ダウンロード機能が動作しない問題を修正（connectionService.getSSHClient追加）
- **UI Layout Issues**: ダウンロードボタンとサムネイルサイズ調整ボタンの重複問題解決
- **UV Environment Setup**: Python UV-based完全自動化開発環境実装
- **Development Automation**: 3コマンドでセットアップ完了する統合開発システム構築
- **Error Handling Enhancement**: 詳細ログ表示とタイムアウト処理改善

#### Session 2: 画像ズーム機能
- **ConnectionForm Missing Fields**: WorkingMainPageで簡易フォームではなく完全なConnectionFormコンポーネントを使用するよう修正
- **SSH Connection Form Complete**: Password、Port、Auth Method、Test Connection機能の完全実装確認
- **Image Zoom Transform Issue**: CSSクラス`max-w-full max-h-full`とtransform scaleの競合問題を解決
- **Dynamic Image Sizing**: ズーム倍率に応じた適切なmaxWidth/maxHeight制御実装
- **Real Image Zoom Functionality**: Ctrl+スクロールでの実際の画像拡大縮小表示を完全実装

### 🔧 過去に解決済みの技術的問題
- **Image Thumbnail Generation**: SSH経由での実際の画像データ取得機能完全実装
- **Large Scale Display**: 最大600x600pxサムネイル表示対応
- **Fullscreen Layout**: ブラウザ幅最大活用のレスポンシブデザイン実装
- **9-Stage Size Control**: tiny→giantの柔軟なサイズ調整システム完成
- **SSHService Directory Listing**: `find` コマンドエラーを `ls -la` に修正
- **Frontend Label Display**: サムネイル上に固定ラベルエリア追加
- **Connection Management**: サーバー再起動後の接続ID管理改善
- **Real-time Directory Navigation**: 実際のディレクトリブラウジングが完全動作

### 🏆 Project Success Metrics: All Enhanced & Achieved
- ✅ **Primary Goal**: "画像をサムネイル表示で一覧表示" → **完全達成**
- ✅ **User Request**: "画像を一目で全て確認したい" → **600x600px詳細表示で実現**
- ✅ **Technical Challenge**: SSH経由での実際の画像データ表示 → **完全実装**
- ✅ **UI/UX Goal**: フルスクリーン対応と柔軟なサイズ調整 → **9段階サイズ実装**
- ✅ **Enhanced Goal**: SSH接続フォーム完全実装 → **Password/Port/Auth/Test機能完全実装**
- ✅ **Advanced Goal**: 無制限画像ズーム機能 → **Ctrl+スクロール、0.1x-50x、パン移動完全実装**
- ✅ **Automation Goal**: 開発環境自動化 → **UV-based 3コマンドセットアップ完全実装**
- ✅ **Download Goal**: ファイルダウンロード機能 → **SSH経由ダウンロード、UIレイアウト改善完全実装**