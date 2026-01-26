# Hướng Dẫn Chi Tiết: Tích Hợp Google Sheets

Hướng dẫn từng bước để form có thể gửi dữ liệu về Google Sheets.

---

## BƯỚC 1: TẠO GOOGLE SHEET MỚI

### 1.1. Tạo Sheet
1. Truy cập: https://sheets.google.com
2. Đăng nhập bằng tài khoản Google của bạn
3. Click vào **"Blank"** (Trang tính trống) để tạo sheet mới
4. Đặt tên sheet (ví dụ: "Báo cáo Khách hàng")

### 1.2. Lấy Sheet ID
1. Nhìn vào thanh địa chỉ trình duyệt, bạn sẽ thấy URL có dạng:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123xyz456DEF789ghi012jkl345mno/edit
   ```
2. **Copy phần ID** (giữa `/d/` và `/edit`):
   ```
   1ABC123xyz456DEF789ghi012jkl345mno
   ```
3. **Lưu lại ID này** - bạn sẽ cần dùng sau

---

## BƯỚC 2: TẠO GOOGLE APPS SCRIPT

### 2.1. Mở Google Apps Script
1. Trong Google Sheet vừa tạo, click vào menu **"Extensions"** (Tiện ích)
2. Chọn **"Apps Script"**
3. Một tab mới sẽ mở với trình soạn thảo code

### 2.2. Xóa code mặc định
1. Xóa tất cả code có sẵn trong editor (nếu có)
2. Để trống editor

### 2.3. Copy code vào
1. Mở file `google-apps-script.js` trong project của bạn
2. **Copy toàn bộ nội dung**
3. **Dán vào** Google Apps Script editor

### 2.4. Thay đổi Sheet ID
1. Tìm dòng này trong code:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
2. **Thay thế** `YOUR_SPREADSHEET_ID_HERE` bằng Sheet ID bạn đã copy ở Bước 1.2
   ```javascript
   const SPREADSHEET_ID = '1ABC123xyz456DEF789ghi012jkl345mno';
   ```
   (Dùng ID thực tế của bạn, không copy ví dụ này)

### 2.5. Lưu Project
1. Click vào biểu tượng **"Save"** (💾) ở góc trên bên trái
2. Đặt tên project (ví dụ: "Form Data Receiver")
3. Click **"Save"**

---

## BƯỚC 3: DEPLOY WEB APP

### 3.1. Tạo Deployment
1. Click vào menu **"Deploy"** (Triển khai) ở góc trên bên phải
2. Chọn **"New deployment"** (Triển khai mới)
3. Click vào biểu tượng **bánh răng ⚙️** bên cạnh "Select type"
4. Chọn **"Web app"**

### 3.2. Cấu hình Deployment
Điền các thông tin sau:

- **Description** (Mô tả): 
  ```
  Form Data Receiver
  ```

- **Execute as** (Thực thi với):
  ```
  Me (your-email@gmail.com)
  ```
  → Chọn **"Me"**

- **Who has access** (Ai có quyền truy cập):
  ```
  Anyone
  ```
  → Chọn **"Anyone"** (Quan trọng!)

### 3.3. Deploy
1. Click nút **"Deploy"** (Triển khai)
2. Lần đầu tiên sẽ có popup xác nhận quyền:
   - Click **"Review Permissions"** (Xem lại quyền)
   - Chọn tài khoản Google của bạn
   - Click **"Advanced"** → **"Go to [Project Name] (unsafe)"**
   - Click **"Allow"** (Cho phép)

### 3.4. Copy Web App URL
1. Sau khi deploy thành công, bạn sẽ thấy một URL có dạng:
   ```
   https://script.google.com/macros/s/AKfycby...xyz.../exec
   ```
2. **Copy URL này** - đây là URL quan trọng nhất!
3. **Lưu lại** URL này

---

## BƯỚC 4: CẤU HÌNH TRONG WEBSITE

### 4.1. Mở file script.js
1. Mở file `script.js` trong project của bạn
2. Tìm dòng đầu tiên:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```

### 4.2. Thay thế URL
1. **Thay thế** `YOUR_GOOGLE_SCRIPT_URL_HERE` bằng URL bạn đã copy ở Bước 3.4
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby...xyz.../exec';
   ```
   (Dùng URL thực tế của bạn)

### 4.3. Lưu file
1. Lưu file `script.js`
2. Nếu đã deploy website, commit và push lên GitHub:
   ```bash
   git add script.js
   git commit -m "Configure Google Sheets integration"
   git push origin main
   ```

---

## BƯỚC 5: KIỂM TRA

### 5.1. Kiểm tra trên Website
1. Mở website của bạn
2. Điền thông tin vào form
3. Click nút **"Gửi báo cáo"**
4. Nếu thành công, sẽ hiện thông báo: **"✓ Dữ liệu đã được gửi thành công!"**

### 5.2. Kiểm tra trên Google Sheets
1. Mở Google Sheet của bạn
2. Kiểm tra sheet có tên **"Data"** (nếu chưa có sẽ tự động tạo)
3. Xem dữ liệu đã được ghi vào chưa
4. Dòng đầu tiên là **header** (tiêu đề cột)
5. Các dòng tiếp theo là **dữ liệu** từ form

---

## XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi 1: "Failed to fetch" hoặc "Network error"
**Nguyên nhân:** 
- URL Google Apps Script sai
- Chưa deploy hoặc deploy sai cấu hình

**Cách sửa:**
1. Kiểm tra lại URL trong `script.js`
2. Đảm bảo đã deploy với quyền **"Anyone"**
3. Thử deploy lại Google Apps Script

### Lỗi 2: "Script function not found"
**Nguyên nhân:**
- Tên function trong Google Apps Script sai

**Cách sửa:**
1. Kiểm tra function `doPost` có đúng tên không
2. Đảm bảo không có lỗi syntax trong code

### Lỗi 3: "Permission denied"
**Nguyên nhân:**
- Chưa authorize Google Apps Script

**Cách sửa:**
1. Vào Google Apps Script
2. Chạy lại function `doPost` một lần để authorize
3. Hoặc deploy lại và authorize khi được hỏi

### Lỗi 4: Dữ liệu không hiện trên Sheet
**Nguyên nhân:**
- Sheet ID sai
- Sheet name không đúng

**Cách sửa:**
1. Kiểm tra lại Sheet ID trong Google Apps Script
2. Đảm bảo Sheet ID đúng
3. Kiểm tra sheet "Data" có được tạo không

---

## KIỂM TRA LOGS (Nếu có lỗi)

### Xem Execution Logs
1. Vào Google Apps Script
2. Click vào menu **"Executions"** (Thực thi) ở bên trái
3. Xem các lần chạy gần đây
4. Click vào một execution để xem chi tiết lỗi (nếu có)

### Xem Logs trong Browser
1. Mở website
2. Nhấn **F12** để mở Developer Tools
3. Vào tab **"Console"**
4. Submit form và xem có lỗi gì không

---

## CẤU TRÚC DỮ LIỆU TRONG GOOGLE SHEETS

Dữ liệu sẽ được ghi vào Google Sheets với các cột sau (theo thứ tự):

1. Thời gian
2. Tên KH/Tên shop
3. Điện thoại
4. Địa chỉ
5. Các mốc trọng lượng
6. Tổng sản lượng các mốc
7. Tỷ trọng hàng trên 1.2m
8. Tỷ trọng % (hàng trên 1.2m)
9. Sản lượng Nội tỉnh
10. Sản lượng Nội miền
11. Sản lượng Cận miền
12. Sản lượng Liên miền
13. Hàng thông thường
14. Chất lỏng
15. Dễ cháy
16. Dễ vỡ
17. Ngành hàng
18. Ngành hàng khác
19. Đối thủ
20. Đối thủ khác
21. Giá đối thủ
22. Tỷ lệ hoàn hiện tại
23. Tỷ lệ hoàn đối thủ miễn phí
24. Chính sách đặc thù đối thủ
25. Giá đề xuất
26. Chính sách đặc thù đề xuất
27. Tỷ lệ hoàn đề xuất
28. Họ và tên người báo cáo
29. Chức danh
30. Điện thoại người báo cáo
31. Chi nhánh
32. Tên Bưu cục
33. Mã Bưu cục

---

## TIPS & BEST PRACTICES

### 1. Backup dữ liệu
- Định kỳ export Google Sheet về Excel/CSV
- Hoặc tạo bản sao Sheet

### 2. Bảo mật
- URL Google Apps Script có thể public (không sao)
- Không để lộ Sheet ID nếu không cần thiết
- Có thể giới hạn quyền truy cập Sheet nếu cần

### 3. Tối ưu
- Nếu có nhiều dữ liệu, có thể thêm pagination trong Sheet
- Có thể tạo filter trong Sheet để dễ tìm kiếm

### 4. Testing
- Test với 1-2 bản ghi trước
- Kiểm tra format dữ liệu có đúng không
- Đảm bảo các công thức tính toán đúng

---

## HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra lại từng bước
2. Xem Execution Logs trong Google Apps Script
3. Kiểm tra Console trong Browser (F12)
4. Đảm bảo URL và Sheet ID đúng

---

## TÓM TẮT CÁC BƯỚC QUAN TRỌNG

1. ✅ Tạo Google Sheet → Copy Sheet ID
2. ✅ Tạo Google Apps Script → Paste code → Thay Sheet ID
3. ✅ Deploy Web App → Copy Web App URL → Chọn "Anyone"
4. ✅ Sửa `script.js` → Thay URL vào `GOOGLE_SCRIPT_URL`
5. ✅ Test form → Kiểm tra dữ liệu trên Sheet

**Chúc bạn thành công! 🎉**
