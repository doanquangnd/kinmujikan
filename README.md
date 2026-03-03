# 勤務時間 (Kinmu Jikan)

日本の勤務時間管理に特化したWebアプリケーション。月単位で勤務記録を入力・管理し、実働時間・時間外・深夜・遅刻・早退を自動計算します。

**日本語** | [Tiếng Việt](./README.vi.md)

### スクリーンショット

![ダッシュボード](./pics/Dashboard.png)

![ダッシュボード - 新規追加](./pics/dashboard-new.png)

![勤務記録表](./pics/update.png)

## 概要

勤務時間は、日本企業でよく使われる勤務実績表の形式に沿って、以下の機能を提供します。

- **月単位の勤務記録**: 日付ごとに出勤・退勤・休憩時間を入力
- **就業時間**: 所定労働時間（開始・終了）を設定し、時間外・深夜・遅刻・早退を自動計算
- **区分**: 出勤、有給、代休、特休、欠勤を選択可能（土日祝は休日として自動設定、表示は空欄）
- **休日表示**: 土曜・日曜・祝日を自動表示
- **言語**: 日本語・ベトナム語対応
- **ダークモード**: ライト/ダークテーマ切り替え
- **印刷**: 1ページA4に収まるレイアウト、エクセル、CSV出力可

## 技術スタック

- **フロントエンド**: React 19 + Vite 7 + TailwindCSS 4 + TypeScript
- **API**: Node.js Serverless (Vercel)
- **データベース**: Neon Postgres

## 必要環境

- Node.js 18+
- Vercel アカウント（デプロイ用）
- Neon Postgres（Vercel Storage 経由）

## プロジェクト構成

```
├── api/           # Serverless API（auth, work-records, cron）
├── lib/           # db, auth, rateLimit, turnstile
├── sql/           # schema.sql, migration
├── src/           # React アプリ（TypeScript）
├── public/
├── pics/          # README用画像
├── scripts/
└── docs/
```

## ローカル環境のセットアップ

```bash
npm install
cp .env.example .env
# .env を編集: POSTGRES_URL（または DATABASE_URL）, JWT_SECRET
vercel dev
```

http://localhost:3000 を開く。フロントエンドとAPIが同一プロセスで動作します。

**注意:** API なしでフロントエンドのみ実行する場合は `npm run dev` を使用。API を含むローカル環境では `vercel dev` を使用してください。

## Vercel へのデプロイ

1. Vercel Dashboard > Project > **Settings** > **General** > Root Directory: 空欄または `.`
2. Storage > Create Database > Postgres。Query タブで `sql/schema.sql` を実行。
3. Environment Variables: `JWT_SECRET`, `POSTGRES_URL`（Postgres 追加時に自動設定）, `CRON_SECRET`（16文字以上、cron 用）
4. GitHub にプッシュすると Vercel が自動デプロイ

## 本番DBでローカルテスト

1. Vercel Dashboard > Storage > Postgres > 接続文字列を取得
2. `.env` に追加: `POSTGRES_URL=...`, `JWT_SECRET=...`（Vercel と同じ値）
3. `vercel dev` を実行
4. http://localhost:3000 を開く

詳細は `docs/TESTING.md` を参照。

## 変更履歴

[CHANGELOG.md](./CHANGELOG.md) を参照。
