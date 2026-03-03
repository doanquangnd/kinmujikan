# X-Forwarded-For và Reverse Proxy

Tài liệu ghi chú về cách lấy IP client khi ứng dụng chạy sau reverse proxy (Vercel, nginx, Cloudflare...).

## Ngữ cảnh

Rate limit (`lib/rateLimit.ts`) dùng IP client để giới hạn request. Khi đứng sau reverse proxy, `req.socket.remoteAddress` trả về IP của proxy, không phải IP người dùng.

## Cách lấy IP

`get_client_ip()` ưu tiên:

1. `x-forwarded-for` – chuỗi IP, phần tử đầu là client (vd: `"1.2.3.4, 10.0.0.1"` → `1.2.3.4`)
2. `x-real-ip` – IP client trực tiếp
3. `req.socket.remoteAddress` – fallback khi không có proxy

## Bảo mật

- **X-Forwarded-For có thể bị giả mạo** nếu client gửi trực tiếp header.
- **Chỉ tin header khi đứng sau proxy tin cậy** (Vercel, nginx, Cloudflare do mình cấu hình).
- Proxy phải **ghi đè hoặc append** IP thật, không chuyển nguyên header từ client.

## Vercel

Vercel tự set `x-forwarded-for` và `x-real-ip`. Không cần cấu hình thêm.

## Nginx

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

`$proxy_add_x_forwarded_for` append IP client vào chuỗi. Phần tử đầu là client.

## Cloudflare

Cloudflare tự thêm `CF-Connecting-IP` (IP client thật). Có thể dùng thay cho `x-forwarded-for` nếu cần.

## Khi tự host

Nếu deploy sau reverse proxy khác (Traefik, Caddy...), cần đảm bảo proxy set đúng `X-Forwarded-For` hoặc `X-Real-IP` từ IP kết nối thật.
