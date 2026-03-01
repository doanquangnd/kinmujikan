# Deploy production (Vercel)

## Trước khi deploy

- [ ] Vercel Dashboard > Project > **Root Directory**: để trống hoặc `.`
- [ ] Storage > Postgres > chạy `sql/schema.sql`
- [ ] Environment Variables: `JWT_SECRET`, `POSTGRES_URL` (tự động khi thêm Postgres)
- [ ] `JWT_SECRET` đổi thành chuỗi bí mật mạnh (vd: `openssl rand -base64 32`)

## Deploy

Push lên GitHub. Vercel tự build và deploy.

## Sau khi deploy

- [ ] Đăng ký, đăng nhập hoạt động
- [ ] Tạo/sửa/xem bản ghi tháng hoạt động
- [ ] Đổi mật khẩu hoạt động
