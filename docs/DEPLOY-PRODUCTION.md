# Kiểm tra cấu hình trước khi deploy production

Dùng checklist này trước khi đưa ứng dụng lên môi trường production.

---

## Backend

### 1. File `backend/.env`

- [ ] **APP_ENV** = `production` (không dùng `development` để tránh lộ `debug_origin_received` khi 403).
- [ ] **DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS**: dùng tài khoản MySQL production, không dùng root/root nếu có thể.
- [ ] **JWT_SECRET**: đổi thành chuỗi bí mật dài, ngẫu nhiên (ví dụ `openssl rand -base64 32`). Không giữ giá trị mặc định `thay_bang_chuoi_bi_mat_dai_va_ngau_nhien`.
- [ ] **CORS_ORIGINS**: chỉ chứa origin frontend production (ví dụ `https://kinmujikan.example.com`). Xóa các origin local (localhost, 127.0.0.1) trên server production.
- [ ] **TURNSTILE_SECRET**: nếu bật Turnstile thì điền secret key từ Cloudflare Dashboard; nếu không dùng thì để trống.

### 2. Bảo mật PHP

- [ ] `display_errors` = 0 (đã set trong `public/index.php`).
- [ ] `expose_php` = 0 (đã set trong `public/index.php`).
- [ ] Log lỗi ghi vào file (đã cấu hình trong index.php), không in ra response.

### 3. Thư mục và quyền

- [ ] `backend/storage/logs/` tồn tại và PHP có quyền ghi.
- [ ] `backend/storage/rate_limit/` tồn tại và PHP có quyền ghi.
- [ ] File `.env` không nằm trong thư mục public (đã đặt ở `backend/.env`, document root là `backend/public/`).

### 4. Timezone

- [ ] Đã set `date_default_timezone_set('Asia/Tokyo')` trong `config/database.php`.

---

## Frontend

### 1. Build production

- [ ] Chạy `npm run build` trong thư mục `frontend/`.
- [ ] **VITE_API_URL**: khi build production, set biến môi trường bằng URL backend (ví dụ `https://api.example.com`). Nếu frontend và API cùng domain (proxy), có thể để trống.
- [ ] **VITE_TURNSTILE_SITE_KEY**: nếu bật Turnstile thì set site key khi build; nếu không thì để trống.

Ví dụ build với API URL:

```bash
VITE_API_URL=https://api.yourapp.com npm run build
```

### 2. Triển khai file tĩnh

- [ ] Deploy nội dung thư mục `frontend/dist/` lên web server hoặc CDN.
- [ ] Cấu hình server (Nginx/Apache) redirect SPA: mọi route trả về `index.html` (trừ file tĩnh).
- [ ] `index.html` đã có `<meta name="robots" content="noindex, nofollow">`.

---

## Sau khi deploy

- [ ] Mở frontend production, đăng nhập và gọi API: không bị 403 (đã cấu hình đúng CORS_ORIGINS).
- [ ] Refresh trang vẫn giữ đăng nhập (token + CORS đúng).
- [ ] Form đăng nhập/đăng ký: nếu bật Turnstile thì hiện widget và verify thành công.
- [ ] Đổi mật khẩu, tạo/sửa tháng hoạt động bình thường.

---

## Không commit lên Git

- [ ] `backend/.env` — đã có trong `backend/.gitignore` (cần tạo nếu chưa có).
- [ ] `frontend/.env` và `frontend/.env.local` — nên thêm vào `frontend/.gitignore` nếu chưa có.
- [ ] Chỉ commit `.env.example` với giá trị mẫu, không có secret thật.

---

## Tóm tắt biến môi trường

| Biến | Backend | Frontend (build) | Ghi chú |
|------|---------|-------------------|--------|
| APP_ENV | production | — | |
| DB_* | Đúng thông tin DB production | — | |
| JWT_SECRET | Chuỗi bí mật mạnh | — | Bắt buộc đổi |
| CORS_ORIGINS | Chỉ origin frontend production | — | |
| TURNSTILE_SECRET | Secret key (hoặc trống) | — | |
| VITE_API_URL | — | URL backend (hoặc trống nếu proxy) | |
| VITE_TURNSTILE_SITE_KEY | — | Site key (hoặc trống) | |
