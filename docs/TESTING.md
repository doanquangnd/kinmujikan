# Hướng dẫn kiểm thử 勤務時間 (Kinmu Jikan)

## 1. Chạy local (vercel dev)

```bash
npm install
cp .env.example .env
# Sửa .env: POSTGRES_URL (hoặc DATABASE_URL), JWT_SECRET
vercel dev
```

Mở http://localhost:3000. Frontend và API chạy cùng process.

## 2. Test với DB production

Để debug với dữ liệu thật đã lưu trên Vercel:

1. Vercel Dashboard > Storage > Postgres > lấy connection string
2. Thêm vào `.env`: `POSTGRES_URL=...`, `JWT_SECRET=...` (cùng giá trị trên Vercel)
3. Chạy `vercel dev`
4. Mở http://localhost:3000

## 3. Deploy production

1. Vercel Dashboard > Project > Root Directory: để trống hoặc `.`
2. Storage > Postgres > chạy `sql/schema.sql`
3. Environment Variables: `JWT_SECRET`, `POSTGRES_URL`
4. Push lên GitHub

## 4. Checklist chức năng

| Chức năng | Mô tả |
|-----------|-------|
| Đăng ký | Email hợp lệ, mật khẩu >= 6 ký tự |
| Đăng nhập | Email + mật khẩu đúng |
| Dashboard | Danh sách tháng, tổng phút |
| Tạo tháng | Chọn năm/tháng, nhập giờ, lưu |
| Xem/Sửa tháng | Hiển thị và cập nhật bản ghi |
| Đổi mật khẩu | Mật khẩu hiện tại đúng, mới >= 6 ký tự |

## 5. Xử lý lỗi

| Lỗi | Cách xử lý |
|-----|------------|
| Không kết nối API | Chạy `vercel dev` thay vì `npm run dev` |
| 500 Internal Server Error | Kiểm tra POSTGRES_URL, JWT_SECRET; xem log `vercel dev` |
| 401 Unauthorized | Đăng xuất và đăng nhập lại |
