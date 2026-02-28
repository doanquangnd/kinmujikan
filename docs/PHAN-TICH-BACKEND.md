# Phân tích công nghệ Backend - 勤務時間

Hosting hỗ trợ: **PHP (Laravel, CodeIgniter)**, **Express**, **NestJS**, **Next.js**, **Nuxt**.  
Yêu cầu: phù hợp với bài toán (API auth + CRUD theo tháng), **nhẹ**, **dễ triển khai**.

---

## 1. So sánh nhanh

| Công nghệ | Nhẹ | Dễ triển khai | Phù hợp API đơn giản | Ghi chú |
|-----------|-----|----------------|----------------------|---------|
| **PHP thuần** | Nhất (không framework) | Rất dễ | Có | Chỉ PHP + PDO; tự viết auth, routing |
| **CodeIgniter** | Rất nhẹ | Dễ (PHP phổ biến) | Có | Ít dependency, shared hosting tốt |
| **Laravel** | Trung bình | Dễ | Có | Sẵn auth, validation, migration |
| **Express** | Rất nhẹ | Tùy hosting | Có | Cần Node runtime, tự lắp auth/DB |
| **NestJS** | Nặng | Phức tạp hơn | Dư thừa | Phù hợp dự án lớn, nhiều module |
| **Next.js** | Trung bình | Tùy (Vercel/Node) | Không tối ưu | Thiết kế cho fullstack React, không phải API thuần |
| **Nuxt** | Trung bình | Tùy | Không tối ưu | Thiết kế cho Vue, frontend đã là React |

---

## 2. Phân tích từng lựa chọn

### 2.0 PHP thuần (không framework)

- **Ưu:** Không dependency (hoặc tối thiểu: chỉ Composer cho autoload/JWT nếu cần). Nhẹ nhất, chạy mọi nơi có PHP; upload vài file hoặc một thư mục lên shared hosting là chạy. Không cần học framework; dễ debug (đi thẳng vào file xử lý).
- **Nhược:** Tự làm hết: routing (hoặc 1 file `api.php` nhận query/method rồi switch), kết nối DB (PDO), auth (hash mật khẩu `password_hash`, JWT hoặc session), validation input, CORS, trả JSON. Cấu trúc dự án dễ thành rối nếu không tự quy ước thư mục (ví dụ `api/`, `config/`, `includes/`).
- **Triển khai:** Chỉ cần PHP 8+ và extension PDO/MySQL (hoặc mysqli). Không bắt buộc Composer trên server nếu không dùng thư viện bên ngoài. Một entry point (ví dụ `index.php` hoặc `api.php`) nhận request và require file xử lý tương ứng.

**Kết luận:** **Có thể dùng PHP thuần.** Rất phù hợp nếu bạn muốn nhẹ tối đa, deploy đơn giản (FTP/upload), và chấp nhận tự viết ít code cho auth + CRUD (bài toán 勤務時間 chỉ vài bảng, vài endpoint). Nên tổ chức rõ: 1 file config DB, 1 file auth helper (verify token/session), 1 file hoặc vài file xử lý từng nhóm API (auth, work-records).

---

### 2.1 PHP: Laravel

- **Ưu:** Auth (Sanctum/Passport), migration, validation, API Resource có sẵn; tài liệu nhiều; deploy lên hosting PHP (FTP/git + composer) quen thuộc.
- **Nhược:** Nặng hơn (nhiều package), bộ nhớ và thời gian khởi động cao hơn so với stack nhẹ.
- **Triển khai:** Cần PHP 8+, Composer, extension MySQL/PDO. Shared hosting có PHP thường chạy được (đôi khi cần chỉnh `document root` về `public/`).

**Kết luận:** Phù hợp nếu ưu tiên **làm nhanh** và **đủ tính năng** hơn là tối thiểu tài nguyên. Dễ triển khai trên hosting PHP.

---

### 2.2 PHP: CodeIgniter 4

- **Ưu:** Rất nhẹ, ít dependency, khởi động nhanh; cấu trúc đơn giản; chạy tốt trên shared hosting PHP; tài liệu rõ ràng.
- **Nhược:** Không có sẵn API token auth như Laravel Sanctum; cần tự làm JWT/session hoặc dùng thư viện (ví dụ Shield cho auth). Validation/migration đơn giản hơn Laravel.
- **Triển khai:** Chỉ cần PHP 8.1+ và MySQL. Upload code hoặc git pull; thường không bắt buộc Composer trên server nếu build sẵn (vendor đã có).

**Kết luận:** Phù hợp khi cần **nhẹ và dễ deploy** trên hosting PHP, chấp nhận tự làm hoặc gắn thư viện auth đơn giản.

---

### 2.3 Express (Node.js)

- **Ưu:** Rất nhẹ, linh hoạt; chỉ cần thêm route, middleware, kết nối MySQL (mysql2). Hệ sinh thái npm đa dạng (JWT, validation, v.v.).
- **Nhược:** Không “all-in-one”: phải tự chọn và lắp auth, validation, cấu trúc thư mục. Hosting phải **có Node** và cách chạy process (PM2, Docker, hoặc serverless).
- **Triển khai:** Nhiều shared hosting “hỗ trợ PHP” **không** chạy Node; cần VPS, PaaS (Railway, Render, Fly.io) hoặc hosting có sẵn Node. Deploy thường bằng git + build + start script (ví dụ `node server.js` hoặc `npm start`).

**Kết luận:** Tốt nếu bạn quen Node và hosting **đã hỗ trợ chạy Node**. Nhẹ và phù hợp API đơn giản, nhưng **dễ triển khai** hay không phụ thuộc vào loại hosting.

---

### 2.4 NestJS (Node.js)

- **Ưu:** Cấu trúc rõ (module, service, controller), TypeScript, có sẵn auth (JWT, Guard), validation (class-validator), tích hợp DB tốt.
- **Nhược:** Nặng hơn Express nhiều (boilerplate, abstraction); với bài toán nhỏ (vài bảng, auth đơn giản) dễ cảm giác **dư thừa**. Learning curve cao hơn Express.
- **Triển khai:** Giống Express – cần môi trường Node, build, chạy process. Không phù hợp mô hình “upload PHP lên shared hosting”.

**Kết luận:** Không khuyến nghị cho yêu cầu **nhẹ và dễ triển khai**; phù hợp dự án lớn hoặc team cần cấu trúc chặt.

---

### 2.5 Next.js / Nuxt

- **Next.js:** Framework fullstack React (SSR/SSG + API Routes). Hosting “hỗ trợ Next.js” thường là Vercel hoặc Node server. Dùng **chỉ làm backend API** cho một SPA React riêng là được nhưng không tối ưu: bạn sẽ dùng API Routes trong khi frontend lại là app React tách (build riêng). Thêm phức tạp deploy (CORS, hai origin).
- **Nuxt:** Tương tự nhưng cho Vue. Frontend dự án này là React, nên Nuxt không khớp stack.

**Kết luận:** Cả hai đều **không phải lựa chọn tối ưu** cho kiến trúc “Backend API thuần + React SPA riêng” và cho mục tiêu nhẹ, dễ triển khai.

---

## 3. Đề xuất theo ngữ cảnh

### Nếu hosting chủ yếu là PHP (shared hosting, cPanel, PHP 8 + MySQL)

| Ưu tiên | Lựa chọn | Lý do |
|---------|----------|--------|
| **Nhẹ nhất, không framework** | **PHP thuần** | Chỉ PHP + PDO; upload là chạy. Tự viết auth + vài endpoint CRUD; phù hợp bài toán nhỏ. |
| **Nhẹ + có cấu trúc** | **CodeIgniter 4** | Ít dependency, chạy ổn trên shared hosting, đủ cho API auth + CRUD. Tự tích hợp JWT hoặc session đơn giản. |
| **Làm nhanh, đủ tính năng** | **Laravel** | Sanctum, migration, validation, API Resource giúp triển khai nhanh; chấp nhận nặng hơn một chút. |

### Nếu hosting có Node (VPS, PaaS, Docker)

| Ưu tiên | Lựa chọn | Lý do |
|---------|----------|--------|
| **Nhẹ** | **Express** | Tối thiểu, chỉ thêm MySQL + JWT + validation. Dễ deploy khi đã có Node. |
| Cần cấu trúc chặt, TypeScript | NestJS | Chỉ nên dùng nếu dự án mở rộng lớn hoặc team quen Nest. |

---

## 4. Kết luận và khuyến nghị

- **Nhẹ nhất, không phụ thuộc framework:** **PHP thuần** – có thể dùng được; chỉ cần tổ chức thư mục và tự viết auth + CRUD (vài file).
- **Yêu cầu nhẹ + dễ triển khai**, hosting **PHP**: **PHP thuần** (tối đa đơn giản) hoặc **CodeIgniter 4** (có cấu trúc, vẫn nhẹ) hoặc **Laravel** (tốc độ phát triển, sẵn tooling).
- **Hosting có Node**, stack nhẹ: **Express**; NestJS không cần thiết cho bài toán hiện tại.
- **Next.js / Nuxt** không nên dùng chỉ để làm backend API cho React SPA riêng trong bối cảnh này.

**Khuyến nghị chung:** Nếu bạn thoải mái tự viết routing + PDO + auth (JWT hoặc session): **PHP thuần** là lựa chọn nhẹ và dễ triển khai nhất. Nếu muốn có sẵn cấu trúc và ít code lặp: **CodeIgniter 4** hoặc **Laravel**.
