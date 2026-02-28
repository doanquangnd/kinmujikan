# Phân tích và gợi ý tính năng, cải tiến UX/UI

## 1. Phân tích nhanh hiện trạng

### Đã có (sau khi tích hợp)
- Auth: đăng ký, đăng nhập, JWT, route bảo vệ.
- Dashboard: lọc năm (chỉ năm hiện tại + tối đa 10 năm trước), danh sách tháng có bản ghi, tổng 総業務時間, nút Xem / Sửa / Thêm mới; block "Tháng chưa có" (hiện toàn bộ tháng thiếu, disable + tooltip cho tháng chưa cho phép tạo); empty state + CTA.
- Modal Thêm mới: chọn năm/tháng (disable tháng đã có và tháng sau hơn 1 tháng), 開始/終了/休憩, đóng Esc, aria; giới hạn tạo tối đa đến tháng sau (frontend + backend).
- Trang tháng: bảng theo ngày, 休, 開始/終了 (HH:mm), 休憩(分), 総業務時間, 備考; highlight 土・日・ngày lễ; ngày lễ từ JSON; validation 開始 < 終了; custom modal cảnh báo ngày chưa nhập giờ; điền từ ngày trước (nút ←); export CSV; sticky header, hover hàng, focus ring; cảnh báo rời trang (beforeunload + confirm); overlay loading khi tải/save; chặn URL tạo tháng chưa cho phép và xem/sửa tháng chưa có bản ghi.
- Toast: góc trên phải, tự đóng 3s, dừng khi hover; style theo loại (success/info/warning/error), icon, thanh tiến trình, nút đóng.
- API: GET theo năm/tháng, POST bulk (validation tháng duy nhất + không cho tạo sau hơn 1 tháng), PUT từng bản ghi.
- UI: border, không shadow/gradient/blur; font Montserrat/Be Vietnam Pro; spacing nhất quán.

### Chưa làm (có thể làm tiếp)
- Dark mode (class `dark:`, toggle, localStorage).
- Focus trap trong modal (optional).
- In bảng (window.print + @media print).

---

## 2. Đã triển khai (checklist)

| Mục | Trạng thái | Ghi chú |
|-----|------------|--------|
| Validation 開始 < 終了 + cảnh báo ngày làm chưa nhập giờ | Xong | Lỗi inline ô 終了; custom modal thay confirm, hai nút Huỷ / Vẫn lưu. |
| Modal: disable tháng đã có; đóng Esc | Xong | Tháng đã có (trong năm đang chọn) disable; Esc đóng; aria. |
| Sticky header bảng + hover hàng + focus ring input | Xong | thead sticky, tr hover, input focus ring. |
| Empty state Dashboard + CTA | Xong | Block tiêu đề + mô tả + nút "Thêm tháng đầu tiên". |
| Cảnh báo rời trang khi có thay đổi chưa lưu | Xong | isDirtyRef, beforeunload, confirm khi Về Dashboard / Hủy. |
| Điền từ ngày trước / Fill down | Xong | Nút "←" trên từng hàng (khi có thể), copy 開始/終了/休憩 từ hàng trên. |
| Dashboard: block tháng chưa có + nút Thêm nhanh | Xong | Hiện toàn bộ tháng thiếu; tháng chưa cho phép tạo: disable + title "Chưa cho phép tạo". |
| Export CSV (client-side) | Xong | Nút "Xuất CSV" ở chế độ xem, tải file UTF-8. |
| Select năm: chỉ hiện tại + tối đa 10 năm trước | Xong | Dashboard dùng dashboardYears. |
| Giới hạn tạo mới: chỉ đến tháng sau | Xong | Frontend (Dashboard modal + MonthForm block) và backend create.php validate, trả 400 nếu quá hạn. |
| MonthForm: chặn URL tạo tháng chưa cho phép | Xong | isNew && isMoreThanOneMonthAhead → block "Không thể tạo" + Về Dashboard. |
| MonthForm: chặn xem/sửa tháng chưa có bản ghi | Xong | !isNew && hasNoRecords → block "Chưa có bản ghi" + Về Dashboard. |
| Toast thông báo (top right, 3s, stop on hover) | Xong | ToastContext, useToast(); style theo loại, icon, progress bar, nút đóng. |
| Loading overlay toàn màn hình | Xong | Khi tải trang tháng và khi nhấn Lưu; spinner + message. |
| Custom modal thay alert cảnh báo ngày chưa nhập | Xong | confirmEmptyDaysModal, Huỷ / Vẫn lưu, Esc đóng. |
| Loading skeleton Dashboard | Xong | Vài khối placeholder animate-pulse thay "Đang tải...". |
| Nút Thử lại khi lỗi tải tháng (xem/sửa) | Xong | Phân biệt loadError vs hasNoRecords; khi loadError hiển thị "Lỗi tải dữ liệu" + Thử lại + Về Dashboard. |

---

## 3. Gợi ý tính năng mới (đã mô tả trong doc gốc)

### 3.1 Export tháng (CSV / in)
- CSV: đã làm. In: `window.print()` + CSS `@media print` ẩn header/footer, chỉ giữ bảng — chưa làm.

### 3.2 Điền nhanh
- Điền từ ngày trước: đã làm. "Điền xuống từ đây" (một hàng điền xuống nhiều ngày): chưa làm, tùy chọn.

### 3.3 Validation và cảnh báo
- Đã làm: 開始 < 終了 inline; modal cảnh báo ngày chưa nhập giờ trước khi lưu.

### 3.4 Dashboard: tháng chưa có
- Đã làm: block tháng thiếu, nút mở modal; tháng chưa cho phép: disable + tooltip.

### 3.5 Modal Thêm mới
- Đã làm: disable tháng đã có và tháng sau hơn 1 tháng; Esc; aria. Focus trap: chưa.

### 3.6 Cảnh báo rời trang
- Đã làm: beforeunload + confirm khi điều hướng.

---

## 4. Cải tiến UX/UI (đã làm / chưa làm)

| Mục | Trạng thái |
|-----|------------|
| Typography và spacing | Đã dùng font và spacing nhất quán. |
| Bảng: sticky header, hover, focus ring | Xong. |
| Dashboard: empty state | Xong. |
| Modal: Esc, role/aria | Xong. Focus trap: chưa. |
| Loading: overlay khi tải/save; skeleton Dashboard | Xong. |
| Lỗi API: message + nút Thử lại (màn tháng) | Xong. |
| Dark mode | Chưa. |

---

## 5. Tiếp tục tích hợp (ưu tiên)

| Ưu tiên | Nội dung | Effort |
|--------|----------|--------|
| 1 | In bảng (window.print + @media print) | Nhỏ |
| 2 | Focus trap trong modal (optional) | Nhỏ |
| 3 | Dark mode | Lớn |

Tài liệu này cập nhật theo tình trạng triển khai; khi làm tiếp bám theo UI rules (không shadow, border, font, spacing, không emoji, animation tối thiểu).
