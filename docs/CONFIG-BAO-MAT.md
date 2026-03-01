# Cấu hình bảo mật

## 1. Ẩn khỏi tìm kiếm

- `index.html` có `<meta name="robots" content="noindex, nofollow">`.

## 2. Cloudflare Turnstile (đăng nhập / đăng ký)

- **Vercel Environment Variables:** `TURNSTILE_SECRET` (secret key từ Cloudflare Dashboard).
- **Frontend:** `VITE_TURNSTILE_SITE_KEY` (site key).

Để trống cả hai = không dùng Turnstile (phù hợp dev local).

## 3. Biến môi trường production

- `JWT_SECRET`: chuỗi bí mật mạnh (vd: `openssl rand -base64 32`).
- `POSTGRES_URL` / `DATABASE_URL`: tự động khi thêm Postgres trong Vercel.

Không commit `.env`, `.env.local` lên Git.
