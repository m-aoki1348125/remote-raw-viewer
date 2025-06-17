# 🚀 Remote Raw Viewer 起動ガイド

## サーバー起動手順

### 1. 開発環境一括起動
```bash
cd /mnt/c/work/claude-code/git/remote-raw-viewer
./start-dev.sh
```

### 2. 起動確認
起動後、以下のURLでアクセス可能になります：

- **Frontend (Web UI)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## 📋 起動時のポート構成

| サービス | ポート | URL | 説明 |
|---------|-------|-----|-----|
| Frontend | 3000 | http://localhost:3000 | React Web UI |
| Backend | 8000 | http://localhost:8000 | Express API Server |

## 🧪 テスト用SSH接続情報

**接続設定 (Web UIで入力):**
- **Connection Name**: Local Test Server
- **Host**: localhost
- **Port**: 22
- **Username**: testuser
- **Password**: testpass123
- **Authentication Method**: Password

## 📁 テスト用画像パス

- **標準画像**: `/home/testuser/images/standard/`
- **RAW画像**: `/home/testuser/images/raw/`
- **サンプル**: `/home/testuser/images/sample/`

## 🛑 サーバー停止

`Ctrl+C` でstart-dev.shを停止すると、すべてのサーバーが自動的に停止されます。

## 📝 ログ確認

```bash
# ログをリアルタイムで確認
tail -f logs/backend.log logs/frontend.log

# 個別ログ確認
cat logs/backend.log
cat logs/frontend.log
```

## ✅ 動作確認チェックリスト

1. □ `./start-dev.sh` が正常に起動
2. □ SSH test server accessibility確認メッセージ表示
3. □ http://localhost:3000 でUI表示
4. □ http://localhost:8000/health で`{"status":"OK"}`応答
5. □ 新しい接続の作成が可能
6. □ testuser接続での接続テスト成功
7. □ ディレクトリツリー表示
8. □ 画像ギャラリー表示
9. □ サムネイル生成
10. □ 画像モーダル表示
11. □ ファイルダウンロード

## 🖼️ テスト用画像ファイル詳細

### 標準画像 (`/home/testuser/images/standard/`)
- `gradient.png` - 949 bytes, PNG グラデーション
- `circle.jpg` - 4,657 bytes, JPEG 円形画像
- `checkerboard.gif` - 2,346 bytes, GIF チェッカーボード
- `plasma.webp` - 2,996 bytes, WebP プラズマフラクタル

### RAW画像 (`/home/testuser/images/raw/`)
- `test_640x512.raw` - 327,680 bytes (640×512対応)
- `test_128x128.raw` - 16,384 bytes (128×128正方形)
- `test_64x64.raw` - 4,096 bytes (64×64正方形)

### サンプル画像 (`/home/testuser/images/sample/`)
- `text_image1.png` - 3,045 bytes, テキスト入りPNG
- `text_image2.jpg` - 12,080 bytes, テキスト入りJPEG
- `readme.txt` - 88 bytes (フィルター確認用)
- `metadata.json` - 73 bytes (フィルター確認用)

---

**注意**: この起動スクリプトを実行すると、フロントエンドとバックエンドの両方のサーバーが自動的に起動します。ポートフォワード設定後に使用してください。