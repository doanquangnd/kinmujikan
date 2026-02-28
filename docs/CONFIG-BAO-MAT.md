# Cấu hình bảo mật và ẩn ứng dụng

Ứng dụng dùng cá nhân: ẩn khỏi tìm kiếm, chặn bot, chỉ nhận request từ frontend, Turnstile và giới hạn đăng nhập/đăng ký.

## 1. Ẩn khỏi internet và chặn bot

- **Frontend:** `index.html` có `<meta name="robots" content="noindex, nofollow">` để công cụ tìm kiếm không index trang.
- **Backend:** Mọi response gửi header `X-Robots-Tag: noindex, nofollow`.
- **User-Agent:** Request có User-Agent chứa từ khóa bot/crawler (googlebot, bingbot, …) bị trả 403.

## 2. Backend chỉ nhận request từ frontend

Khi trong `.env` đặt `CORS_ORIGIN` (hoặc `CORS_ORIGINS`) thành một hoặc nhiều origin cụ thể (không phải `*`):

- Mỗi request phải có header `Origin` khớp với danh sách đã cấu hình.
- Nếu không có Origin hoặc Origin không khớp, backend trả **403 Forbidden**.

Cấu hình trong `backend/.env`:

```env
CORS_ORIGIN=https://your-frontend-domain.com
# Hoặc nhiều origin, cách nhau bằng dấu phẩy:
# CORS_ORIGINS=https://app.example.com,https://www.example.com
```

Khi dev local: nếu bạn mở app bằng `http://127.0.0.1:8000` thì Origin sẽ là giá trị đó, khác với `http://localhost:5174`. Cần khai báo **cả hai** trong `CORS_ORIGINS` (cách nhau bằng dấu phẩy) để tránh 403 sau đăng nhập hoặc khi refresh trang.

## 3. Cloudflare Turnstile (đăng nhập / đăng ký)

- **Backend:** Trong `backend/.env` thêm:
  ```env
  TURNSTILE_SECRET=<secret key từ Cloudflare Dashboard>
  ```
  Lấy key tại: Cloudflare Dashboard → Turnstile → tạo widget → copy Secret Key.

- **Frontend:** Trong `frontend/.env` (hoặc biến môi trường build):
  ```env
  VITE_TURNSTILE_SITE_KEY=<site key từ Cloudflare Dashboard>
  ```

- Nếu **không** cấu hình:
  - Để trống `TURNSTILE_SECRET`: backend không verify token (phù hợp dev local).
  - Để trống `VITE_TURNSTILE_SITE_KEY`: frontend không hiện widget, gửi token rỗng; backend chỉ chấp nhận khi đã tắt verify (secret trống).

## 4. Giới hạn tần suất (rate limit)

- **Đăng nhập:** tối đa **3 lần / phút** theo IP. Vượt thì trả **429 Too Many Requests**.
- **Đăng ký:** tối đa **1 lần / 2 phút** theo IP. Vượt thì trả **429** và header `Retry-After`.

Dữ liệu rate limit lưu file trong `backend/storage/rate_limit/`. Cần quyền ghi thư mục này.

## 5. Kiểm tra nhanh

- Meta robots: xem source trang frontend, có `noindex, nofollow`.
- CORS: gọi API từ domain khác (hoặc Origin khác) → 403 khi đã set `CORS_ORIGIN` cụ thể.
- Turnstile: mở form đăng nhập/đăng ký, thấy widget (khi đã set site key); submit không có token hoặc token sai → 400.
- Rate limit: đăng nhập sai 4 lần trong 1 phút → 429; đăng ký 2 lần trong 2 phút → 429.
