# Phân tích hiệu năng: Query và Render khi chuyển trang

## Tóm tắt

Khi chuyển trang (Dashboard -> Tháng, hoặc giữa các tháng), độ trễ có thể đến từ:
1. **Server**: Cold start Vercel serverless, thời gian query Neon
2. **Network**: Round-trip API
3. **Frontend**: Xử lý dữ liệu, render React

## Các thay đổi đã thực hiện

### 1. Tối ưu query API (api/work-records.js)

**Query danh sách tháng theo năm** (GET ?year=2026):
- Trước: `WHERE EXTRACT(YEAR FROM work_date) = ${year}` — không tận dụng index
- Sau: `WHERE work_date >= '2026-01-01' AND work_date < '2027-01-01'` — dùng được index `idx_work_records_user_date`

**Query records theo tháng** (GET ?year=2026&month=1):
- Đã dùng index tốt từ trước: `WHERE user_id = ? AND work_date >= ? AND work_date <= ?`
- Không cần thay đổi

### 2. Thêm Server-Timing header

API trả về header `Server-Timing` với thời gian query DB (ms). Xem trong:
- Chrome DevTools: Network tab -> chọn request -> Headers -> Server-Timing
- Hoặc Response Headers

Ví dụ: `db;dur=45;desc="query records"` = query mất 45ms.

### 3. Log thời gian API phía client (chỉ DEV)

Trong `src/api/workRecords.js`, khi chạy `npm run dev`:
- Console sẽ log: `[API] fetchRecordsByMonth(2026/1): 320ms`
- Giúp phân biệt: nếu số lớn (>500ms) thường là network/server; nếu nhỏ mà vẫn lag thì do render.

## Cách chẩn đoán bottleneck

### Bước 1: Chạy local với vercel dev

```bash
vercel dev
```

Mở app, chuyển trang, mở Console (F12) và xem log `[API] fetchRecordsByMonth(...): Xms`.

### Bước 2: So sánh Server-Timing và tổng thời gian request

- Trong Network tab: xem **Time** của request `/api/work-records?year=...&month=...`
- Trong Response Headers: xem `Server-Timing` (thời gian DB)

Phân tích:
- **Time lớn, Server-Timing nhỏ**: Phần lớn thời gian là cold start hoặc network
- **Time và Server-Timing đều lớn**: Query DB chậm (kiểm tra index, số lượng bản ghi)
- **Time nhỏ, UI vẫn lag**: Nghi ngờ render (React, mergeRecordsIntoRows, v.v.)

### Bước 3: Kiểm tra cold start (production)

Trên Vercel, function serverless có thể sleep sau ~5–15 phút không dùng. Request đầu tiên sau đó thường chậm 1–3s do cold start. Các request tiếp theo nhanh hơn.

## Nguyên nhân thường gặp

| Nguyên nhân | Triệu chứng | Hướng xử lý |
|-------------|-------------|-------------|
| Cold start Vercel | Request đầu tiên sau khi idle rất chậm | Giữ warm bằng cron, hoặc chấp nhận cho serverless |
| Cold start Neon | Query đầu tiên chậm | Neon serverless dùng HTTP, cold start thường ngắn |
| Query không dùng index | Server-Timing lớn (>200ms) với ít bản ghi | Đã sửa query months; kiểm tra EXPLAIN ANALYZE |
| Network xa | Time lớn, Server-Timing nhỏ | CDN, deploy gần user |
| Render nặng | Time nhỏ, UI vẫn lag sau khi data về | React.memo, virtual list, giảm re-render |

## Đề xuất tối ưu thêm (nếu cần)

1. **Cache phía client**: Dùng SWR hoặc React Query để cache `fetchRecordsByMonth` — khi quay lại tháng đã xem, hiển thị ngay dữ liệu cũ rồi revalidate.
2. **Skeleton thay vì LoadingOverlay**: Hiển thị bảng skeleton thay vì màn hình trắng, cải thiện cảm nhận tốc độ.
3. **Prefetch**: Khi hover vào nút "Xem" hoặc "Sửa", prefetch dữ liệu tháng đó.
4. **React.memo cho MonthFormRow**: Giảm re-render khi chỉ một vài ô thay đổi.

## Index hiện có

```sql
CREATE INDEX idx_work_records_user_date ON work_records(user_id, work_date);
```

Index này phù hợp cho:
- `WHERE user_id = ? AND work_date >= ? AND work_date <= ?` (records theo tháng)
- `WHERE user_id = ? AND work_date >= ? AND work_date < ?` (months theo năm, đã tối ưu)
