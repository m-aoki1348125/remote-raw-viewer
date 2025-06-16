# Remote Raw Viewer - Quick Start Guide

## 概要

本ガイドでは、Remote Raw Viewerを最短時間で運用環境にデプロイする手順を説明します。

## 前提条件

### 必要なサーバー

1. **Application Server** (Remote Raw Viewer実行用)
   - Ubuntu 22.04 LTS または CentOS 8+
   - 2 CPU、4GB RAM、20GB ストレージ以上
   - Docker & Docker Compose インストール済み

2. **Ubuntu Image Server** (画像ファイル格納用)
   - Ubuntu Server (既存サーバー)
   - SSH アクセス可能
   - 画像ファイルが格納済み

3. **Client** (アクセス元)
   - Windows 11
   - Chrome または Edge ブラウザ

## Step 1: Application Server セットアップ

### 1.1 基本環境の準備

```bash
# サーバーにログイン
ssh user@your-app-server

# システム更新
sudo apt update && sudo apt upgrade -y

# Docker インストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose インストール
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 再ログインしてDocker権限を有効化
exit
ssh user@your-app-server
```

### 1.2 アプリケーションの配置

```bash
# アプリケーションディレクトリ作成
sudo mkdir -p /opt/remote-raw-viewer
sudo chown $USER:$USER /opt/remote-raw-viewer

# ソースコード配置 (Git使用の場合)
cd /opt/remote-raw-viewer
git clone <your-repository-url> .

# または SCP使用の場合
# scp -r /path/to/remote-raw-viewer/* user@server:/opt/remote-raw-viewer/
```

## Step 2: SSL証明書の設定

### 2.1 ドメイン使用の場合 (推奨)

```bash
# SSL証明書設定スクリプト実行
./scripts/setup-ssl.sh -d your-domain.com -e your-email@example.com
```

### 2.2 自己署名証明書の場合

```bash
# 自己署名証明書生成
./scripts/setup-ssl.sh -d your-server-ip --self-signed
```

## Step 3: 環境設定

### 3.1 環境変数ファイルの設定

```bash
# テンプレートから本番設定ファイルをコピー
cp .env.production.template .env.production

# 設定ファイルを編集
nano .env.production
```

**重要な設定項目:**

```bash
# ドメイン設定
APP_DOMAIN=your-domain.com
APP_URL=https://your-domain.com

# セキュリティキー (32文字のランダム文字列を生成)
SESSION_SECRET=$(openssl rand -hex 16)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# SSL設定
ENABLE_HTTPS=true
SSL_CERT_PATH=/opt/ssl/cert.pem
SSL_KEY_PATH=/opt/ssl/private.key
```

### 3.2 ファイアウォール設定

```bash
# UFW使用の場合
sudo ufw allow ssh
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw enable

# または iptables使用の場合
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

## Step 4: デプロイ実行

### 4.1 自動デプロイスクリプト実行

```bash
# 本番環境デプロイ
./scripts/deploy-production.sh
```

### 4.2 デプロイ確認

```bash
# コンテナ状態確認
docker-compose -f docker-compose.prod.yml ps

# ログ確認
docker-compose -f docker-compose.prod.yml logs -f

# ヘルスチェック
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/health
```

## Step 5: Ubuntu Image Server接続設定

### 5.1 SSH認証の準備

**パスワード認証の場合:**
- Ubuntu Image Serverのユーザー名・パスワードを準備

**SSH Key認証の場合 (推奨):**

```bash
# Application Serverで鍵ペア生成
ssh-keygen -t rsa -b 4096 -f ~/.ssh/imageserver_key

# Ubuntu Image Serverに公開鍵コピー
ssh-copy-id -i ~/.ssh/imageserver_key.pub imageuser@ubuntu-image-server

# Application Serverの鍵ディレクトリに秘密鍵配置
sudo mkdir -p /opt/ssh-keys
sudo cp ~/.ssh/imageserver_key /opt/ssh-keys/
sudo chown $USER:$USER /opt/ssh-keys/imageserver_key
sudo chmod 600 /opt/ssh-keys/imageserver_key
```

### 5.2 Web画面での接続設定

1. ブラウザで `https://your-domain.com` にアクセス
2. 「Add Connection」をクリック
3. 接続情報を入力:
   - **Name**: Production Image Server
   - **Host**: ubuntu-image-server-ip
   - **Port**: 22
   - **Username**: imageuser
   - **Authentication**: SSH Key または Password
4. 「Connect」をクリックして接続テスト

## Step 6: 動作確認

### 6.1 基本機能テスト

1. **接続確認**: SSH接続が成功することを確認
2. **ディレクトリブラウジング**: ディレクトリツリーでナビゲーション
3. **画像表示**: サムネイル画像が正しく表示されることを確認
4. **サイズ調整**: サムネイルサイズ変更機能の動作確認
5. **検索機能**: ファイル名検索の動作確認

### 6.2 性能テスト

```bash
# 大量画像でのテスト
# 1000+画像が含まれるディレクトリでの表示確認

# 同時アクセステスト
# 複数ブラウザタブでの同時アクセス確認
```

## Step 7: 運用開始

### 7.1 監視設定

```bash
# システムサービス有効化
sudo systemctl enable remote-raw-viewer.service

# ログローテーション確認
sudo logrotate -d /etc/logrotate.d/remote-raw-viewer
```

### 7.2 バックアップ設定

```bash
# 定期バックアップスクリプト作成
sudo tee /usr/local/bin/backup-remote-raw-viewer.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/remote-raw-viewer"
APP_DIR="/opt/remote-raw-viewer"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/backup-$DATE.tar.gz" -C "$APP_DIR" data .env.production
find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +30 -delete
EOF

sudo chmod +x /usr/local/bin/backup-remote-raw-viewer.sh

# 日次バックアップのcron設定
(crontab -l 2>/dev/null || true; echo "0 2 * * * /usr/local/bin/backup-remote-raw-viewer.sh") | crontab -
```

## トラブルシューティング

### よくある問題

1. **SSL証明書エラー**
   ```bash
   # 証明書の確認
   sudo openssl x509 -in /opt/ssl/cert.pem -text -noout | grep -E "(Not Before|Not After)"
   ```

2. **SSH接続失敗**
   ```bash
   # SSH接続テスト
   ssh -i /opt/ssh-keys/imageserver_key imageuser@ubuntu-image-server
   ```

3. **コンテナ起動失敗**
   ```bash
   # 詳細ログ確認
   docker-compose -f docker-compose.prod.yml logs backend
   docker-compose -f docker-compose.prod.yml logs frontend
   ```

### ログ確認コマンド

```bash
# アプリケーションログ
tail -f /opt/remote-raw-viewer/logs/backend.log
tail -f /opt/remote-raw-viewer/logs/frontend.log

# システムログ
journalctl -u remote-raw-viewer.service -f

# Nginxログ
docker-compose -f docker-compose.prod.yml logs frontend
```

## 管理コマンド

```bash
# サービス管理
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml start
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml stop
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml restart

# 状態確認
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml ps
docker-compose -f /opt/remote-raw-viewer/docker-compose.prod.yml logs -f

# 更新時
cd /opt/remote-raw-viewer
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

---

**🎉 おめでとうございます！Remote Raw Viewerの運用環境が準備完了しました。**

**サポート情報:**
- 追加の設定が必要な場合は `ProductionDeploymentGuide.md` を参照
- 運用チェックリストは `OperationalReadiness.md` を確認
- 問題が発生した場合は `/opt/remote-raw-viewer/logs/` のログファイルを確認してください