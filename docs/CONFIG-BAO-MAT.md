# Cấu hình bảo mật

## 1. Ẩn khỏi tìm kiếm

- `index.html` có `<meta name="robots" content="noindex, nofollow">`.

## 2. Cloudflare Turnstile (đăng nhập / đăng ký)

- **Vercel Environment Variables:** `TURNSTILE_SECRET` (secret key từ Cloudflare Dashboard).
- **Frontend:** `VITE_TURNSTILE_SITE_KEY` (site key).

Để trống cả hai = không dùng Turnstile (phù hợp dev local).

### Lỗi sandbox "allow-scripts" / about:blank

Nếu gặp: `Blocked script execution in 'about:blank' because the document's frame is sandboxed...`:

1. **CSP**: `vercel.json` đã thêm `frame-src` và `script-src` cho `https://challenges.cloudflare.com`.
2. **Extension trình duyệt**: Tắt ad-blocker, privacy extension (uBlock, Privacy Badger...) rồi thử lại.
3. **Incognito**: Mở cửa sổ ẩn danh để loại trừ extension.
4. **size**: Thử đổi `size` trong TurnstileWidget (vd. `compact` thay vì `normal`) nếu lỗi vẫn xảy ra.

## 3. Rate limit (đăng nhập / đăng ký)

- **Login**: 5 request/phút/IP
- **Register**: 3 request/phút/IP
- Lưu trong bảng `rate_limit` (PostgreSQL). Chạy `sql/rate_limit.sql` nếu deploy mới.
- Khi vượt giới hạn: HTTP 429 + header `Retry-After`.

## 4. Biến môi trường production

- `JWT_SECRET`: chuỗi bí mật mạnh (vd: `openssl rand -base64 32`).
- `POSTGRES_URL` / `DATABASE_URL`: tự động khi thêm Postgres trong Vercel.

Không commit `.env`, `.env.local` lên Git.
