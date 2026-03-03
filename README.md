# 勤務時間 (Kinmu Jikan)

Ứng dụng quản lý, ghi chú thời gian làm việc theo tháng với template phổ biến tại Nhật. 

React + Vite + TailwindCSS, API Node.js (Neon Postgres) .

Xem [CHANGELOG.md](./CHANGELOG.md) để biết lịch sử thay đổi.

## Yêu cầu

- Node.js 18+
- Tài khoản Vercel (deploy)
- Neon Postgres (qua Vercel Storage)

## Cấu trúc

```
├── api/           # Serverless API (auth, work-records, cron)
├── lib/           # db, auth, rateLimit, turnstile (dùng bởi api/)
├── sql/           # schema.sql
├── src/           # React app (TypeScript)
├── public/
├── scripts/
└── docs/
```

## Cài đặt local

```bash
npm install
cp .env.example .env
# Sửa .env: POSTGRES_URL (hoặc DATABASE_URL), JWT_SECRET
vercel dev
```

Mở http://localhost:3000. Frontend và API chạy cùng process.

**Lưu ý:** Chỉ dùng `npm run dev` khi chạy frontend thuần (không có API). Để có API local, dùng `vercel dev`.

## Deploy Vercel

1. Vercel Dashboard > Project > **Settings** > **General** > Root Directory: để trống hoặc `.` (project root)
2. Storage > Create Database > Postgres. Chạy `sql/schema.sql` trong Query tab.
3. Environment Variables: `JWT_SECRET`, `POSTGRES_URL` (tự động khi thêm Postgres), `CRON_SECRET` (tối thiểu 16 ký tự, cho cron dọn rate_limit)
4. Push lên GitHub – Vercel tự deploy.

## Test local với DB production

1. Vercel Dashboard > Storage > Postgres > lấy connection string
2. Thêm vào `.env`: `POSTGRES_URL=...`, `JWT_SECRET=...` (cùng giá trị trên Vercel)
3. Chạy `vercel dev`
4. Mở http://localhost:3000

Xem `docs/TESTING.md` chi tiết.
