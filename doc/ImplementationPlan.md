# Remote Image Viewer 実装計画書

## 1. プロジェクト概要

Remote Image Viewerは、リモートサーバー上の画像ファイルをWebブラウザから安全に閲覧できる3層アーキテクチャのWebアプリケーションです。

## 2. 技術スタック選定

### 2.1 Frontend
- **React 18** + TypeScript
  - 理由: モダンなUI構築、コンポーネント再利用性、TypeScriptによる型安全性
- **Vite** (ビルドツール)
  - 理由: 高速な開発サーバー、効率的なバンドル
- **Tailwind CSS**
  - 理由: 迅速なUI開発、レスポンシブデザイン対応
- **React Query (TanStack Query)**
  - 理由: サーバー状態管理、キャッシュ機能、遅延読み込み対応

### 2.2 Backend
- **Node.js** + **Express.js** + TypeScript
  - 理由: JavaScript統一、豊富なライブラリ、Docker化の容易さ
- **node-ssh** / **ssh2**
  - 理由: SSH接続管理
- **multer**
  - 理由: ファイルダウンロード処理
- **helmet** + **cors**
  - 理由: セキュリティ強化
- **winston**
  - 理由: ログ管理

### 2.3 Server-side Agent
- **Python 3.11**
  - 理由: 画像処理ライブラリの豊富さ、スクリプト実行の容易さ
- **Pillow (PIL)**
  - 理由: 画像処理、サムネイル生成、RAW画像対応
- **argparse**
  - 理由: CLI引数処理

### 2.4 Development & Deployment
- **Docker** + **Docker Compose**
  - 理由: 環境一貫性、デプロイの簡素化
- **Jest** + **React Testing Library**
  - 理由: TDD対応、フロントエンドテスト
- **Supertest**
  - 理由: バックエンドAPIテスト

## 3. 開発フェーズ

### Phase 1: 基盤構築 (Week 1-2)
**優先度: 最高**

#### Phase 1.1: プロジェクト基盤
- [ ] プロジェクト構造作成
- [ ] Docker環境構築
- [ ] Frontend (React + Vite + TypeScript) セットアップ
- [ ] Backend (Node.js + Express + TypeScript) セットアップ
- [ ] Agent (Python) スクリプト基盤作成

#### Phase 1.2: 基本テスト環境
- [ ] Jest設定 (Frontend)
- [ ] Supertest設定 (Backend)
- [ ] Python unittest設定 (Agent)
- [ ] CI/CD パイプライン基本設定

### Phase 2: SSH接続とファイルシステム (Week 3-4)
**優先度: 高**

#### Phase 2.1: SSH接続管理 (FR-1)
- [ ] SSH接続設定画面 (Frontend)
- [ ] SSH認証情報管理 (Backend)
- [ ] SSH接続テスト機能
- [ ] 接続エラーハンドリング

#### Phase 2.2: ディレクトリツリー表示 (FR-2)
- [ ] ファイルシステム取得 (Agent)
- [ ] ディレクトリツリーAPI (Backend)
- [ ] ツリー表示コンポーネント (Frontend)
- [ ] ディレクトリナビゲーション

### Phase 3: 画像表示機能 (Week 5-7)
**優先度: 高**

#### Phase 3.1: 基本画像表示 (FR-3, FR-4)
- [ ] 画像ファイル検出 (Agent)
- [ ] サムネイル生成 (Agent)
- [ ] 画像ギャラリーコンポーネント (Frontend)
- [ ] 遅延読み込み実装 (NFR-1)
- [ ] ライトボックス/モーダル表示

#### Phase 3.2: メタデータ表示 (FR-6)
- [ ] ファイルメタデータ取得 (Agent)
- [ ] ホバー時情報表示 (Frontend)

### Phase 4: RAW画像処理 (Week 8-9)
**優先度: 中**

#### Phase 4.1: RAW画像対応 (FR-7)
- [ ] RAW画像検出ロジック
- [ ] 327,680バイト → 640×512変換
- [ ] 完全平方ファイルサイズ処理
- [ ] エラーログ機能
- [ ] RAW画像プレビュー対応

### Phase 5: ダウンロード機能 (Week 10)
**優先度: 中**

#### Phase 5.1: 画像ダウンロード (FR-5)
- [ ] 単一画像ダウンロード
- [ ] 複数画像選択UI
- [ ] 一括ダウンロード (ZIP化)
- [ ] ダウンロード進捗表示

### Phase 6: パフォーマンス最適化 (Week 11-12)
**優先度: 中**

#### Phase 6.1: 大量画像対応 (NFR-1)
- [ ] 仮想スクロール実装
- [ ] サムネイルキャッシュ機能
- [ ] ページネーション機能
- [ ] 検索・フィルター機能

### Phase 7: セキュリティ強化 (Week 13)
**優先度: 高**

#### Phase 7.1: セキュリティ実装 (NFR-2)
- [ ] HTTPS設定
- [ ] SSH認証情報暗号化
- [ ] セッション管理
- [ ] セキュリティヘッダー設定

### Phase 8: 最終調整・テスト (Week 14-15)
**優先度: 高**

#### Phase 8.1: 統合テスト・本番対応
- [ ] E2Eテスト実装
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] 本番環境Docker設定
- [ ] ドキュメント整備

## 4. ディレクトリ構造

```
remote-raw-viewer/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── public/
│   ├── tests/                 # Frontend tests
│   └── package.json
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Express middleware
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── tests/                 # Backend tests
│   └── package.json
├── agent/                       # Python agent
│   ├── src/
│   │   ├── image_processor.py # Image processing
│   │   ├── file_manager.py    # File operations
│   │   └── main.py           # CLI entry point
│   ├── tests/                 # Agent tests
│   └── requirements.txt
├── docker/                      # Docker configurations
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── docker-compose.yml
├── doc/                         # Documentation
└── scripts/                     # Build/deployment scripts
```

## 5. API設計

### 5.1 REST API エンドポイント

```
POST   /api/connections          # SSH接続設定
GET    /api/connections          # 接続一覧取得
DELETE /api/connections/:id      # 接続削除

POST   /api/connect              # SSH接続実行
POST   /api/disconnect           # SSH切断

GET    /api/directories          # ディレクトリツリー取得
GET    /api/files                # ファイル一覧取得

GET    /api/thumbnails/:path     # サムネイル取得
GET    /api/images/:path         # フル画像取得
POST   /api/download             # 画像ダウンロード
```

### 5.2 WebSocket通信 (オプション)
- リアルタイム進捗通知
- 大量画像読み込み状況

## 6. テスト戦略

### 6.1 TDD実装方針
1. **Red**: 期待動作のテスト作成 → 失敗確認
2. **Green**: テスト通過の最小実装
3. **Refactor**: コード品質向上

### 6.2 テスト種別
- **Unit Test**: 各機能単体
- **Integration Test**: API連携
- **E2E Test**: ユーザーシナリオ
- **Performance Test**: 大量データ処理

## 7. リスク管理

### 7.1 技術的リスク
- **RAW画像処理の複雑さ**: 早期プロトタイプで検証
- **SSH接続の安定性**: 接続プール、リトライ機能
- **大量画像のパフォーマンス**: 段階的最適化

### 7.2 セキュリティリスク
- **SSH認証情報漏洩**: 環境変数、暗号化保存
- **パストラバーサル攻撃**: パス検証機能
- **DDoS攻撃**: レート制限、接続数制限

## 8. 成功指標

### 8.1 機能指標
- [ ] 全FR要件の実装完了
- [ ] 1000枚以上の画像で応答時間3秒以内
- [ ] RAW画像処理成功率95%以上

### 8.2 品質指標
- [ ] テストカバレッジ80%以上
- [ ] セキュリティスキャン合格
- [ ] Docker化完了、本番デプロイ可能

## 9. 次のステップ

1. **Phase 1開始**: プロジェクト基盤構築
2. **TDD実践**: テストファースト開発
3. **週次レビュー**: 進捗確認と計画調整
4. **継続的改善**: パフォーマンスとセキュリティの最適化