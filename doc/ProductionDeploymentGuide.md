# Remote Raw Viewer - Production Deployment Guide

## 概要

本ドキュメントは、Remote Raw Viewerを実運用環境にデプロイする際の手順と設定について説明します。

## 運用環境構成

### システム構成図

```
[Windows 11 Client] --HTTPS--> [Remote Raw Viewer Server] --SSH--> [Ubuntu Image Server]
       |                              |                                    |
   ブラウザアクセス              React Frontend +                   画像ファイル格納
    (Chrome/Edge)               Node.js Backend                   (JPEG/PNG/RAW等)
```

### 環境仕様

#### クライアント環境
- **OS**: Windows 11
- **ブラウザ**: Chrome 120+, Microsoft Edge 120+
- **アクセス方法**: HTTPS経由でWebアプリにアクセス
- **ネットワーク**: インターネット接続またはVPN経由

#### Application Server (Remote Raw Viewer)
- **推奨OS**: Ubuntu 22.04 LTS または CentOS 8+
- **Docker**: Docker Engine 24.0+ & Docker Compose v2
- **ポート**: 
  - HTTP: 3000 (開発時)
  - HTTPS: 443 (本番環境)
  - Backend API: 8000 (内部通信)
- **最小要件**: 
  - CPU: 2コア以上
  - メモリ: 4GB以上
  - ストレージ: 20GB以上

#### Target Image Server
- **OS**: Ubuntu Server (16.04+)
- **SSH**: OpenSSH Server
- **必要ツール**: 
  - `base64` (画像データ変換用)
  - `ImageMagick` (RAW画像処理用、オプション)
- **アクセス**: SSH Key認証またはパスワード認証

## 前提条件

### 1. Image Server (Ubuntu) 設定要件

```bash
# SSH サーバーの有効化
sudo systemctl enable ssh
sudo systemctl start ssh

# 画像処理ツールのインストール (オプション)
sudo apt update
sudo apt install imagemagick

# ユーザーとディレクトリの設定
sudo useradd -m imageuser
sudo mkdir -p /data/images
sudo chown imageuser:imageuser /data/images
```

### 2. ネットワーク要件

- Application Server → Image Server: SSH (Port 22)
- Client → Application Server: HTTPS (Port 443)
- ファイアウォール設定が適切に構成されていること

### 3. 認証情報

- SSH接続用の認証情報（鍵ペアまたはパスワード）
- SSL証明書（Let's Encrypt推奨）

## デプロイ手順

### Phase 1: Application Server セットアップ

#### 1.1 Docker環境の準備

```bash
# Docker のインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose のインストール
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 1.2 アプリケーションファイルの配置

```bash
# アプリケーションディレクトリの作成
sudo mkdir -p /opt/remote-raw-viewer
sudo chown $USER:$USER /opt/remote-raw-viewer
cd /opt/remote-raw-viewer

# ソースコードの配置 (GitまたはSCP経由)
git clone <repository-url> .
# または
# scp -r /path/to/remote-raw-viewer/* user@server:/opt/remote-raw-viewer/
```

### Phase 2: Production Configuration

#### 2.1 環境変数の設定

```bash
# .env.production ファイルの作成
cat > .env.production << 'EOF'
# Application Configuration
NODE_ENV=production
FRONTEND_PORT=3000
BACKEND_PORT=8000

# SSL Configuration
ENABLE_HTTPS=true
SSL_CERT_PATH=/opt/ssl/cert.pem
SSL_KEY_PATH=/opt/ssl/private.key

# Security
SESSION_SECRET=<generate-random-32-char-string>
ENCRYPTION_KEY=<generate-random-32-char-string>

# Database (if needed for connection storage)
DB_PATH=/opt/remote-raw-viewer/data/connections.db

# Logging
LOG_LEVEL=info
LOG_PATH=/opt/remote-raw-viewer/logs
EOF
```

#### 2.2 SSL証明書の設定

```bash
# Let's Encrypt using Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# 証明書のコピー
sudo mkdir -p /opt/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/ssl/private.key
sudo chown $USER:$USER /opt/ssl/*
```

### Phase 3: Docker Deployment

#### 3.1 Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
      - "443:443"
    volumes:
      - /opt/ssl:/app/ssl:ro
      - ./frontend/nginx.conf:/etc/nginx/nginx.conf:ro
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=8000
    restart: unless-stopped

volumes:
  data:
  logs:
```

#### 3.2 Production Dockerfiles

**Frontend Dockerfile.prod**
```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000 443
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile.prod**
```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8000
CMD ["npm", "start"]
```

### Phase 4: 運用開始

#### 4.1 アプリケーション起動

```bash
# Production環境でのビルドと起動
docker-compose -f docker-compose.prod.yml up --build -d

# ログ確認
docker-compose -f docker-compose.prod.yml logs -f
```

#### 4.2 接続設定

1. ブラウザで `https://your-domain.com` にアクセス
2. 「Add Connection」で Ubuntu Image Server の接続情報を追加：
   - Name: Production Image Server
   - Host: ubuntu-server-ip
   - Port: 22
   - Username: imageuser
   - Authentication: SSH Key または Password

## セキュリティ設定

### 1. ファイアウォール設定

```bash
# UFW設定例 (Application Server)
sudo ufw allow ssh
sudo ufw allow 443/tcp
sudo ufw allow from <client-network> to any port 3000
sudo ufw enable
```

### 2. SSH キー認証の設定

```bash
# Image Serverでの公開鍵設定
ssh-keygen -t rsa -b 4096 -f ~/.ssh/imageserver_key
ssh-copy-id -i ~/.ssh/imageserver_key.pub imageuser@ubuntu-server

# Application Serverに秘密鍵を安全に配置
scp ~/.ssh/imageserver_key user@app-server:/opt/remote-raw-viewer/keys/
```

### 3. 環境変数の暗号化

```bash
# 機密情報の暗号化（推奨）
# Docker secrets またはHashiCorp Vault の使用を検討
```

## 監視とメンテナンス

### 1. ログ監視

```bash
# システムログの確認
journalctl -u docker -f

# アプリケーションログの確認
tail -f /opt/remote-raw-viewer/logs/backend.log
tail -f /opt/remote-raw-viewer/logs/frontend.log
```

### 2. 定期メンテナンス

```bash
# Docker イメージの更新
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# ログローテーション設定
# /etc/logrotate.d/remote-raw-viewer
```

### 3. バックアップ

```bash
# 設定ファイルとデータのバックアップ
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/remote-raw-viewer/data /opt/remote-raw-viewer/.env.production
```

## トラブルシューティング

### 一般的な問題と解決方法

1. **SSH接続エラー**
   - SSH鍵の権限確認: `chmod 600 ~/.ssh/imageserver_key`
   - ネットワーク接続確認: `telnet ubuntu-server 22`

2. **画像表示エラー**
   - base64コマンドの存在確認: `which base64`
   - ファイル権限の確認: `ls -la /data/images/`

3. **HTTPS証明書エラー**
   - 証明書の有効期限確認: `openssl x509 -in cert.pem -text -noout`
   - 自動更新設定: `crontab -e` で certbot の更新設定

## パフォーマンス最適化

### 推奨設定

1. **Nginx設定**（大量画像対応）
2. **Redis キャッシュ**（サムネイル）
3. **CDN設定**（静的ファイル）
4. **圧縮設定**（gzip/brotli）

---

**更新履歴**
- 2025-06-16: 初版作成
- 運用開始後のフィードバックに基づき随時更新予定