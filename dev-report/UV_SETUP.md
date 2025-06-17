# UV-based Environment Setup

このガイドでは、Python uvパッケージマネージャーを使用してRemote Raw Viewerの開発環境を構築する方法を説明します。

## Prerequisites

- Python 3.9以上
- Git
- curl (uvインストール用)

## 1. uvのインストール

```bash
# uvインストールスクリプトを実行
./install-uv.sh

# または手動でインストール
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 2. 環境セットアップ

```bash
# プロジェクトディレクトリで実行
uv run setup-env
```

このコマンドは以下を自動実行します：
- Python仮想環境の作成
- 必要なディレクトリ作成（logs/）
- Node.js環境のセットアップ
- バックエンド・フロントエンドの依存関係インストール
- 環境設定ファイルの作成
- SSHテストサーバーのセットアップ（可能な場合）

## 3. 開発サーバー起動

```bash
# 統合開発サーバー起動
uv run start-dev
```

または個別に起動：

```bash
# バックエンドのみ
cd backend && npm run dev

# フロントエンドのみ  
cd frontend && npm run dev
```

## 4. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンド**: http://localhost:8000
- **ヘルスチェック**: http://localhost:8000/health

## 5. SSH接続テスト

テスト環境が利用可能な場合：
- **ホスト**: localhost:22
- **ユーザー**: testuser
- **パスワード**: testpass123
- **画像ディレクトリ**: /home/testuser/images/

## トラブルシューティング

### uvが見つからない場合
```bash
# PATHに追加
export PATH="$HOME/.cargo/bin:$PATH"
# または
source ~/.bashrc
```

### Node.jsが見つからない場合
セットアップスクリプトが自動的にNode.js 18.18.0をローカルインストールします。

### 権限エラー
```bash
# ディレクトリの権限確認
ls -la logs/
chmod 755 logs/
```

### ポート競合
既存のサーバーを停止：
```bash
pkill -f "node.*backend"
pkill -f "node.*frontend"
pkill -f "vite"
```

## 従来のセットアップとの違い

| 従来方法 | UV方法 |
|---------|--------|
| `./start-dev.sh` | `uv run start-dev` |
| 手動依存関係管理 | 自動環境構築 |
| Bashスクリプト | Pythonベース管理 |
| 個別設定 | 統合設定 |

## 追加コマンド

```bash
# Python依存関係追加
uv add package-name

# 開発用依存関係追加
uv add --dev package-name

# 環境リセット
rm -rf .venv && uv run setup-env

# ログ確認
tail -f logs/backend.log
tail -f logs/frontend.log
```