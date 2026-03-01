# Hướng dẫn kiểm thử 勤務時間 (Kinmu Jikan)

Tài liệu mô tả cách chạy và kiểm thử ứng dụng với backend PHP hoặc backend Node.js.

---

## 1. Test với Backend PHP (MySQL)

### Yêu cầu

- PHP 8.1+ (PDO, json, mbstring)
- MySQL 5.7+ hoặc MariaDB
- Node.js 18+

### Bước 1: Database

```bash
mysql -u root -p < backend/sql/schema.sql
```

Nếu đã có database, chạy migration `rest_day`:

```bash
mysql -u root -p kinmu_jikan < backend/sql/add_rest_day.sql
```

### Bước 2: Backend PHP

```bash
cd backend
cp .env.example .env
# Sửa .env: DB_HOST, DB_NAME, DB_USER, DB_PASS, JWT_SECRET
php -S 0.0.0.0:8000 -t public public/router.php
```

Backend chạy tại http://127.0.0.1:8000.

### Bước 3: Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Giữ VITE_PROXY_TARGET=http://127.0.0.1:8000 (mặc định)
npm run dev
```

Frontend chạy tại http://localhost:5174. Request `/api/*` được proxy tới backend port 8000.

### Kiểm tra nhanh

1. Mở http://localhost:5174
2. Đăng ký tài khoản mới (email + mật khẩu)
3. Đăng nhập
4. Tạo bản ghi tháng (chọn năm, tháng, nhập giờ làm việc)
5. Cập nhật bản ghi, đổi mật khẩu

---

## 2. Test với Backend Node.js (Neon Postgres)

### Yêu cầu

- Node.js 18+
- Tài khoản Neon (https://neon.tech) hoặc Vercel Postgres
- Vercel CLI: `npm i -g vercel`

### Bước 1: Database Neon

1. Tạo project tại https://console.neon.tech
2. Copy connection string (PostgreSQL)
3. Trong Neon SQL Editor, chạy nội dung `backend-nodejs/sql/schema.sql`

### Bước 2: Backend Node.js

```bash
cd backend-nodejs
npm install
cp .env.example .env
```

Sửa `.env`:

```
POSTGRES_URL=postgresql://user:pass@host/db?sslmode=require
# hoặc DATABASE_URL=...
JWT_SECRET=chuoi-bi-mat-dai-ngau-nhien
```

Chạy backend (Vercel dev server):

```bash
vercel dev
```

Backend chạy tại http://127.0.0.1:3000 (mặc định).

### Bước 3: Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Sửa `.env`:

```
VITE_PROXY_TARGET=http://127.0.0.1:3000
```

Chạy frontend:

```bash
npm run dev
```

Frontend chạy tại http://localhost:5174. Request `/api/*` được proxy tới backend port 3000.

### Kiểm tra nhanh

1. Mở http://localhost:5174
2. Đăng ký, đăng nhập, tạo/cập nhật bản ghi (giống backend PHP)

---

## 3. Test Production (Vercel) – API gộp trong frontend

Khi dùng cấu trúc gộp (api/ và lib/ trong frontend/):

1. Vercel Dashboard > Project (root: frontend) > Storage > Create Database > Postgres
2. Chạy `sql/schema.sql` trong Postgres Query
3. Environment Variables: `JWT_SECRET`, `POSTGRES_URL` (tự động khi thêm Postgres)
4. Push lên GitHub – Vercel tự deploy. Request `/api/*` chạy serverless trong cùng project.

Không cần rewrite proxy ra ngoài. Xem `frontend/README.md` chi tiết.

---

## 4. Checklist kiểm thử chức năng

| Chức năng | Mô tả |
|-----------|-------|
| Đăng ký | Email hợp lệ, mật khẩu >= 6 ký tự, không trùng email |
| Đăng nhập | Email + mật khẩu đúng |
| Đăng xuất | Xóa token, chuyển về trang đăng nhập |
| Dashboard | Hiển thị danh sách tháng có dữ liệu, tổng phút |
| Tạo tháng | Chọn năm/tháng, nhập giờ từng ngày, lưu |
| Cập nhật tháng | Sửa giờ, nghỉ, ghi chú, lưu |
| Đổi mật khẩu | Mật khẩu hiện tại đúng, mật khẩu mới >= 6 ký tự |

---

## 5. Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|------------|
| ECONNREFUSED / Không kết nối backend | Backend chưa chạy | Chạy backend (PHP hoặc vercel dev) trước frontend |
| 500 Internal Server Error | Lỗi backend (DB, config) | Kiểm tra log: PHP `backend/storage/logs/error.log`, Node xem console `vercel dev` |
| 401 Unauthorized | Token hết hạn hoặc sai | Đăng xuất và đăng nhập lại |
| 409 Conflict | Email đã tồn tại / Tháng đã có bản ghi | Dùng email khác hoặc tháng khác |

---

## 6. WSL + trình duyệt Windows

Chạy backend và frontend trong WSL. Mở http://localhost:5174 trên trình duyệt Windows. Vite đã cấu hình `host: 0.0.0.0` nên truy cập được từ Windows.
