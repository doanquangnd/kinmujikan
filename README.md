# 勤務時間 (Kinmu Jikan)

Ứng dụng quản lý thời gian làm việc theo tháng. Backend PHP thuần + MySQL, Frontend React + TailwindCSS.

## Yêu cầu

- PHP 8.1+ (extension PDO, json, mbstring)
- MySQL 5.7+ hoặc MariaDB
- Node 18+ (cho frontend)

## Cài đặt

### 1. Database

Tạo database và bảng:

```bash
mysql -u root -p < backend/sql/schema.sql
```

Nếu đã có database từ trước (chưa có cột `rest_day`), chạy migration:

```bash
mysql -u root -p kinmu_jikan < backend/sql/add_rest_day.sql
```

### 2. Backend (PHP)

```bash
cd backend
cp .env.example .env
# Sửa .env: DB_*, JWT_SECRET, CORS_ORIGIN (ví dụ http://localhost:5173)
php -S localhost:8000 -t public public/router.php
```

Backend chạy tại http://localhost:8000. API: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/work-records?year=...`, `/api/work-records?year=...&month=...`, POST/PUT work-records.

### 3. Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env
# Mặc định: proxy /api -> http://127.0.0.1:8000 (backend cùng máy với Vite).
# Nếu đăng ký/đăng nhập bị 500 khi dùng proxy: mở .env, set VITE_API_URL=http://localhost:8000
# rồi restart npm run dev (frontend gọi backend trực tiếp, CORS đã cấu hình trong backend .env).
npm run dev
```

Frontend chạy tại http://localhost:5174 (hoặc port Vite báo).

**Hai process bắt buộc:** (1) Backend: `cd backend && php -S 0.0.0.0:8000 -t public public/router.php`. (2) Frontend: `cd frontend && npm run dev`. Nếu thiếu backend sẽ thấy lỗi proxy `ECONNREFUSED 127.0.0.1:8000`.

**Backend chạy trong Docker/container:** Vite chạy trên host cần kết nối tới port 8000 của host. Container phải **publish** port 8000 ra host (vd. `ports: - "8000:8000"`). Trong `frontend/.env` có thể set `VITE_PROXY_TARGET=http://localhost:8000` (thử thay `127.0.0.1` bằng `localhost` nếu vẫn ECONNREFUSED).

**WSL + trình duyệt Windows:** Giữ `VITE_API_URL` trống. Chạy backend và frontend trong WSL (hai terminal), mở http://localhost:5174 trên Windows.

**Frontend chạy trong Docker/container:** Để truy cập từ trình duyệt trên host:
- Vite đã cấu hình `host: '0.0.0.0'` và `port: 5174` trong `vite.config.js` (server lắng nghe mọi interface trong container).
- Container frontend cần **publish port 5174** ra host, ví dụ `ports: - "5174:5174"`. Sau đó mở http://localhost:5174 trên trình duyệt.
- Nếu backend cũng trong container: trong `frontend/.env` set `VITE_PROXY_TARGET=http://<tên-service-backend>:8000` (tên service trong docker-compose, ví dụ `http://workspace:8000` hoặc `http://backend:8000`) để proxy từ container frontend tới container backend.

**Frontend (Vercel) + Backend (InfinityFree):** `vercel.json` đã cấu hình rewrite `/api/*` proxy tới backend. Frontend gọi `/api/...` (cùng domain) nên không cần CORS. **Không set** `VITE_API_URL` khi deploy Vercel. Nếu đổi URL backend: sửa `destination` trong `vercel.json`.

## Cấu trúc

- `backend/` – PHP thuần: `public/` (entry), `config/`, `includes/` (db, jwt, auth), `api/` (auth, work-records), `sql/`
- `frontend/` – React (Vite): `src/api/`, `src/context/`, `src/pages/`, `src/utils/`, `src/constants/`
- `docs/` – Phân tích yêu cầu và công nghệ
