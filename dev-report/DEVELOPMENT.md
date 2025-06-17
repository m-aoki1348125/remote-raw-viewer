# 🚀 開発環境セットアップガイド

Remote Raw Viewerの開発環境を手動で制御できるスクリプト集です。

## 📋 利用可能なスクリプト

### 🎯 メインスクリプト

#### `./start-dev.sh` - インタラクティブモード
対話形式でサーバーを管理できます。
```bash
./start-dev.sh
```

**利用可能なオプション:**
- `1` - 🏃 クイックスタート（両方のサーバー）
- `2` - 📦 バックエンドのみ起動
- `3` - 🌐 フロントエンドのみ起動
- `4` - 🔍 ステータス確認
- `5` - 📝 ログ表示
- `6` - 🛑 全サーバー停止
- `7` - ❌ 終了

#### `./quick-start.sh` - ノンインタラクティブモード
両方のサーバーを自動で起動します。
```bash
./quick-start.sh
```

### 🔧 個別操作スクリプト

#### バックエンド操作
```bash
# バックエンド起動（ポート8000）
./scripts/start-backend.sh

# バックエンドのみ停止
./scripts/stop-dev.sh  # 全体停止（個別停止は手動でPIDを指定）
```

#### フロントエンド操作
```bash
# フロントエンド起動（ポート3000）
./scripts/start-frontend.sh

# フロントエンドのみ停止
./scripts/stop-dev.sh  # 全体停止（個別停止は手動でPIDを指定）
```

#### ステータス確認・管理
```bash
# 全体ステータス確認
./scripts/check-status.sh

# 全サーバー停止
./scripts/stop-dev.sh
```

## 🌐 アクセスURL

| サービス | URL | 説明 |
|----------|-----|------|
| **フロントエンド** | http://localhost:3000 | React アプリケーション |
| **バックエンドAPI** | http://localhost:8000 | Express.js サーバー |
| **ヘルスチェック** | http://localhost:8000/health | API稼働確認 |

## 📝 ログ管理

### ログファイル場所
- **バックエンド**: `logs/backend.log`
- **フロントエンド**: `logs/frontend.log`

### ログ表示方法
```bash
# リアルタイムログ表示
tail -f logs/backend.log logs/frontend.log

# バックエンドのみ
tail -f logs/backend.log

# フロントエンドのみ
tail -f logs/frontend.log

# エラーのみ抽出
grep -i error logs/*.log
```

## 🔍 トラブルシューティング

### ポートが既に使用されている場合
```bash
# 既存プロセス確認
./scripts/check-status.sh

# 強制停止
./scripts/stop-dev.sh

# 手動でプロセス確認
ss -tulpn | grep -E ":(3000|8000)"
```

### サーバーが起動しない場合
```bash
# 依存関係インストール
cd backend && npm install
cd ../frontend && npm install

# ログでエラー確認
tail -f logs/backend.log
tail -f logs/frontend.log
```

### 重複プロセスの問題
```bash
# 全プロセス強制停止
./scripts/stop-dev.sh

# 手動でViteプロセス停止
pkill -f "vite"

# 手動でnpmプロセス停止
pkill -f "npm run dev"
```

## 🎯 推奨ワークフロー

### 1. 開発開始時
```bash
# インタラクティブモード（推奨）
./start-dev.sh

# またはクイックスタート
./quick-start.sh
```

### 2. 開発中
```bash
# ステータス確認
./scripts/check-status.sh

# ログ監視
tail -f logs/backend.log logs/frontend.log
```

### 3. 開発終了時
```bash
# 全サーバー停止
./scripts/stop-dev.sh
```

## 📊 機能テスト手順

### 基本機能確認
1. `./quick-start.sh` でサーバー起動
2. http://localhost:3000 にアクセス
3. 「Launch Application」ボタンをクリック
4. 接続管理、検索、キーボードショートカットをテスト

### 新機能テスト
- **トースト通知**: 接続/切断時の通知表示
- **キーボードショートカット**: F1（ヘルプ）、Ctrl+N（新規接続）、Ctrl+F（検索）
- **検索機能**: リアルタイム接続フィルタリング
- **パフォーマンス監視**: ダッシュボードでメトリクス確認

## 🔒 セキュリティ注意事項

- 開発環境では `0.0.0.0` でバインドしているため、ローカルネットワークからアクセス可能
- 本番環境では適切なファイアウォール設定を行うこと
- SSH認証情報は開発目的のテスト値のみ使用すること

## 📞 サポート

問題が発生した場合：
1. `./scripts/check-status.sh` でステータス確認
2. `logs/` ディレクトリのログファイルを確認
3. `./scripts/stop-dev.sh` で全プロセス停止後、再起動を試行