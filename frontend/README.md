# 勤務時間 (Kinmu Jikan) - Frontend + API

React + Vite + TailwindCSS. API Node.js (Neon Postgres) gộp trong cùng project.

## Cấu trúc

- `src/` – React app
- `api/` – Serverless API (auth, work-records)
- `lib/` – db, auth, response (dùng bởi api/)
- `sql/schema.sql` – Schema PostgreSQL

## Deploy Vercel (root directory: frontend)

### 1. Thêm Postgres

Vercel Dashboard > Project > Storage > Create Database > Postgres. Vercel tự thêm `POSTGRES_URL`.

### 2. Chạy schema

Trong Postgres Query tab, chạy nội dung `sql/schema.sql`.

### 3. Biến môi trường

Project Settings > Environment Variables:

- `JWT_SECRET` – chuỗi bí mật (vd: `openssl rand -base64 32`)
- `POSTGRES_URL` / `DATABASE_URL` – tự động khi thêm Postgres

### 4. Deploy

Push lên GitHub. Vercel tự build và deploy. Request `/api/*` chạy serverless trong cùng project.

## Chạy local (vercel dev)

```bash
npm install
cp .env.example .env
# Sửa .env: POSTGRES_URL (hoặc DATABASE_URL), JWT_SECRET
vercel dev
```

Mở http://localhost:3000. Frontend và API chạy cùng process.

## Chạy local với backend PHP riêng

```bash
# Terminal 1: backend PHP
cd ../backend && php -S 0.0.0.0:8000 -t public public/router.php

# Terminal 2: frontend
npm install
cp .env.example .env
# VITE_PROXY_TARGET=http://127.0.0.1:8000
npm run dev
```
