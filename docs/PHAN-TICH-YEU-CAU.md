# Phân tích yêu cầu - Ứng dụng quản lý 勤務時間 (Kinmu Jikan)

## 1. Tổng quan

Ứng dụng web thay thế bảng Excel quản lý thời gian làm việc theo tháng. Mỗi người dùng đăng nhập chỉ xem/sửa dữ liệu 勤務時間 của chính mình, theo từng tháng.

---

## 2. Yêu cầu chức năng

### 2.1 Authentication (Xác thực)

| Chức năng | Mô tả |
|-----------|--------|
| Đăng ký | Email + mật khẩu (hash bcrypt), tên hiển thị (optional). |
| Đăng nhập | Email + mật khẩu, trả về token (JWT hoặc session). |
| Đăng xuất | Hủy token/session. |
| Phân quyền | Mỗi user chỉ truy cập CRUD bản ghi 勤務時間 của chính user_id. |

**Lưu ý:** Không cần role admin/user phức tạp trong phiên bản đơn giản; mọi user đăng nhập đều là "user thường" với dữ liệu riêng.

### 2.2 Dashboard (Trang chính)

| Chức năng | Mô tả |
|-----------|--------|
| Danh sách theo năm | Hiển thị danh sách các bản ghi trong năm theo tháng (2026年01月, 2026年02月, 2026年03月, ...). |
| Filter năm | Dropdown chọn năm; mặc định là năm hiện tại. Chỉ hiển thị các tháng có bản ghi trong năm đó. |
| Thứ tự | Bản ghi mới lên đầu (sort theo created_at hoặc year+month mới nhất trước). |
| Mỗi item trong list | Một tháng: hiển thị nhãn tháng (ví dụ 2026年01月) + tổng số giờ làm việc trong tháng đó; nút **Xem**, nút **Sửa**. Không có tính năng Xóa. |
| Nút Thêm mới | Click mở modal: chọn năm, tháng; 1 input giờ bắt đầu, 1 input giờ kết thúc, 1 input giờ/phút nghỉ (休憩); nút Xác nhận. Khi nhấn Xác nhận → chuyển đến trang thêm mới (create form) với dữ liệu đã chọn. |

### 2.3 Tính năng Thêm mới (Trang thêm mới)

| Chức năng | Mô tả |
|-----------|--------|
| Dữ liệu đầu vào | Nhận từ modal Thêm mới: năm, tháng, (optional) giờ bắt đầu, giờ kết thúc, giờ/phút nghỉ. |
| Form dạng bảng | Render form nhập liệu dạng bảng giống Excel; số hàng = số ngày trong tháng (28–31). Cột: 日付(日・曜), 就業時間(開始・終了), 休憩, 総業務時間, 備考. |
| Auto-fill từ modal | Nếu trong modal đã nhập giờ bắt đầu, giờ kết thúc, giờ/phút nghỉ → tự động điền vào tất cả ô trong bảng, **trừ** Thứ Bảy (土), Chủ Nhật (日) và ngày lễ. |
| Ngày lễ Nhật | Có danh sách ngày lễ cố định của Nhật (ví dụ 元日 1/1, 成人の日 thứ 2 tuần 2 tháng 1, 建国記念の日 2/11, ...); khi đổi tháng/năm frontend tự động điền tên ngày lễ vào cột 備考 tương ứng. Nguồn: constant trong code hoặc API nhỏ trả ngày lễ theo năm. |
| Highlight 土・日・ngày lễ | Chữ màu đỏ, nền xám cho các ô thuộc Thứ Bảy, Chủ Nhật và ngày lễ. |
| Đơn vị 休憩 | Phút (ví dụ 60 = 1 giờ). |
| 総業務時間 | Không làm tròn; tính chính xác theo phút. |
| Tính duy nhất tháng | Mỗi tháng trong năm là duy nhất trên mỗi user: ví dụ đã có bản ghi tháng 1/2026 thì không cho thêm tháng 1/2026 nữa (validation khi tạo). |

### 2.4 Tính năng Sửa (Trang sửa)

| Chức năng | Mô tả |
|-----------|--------|
| Khóa năm, tháng | Không cho phép thay đổi năm, tháng; chỉ hiển thị (read-only). |
| Cho phép sửa | Chỉ được sửa: giờ bắt đầu, giờ kết thúc, giờ/phút nghỉ (休憩), 備考. Form bảng giống trang thêm mới. |

### 2.5 Dữ liệu mẫu từ Excel (tham chiếu)

- **Ngày thường có làm:** 開始 09:30, 終了 18:30, 休憩 60 phút → 総業務時間 8:00 (tính chính xác phút).
- **Ngày nghỉ lễ/ghi chú:** 備考 có text (元日, 年始休暇, 年休, 1月成人の日); 開始/終了/休憩 để trống; 総業務時間 = 0 hoặc trống.
- **Cuối tuần (土・日):** Highlight đỏ, nền xám; thường không auto-fill giờ.

---

## 3. Mô hình dữ liệu (MySQL)

### 3.1 Bảng `users`

| Cột | Kiểu | Mô tả |
|-----|------|--------|
| id | INT AUTO_INCREMENT PRIMARY KEY | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | bcrypt |
| display_name | VARCHAR(100) | Tên hiển thị (optional) |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### 3.2 Bảng `work_records` (勤務時間 theo ngày)

| Cột | Kiểu | Mô tả |
|-----|------|--------|
| id | INT AUTO_INCREMENT PRIMARY KEY | |
| user_id | INT NOT NULL, FK → users.id | Chủ bản ghi |
| work_date | DATE NOT NULL | Ngày làm việc (1 ngày = 1 bản ghi) |
| time_start | TIME NULL | 開始 (null = nghỉ/trống) |
| time_end | TIME NULL | 終了 |
| break_minutes | INT NULL | 休憩 (phút, ví dụ 60 = 1:00) |
| note | VARCHAR(500) NULL | 備考 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**Ràng buộc:** UNIQUE(user_id, work_date) — mỗi user chỉ có tối đa một bản ghi cho mỗi ngày.

**Tính duy nhất tháng:** Không lưu trực tiếp ở DB; khi POST (thêm mới) backend kiểm tra: nếu đã tồn tại bất kỳ work_record nào của user_id trong năm+tháng đó → trả 409, không cho tạo.

**Lưu ý:** 総業務時間 không lưu DB; tính từ time_start, time_end, break_minutes khi hiển thị hoặc khi cần tổng tháng.

### 3.3 Index đề xuất

- `work_records(user_id, work_date)` — truy vấn theo user và tháng (WHERE user_id = ? AND work_date BETWEEN ? AND ?).

---

## 4. Thiết kế API (Backend PHP)

Giả định: PHP thuần hoặc framework nhẹ (Slim/Laravel tối giản). Base URL ví dụ: `/api`.

### 4.1 Auth

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | /api/register | Body: email, password, display_name? → 201 + user (không trả password). |
| POST | /api/login | Body: email, password → 200 + { token, user }. |
| POST | /api/logout | Header: Authorization: Bearer &lt;token&gt; → 204. |

### 4.2 勤務時間 (theo tháng)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | /api/work-records?year=2026 | Trả danh sách theo năm: các tháng có bản ghi + tổng giờ mỗi tháng (dùng cho Dashboard list). Sắp xếp tháng mới lên đầu. |
| GET | /api/work-records?year=2026&month=1 | Trả danh sách bản ghi của user trong tháng (dùng cho trang Xem/Sửa/Thêm mới); frontend merge với số ngày trong tháng để render bảng. |
| GET | /api/work-records/:id | Chi tiết một bản ghi (kiểm tra user_id). |
| POST | /api/work-records | Body: mảng theo từng ngày hoặc bulk (year, month + danh sách ngày với time_start, time_end, break_minutes, note). **Validation:** không cho tạo trùng (user_id + year+month đã tồn tại) → 409 Conflict. |
| PUT | /api/work-records/:id | Cập nhật (chỉ record thuộc user). Chỉ cho phép cập nhật time_start, time_end, break_minutes, note (không đổi work_date). |

**Lưu ý:** Không có API DELETE (loại bỏ tính năng xóa).

**Chuẩn trả lỗi:** 400 (validation), 401 (chưa đăng nhập), 403 (không sở hữu bản ghi), 404, 409 (tháng đã tồn tại), 422.

---

## 5. Frontend (React + TailwindCSS)

### 5.1 Cấu trúc thư mục gợi ý

```
frontend/
  src/
    api/           # Gọi API (auth, work-records)
    components/    # Button, Input, Table, Modal
    pages/         # Login, Register, Dashboard (bảng tháng)
    hooks/         # useAuth, useWorkRecords
    context/       # AuthContext
    utils/         # formatTime, calcWorkMinutes, date helpers
    constants/     # Thứ trong tuần (月火水木金土日), danh sách ngày lễ Nhật (theo năm)
```

### 5.2 Trang Dashboard (danh sách theo năm)

- **Filter năm:** Dropdown chọn năm; mặc định năm hiện tại.
- **Danh sách:** Mỗi item = một tháng (ví dụ 2026年01月), hiển thị tổng giờ làm việc trong tháng; nút **Xem**, nút **Sửa**. Sắp xếp tháng mới lên đầu.
- **Nút Thêm mới:** Mở modal: chọn năm, tháng; input giờ bắt đầu, giờ kết thúc, giờ/phút nghỉ; nút Xác nhận. Xác nhận → điều hướng sang trang thêm mới (route với query/state: year, month, timeStart, timeEnd, breakMinutes).

### 5.3 Trang Thêm mới / Xem / Sửa (bảng tháng)

- **Thêm mới:** Nhận năm, tháng (và optional giờ từ modal). Render bảng: số hàng = số ngày trong tháng.
- **Sửa:** Không cho đổi năm, tháng (chỉ đọc); chỉ sửa 開始, 終了, 休憩, 備考.
- **Bảng:**
  - Cột 日: số ngày (1–28/29/30/31).
  - Cột 曜: thứ (月火水木金土日). **土・日 và ngày lễ:** chữ màu đỏ, nền xám.
  - Cột 開始・終了: input time (HH:mm). 休憩: input số phút.
  - Cột 総業務時間: chỉ đọc, tính chính xác phút (không làm tròn).
  - Cột 備考: input text; tự động điền tên ngày lễ Nhật khi đổi tháng/năm.
- **Auto-fill (chỉ trang Thêm mới):** Nếu có dữ liệu từ modal (giờ bắt đầu, kết thúc, nghỉ) → điền vào mọi ngày trừ 土・日 và ngày lễ.
- **Hàng cuối:** 合計 — tổng 総業務時間 của tháng.
- **Validation:** Khi submit Thêm mới, kiểm tra tháng đó chưa tồn tại (409 nếu đã có).

### 5.4 Logic tính giờ

- **Đơn vị 休憩:** Phút (ví dụ 60 = 1 giờ).
- **Phút làm việc mỗi ngày** = (time_end − time_start) − break_minutes (phút); null xem như 0. **Không làm tròn**, tính chính xác phút.
- Format hiển thị: phút → "H:MM" (ví dụ 480 → "8:00").
- Tổng tháng: cộng tất cả phút rồi format "HH:MM".

### 5.5 UI Rules (theo quy tắc dự án)

- Font: Heading Montserrat (600/700), Body Be Vietnam Pro (400/500).
- Không box-shadow; dùng border.
- Không gradient full surface; gradient nhẹ chỉ cho hover nếu cần.
- Không blur/glassmorphism.
- Border radius: card > button > input; spacing nhất quán (section > box > item).
- Icon: SVG hoặc Lucide, không emoji.
- Animation tối thiểu, 180–250ms, ease-out.

---

## 6. Luồng nghiệp vụ chính

1. User đăng ký/đăng nhập → lưu token (localStorage hoặc cookie httpOnly tùy bảo mật).
2. Vào trang Dashboard → filter năm mặc định năm hiện tại → GET work-records?year= → hiển thị danh sách tháng có bản ghi (tháng mới lên đầu), mỗi item có tổng giờ + nút Xem, Sửa.
3. Click **Thêm mới** → mở modal chọn năm, tháng, (optional) giờ bắt đầu/kết thúc/nghỉ → Xác nhận → chuyển đến trang Thêm mới với params đã chọn; nếu đã nhập giờ thì bảng auto-fill trừ 土・日 và ngày lễ.
4. Trang Thêm mới: danh sách ngày lễ Nhật tự điền 備考 khi đổi tháng/năm; 土・日・ngày lễ highlight đỏ, nền xám. Submit → POST (kiểm tra tháng chưa tồn tại, 409 nếu trùng).
5. Click **Xem** hoặc **Sửa** → vào trang chi tiết tháng (bảng); Sửa: không đổi năm/tháng, chỉ sửa 開始/終了/休憩/備考 → PUT từng bản ghi hoặc bulk tùy API thiết kế.
6. Không có chức năng Xóa bản ghi/tháng.

---

## 7. Lộ trình phát triển gợi ý

| Giai đoạn | Nội dung |
|-----------|----------|
| 1. Backend cơ bản | Tạo DB (users, work_records), API đăng ký/đăng nhập (JWT hoặc session), middleware kiểm tra user. |
| 2. API 勤務時間 | GET theo năm (dashboard list), GET theo year+month (chi tiết tháng), POST (bulk/từng ngày, validation trùng tháng), PUT (không DELETE). |
| 3. Frontend auth | Trang Login/Register, AuthContext, lưu token, redirect. |
| 4. Dashboard | Filter năm, danh sách tháng + tổng giờ, nút Xem/Sửa/Thêm mới; modal Thêm mới (năm, tháng, giờ) → navigate trang thêm mới. |
| 5. Trang Thêm mới | Bảng theo ngày, auto-fill từ modal, danh sách ngày lễ Nhật (auto 備考), highlight 土・日・ngày lễ (đỏ, nền xám), 休憩 phút, 総業務時間 tính chính xác, validation tháng duy nhất. |
| 6. Trang Xem/Sửa | Bảng tháng; Sửa: khóa năm/tháng, chỉ sửa 開始/終了/休憩/備考; gọi PUT. |
| 7. Tinh chỉnh UX | Validation giờ (開始 < 終了), format lỗi, loading state. |

---

## 8. Đã xác định (theo yêu cầu mới)

- **Đơn vị 休憩:** Phút (INT).
- **総業務時間:** Không làm tròn; tính chính xác phút.
- **Ngày lễ Nhật:** Có danh sách ngày lễ cố định (japan_holidays.csv); tự động điền 備考 khi đổi tháng/năm.
- **Tính duy nhất:** Mỗi (user_id, năm, tháng) chỉ tồn tại một bộ bản ghi; không cho thêm tháng trùng.
- **Sửa:** Không cho thay đổi năm, tháng; chỉ sửa 開始, 終了, 休憩, 備考.
- **Xóa:** Không có tính năng xóa.

## 9. Câu hỏi mở (nếu mở rộng sau)

- **Export:** Có cần xuất tháng ra Excel/CSV không?

Tài liệu này đã cập nhật theo yêu cầu mới, đủ để triển khai backend (PHP + MySQL) và frontend (React + Tailwind). Bước tiếp theo có thể là: schema SQL, API PHP, hoặc cấu trúc React (Dashboard, modal Thêm mới, trang bảng tháng, danh sách ngày lễ Nhật).
