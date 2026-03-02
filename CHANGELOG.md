# Changelog

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/).

## [Unreleased]

### Thêm mới

- Migrate sang TypeScript (API, frontend)
- Cloudflare Turnstile cho login/register, verify server-side
- Rate limit cho login (5/phút) và register (3/phút)
- Cron cleanup bảng `rate_limit` mỗi ngày (00:00 UTC) để tránh phình to
- Nhập nhanh giờ: gõ `0930` tự format thành `09:30` (開始/終了)
- Biến môi trường `VITE_TURNSTILE_TEST_LOCAL` để test Turnstile trên localhost

### Thay đổi

- JWT lưu trong HttpOnly Secure Cookie thay vì localStorage
- CORS whitelist qua `CORS_ALLOWED_ORIGINS`
- Validation input bằng Zod (login, register, change-password)
- `JWT_SECRET` bắt buộc, không còn default

### Bảo mật

- Token không còn truy cập được từ JavaScript (XSS)
- Turnstile verify server-side trước khi xử lý đăng ký/đăng nhập
