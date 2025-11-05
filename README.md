# ビザ選定エキスパートシステム

オブジェクト指向エキスパートシステムを用いたビザ診断Webアプリケーション

## 特徴

- **バックワードチェイニング（後向き推論）方式**の推論エンジン
- **30個のビザルール**を実装（E、B、L、H-1B、J-1ビザ）
- **2分割画面**で診断と推論過程を同時表示
- **リアルタイムでルールの評価状態を可視化**
- **色分けによる状態表示**（未確認、Yes、No、導出、発火）

## 技術スタック

### バックエンド
- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL / SQLite
- Pydantic

### フロントエンド
- React 18
- Vite
- Tailwind CSS

### デプロイ
- Render (バックエンド Web Service)
- Render (フロントエンド Static Site)
- Render (PostgreSQL Database)

## ローカル開発

### バックエンド

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python app/main.py
\`\`\`

バックエンドは http://localhost:8000 で起動します。

### フロントエンド

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

フロントエンドは http://localhost:5173 で起動します。

## Renderデプロイ

### 1. GitHubリポジトリ作成

\`\`\`bash
git init
git add .
git commit -m "Initial commit: Visa Expert System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/visa-expert-system.git
git push -u origin main
\`\`\`

### 2. Renderでバックエンドをデプロイ

1. [Render Dashboard](https://dashboard.render.com/) にアクセス
2. "New +" → "Web Service" を選択
3. GitHubリポジトリを接続
4. 設定:
   - **Name**: visa-expert-backend
   - **Root Directory**: backend
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3

### 3. Renderでデータベースを作成

1. "New +" → "PostgreSQL" を選択
2. 無料プラン選択
3. 作成後、"Internal Database URL"をコピー
4. バックエンドのWeb Serviceの環境変数に追加:
   - `DATABASE_URL` = (Internal Database URL)

### 4. Renderでフロントエンドをデプロイ

1. "New +" → "Static Site" を選択
2. GitHubリポジトリを接続
3. 設定:
   - **Name**: visa-expert-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist
4. 環境変数:
   - `VITE_API_BASE_URL` = (バックエンドのURL)

## システムアーキテクチャ

### 推論エンジン
- Smalltalkのプロダクションシステムを参考に実装
- WorkingMemory（作業記憶）でfindings（事実）とhypotheses（仮説）を管理
- ConflictSet（競合集合）で発火可能なルールを追跡
- バックワードチェイニングで効率的な質問順序を決定

### ルール構造
各ルールは以下の要素で構成:
- **id**: ルールID
- **name**: ルール名
- **visa_type**: ビザタイプ（E、B、L等）
- **rule_type**: #i1（開始ルール）または #m（問結ルール）
- **conditions**: 条件部（AND/OR演算子）
- **actions**: 結論部（導出される事実）
- **priority**: 優先順位
- **flag**: 有効/無効フラグ

## ライセンス

MIT License

## 作成者

Claude Code
