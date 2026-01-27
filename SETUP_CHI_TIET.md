# 🎯 Hướng Dẫn Setup Google Sheets - Sheet ID Đã Cấu Hình

**Sheet ID của bạn:** `1SmS6QoHdRmsB4IU9u7e1Y0x5-yrJAsY4yoFbHRyYVJo`

---

## ✅ BƯỚC 1: KIỂM TRA GOOGLE SHEET

1. Mở Google Sheet của bạn:
   ```
   https://docs.google.com/spreadsheets/d/1SmS6QoHdRmsB4IU9u7e1Y0x5-yrJAsY4yoFbHRyYVJo/edit
   ```
2. Đảm bảo bạn có quyền chỉnh sửa Sheet này

---

## ✅ BƯỚC 2: TẠO GOOGLE APPS SCRIPT

### 2.1. Mở Apps Script
1. Trong Google Sheet, click vào menu **"Extensions"** (Tiện ích)
2. Chọn **"Apps Script"**
3. Một tab mới sẽ mở với trình soạn thảo code

### 2.2. Xóa code mặc định
- Xóa tất cả code có sẵn trong editor (nếu có)

### 2.3. Copy code đã được cấu hình
1. Mở file **`google-apps-script.js`** trong project của bạn
2. **Copy TOÀN BỘ nội dung** (Sheet ID đã được điền sẵn)
3. **Dán vào** Google Apps Script editor

### 2.4. Kiểm tra Sheet ID
Đảm bảo trong code có dòng:
```javascript
const SPREADSHEET_ID = '1SmS6QoHdRmsB4IU9u7e1Y0x5-yrJAsY4yoFbHRyYVJo';
```

### 2.5. Lưu Project
1. Click vào biểu tượng **"Save"** (💾) ở góc trên bên trái
2. Đặt tên project: **"Form Data Receiver"**
3. Click **"Save"**

---

## ✅ BƯỚC 3: DEPLOY WEB APP

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
  → **QUAN TRỌNG:** Phải chọn **"Anyone"**!

### 3.3. Deploy
1. Click nút **"Deploy"** (Triển khai)
2. Lần đầu tiên sẽ có popup xác nhận quyền:
   - Click **"Review Permissions"** (Xem lại quyền)
   - Chọn tài khoản Google của bạn
   - Click **"Advanced"** → **"Go to Form Data Receiver (unsafe)"**
   - Click **"Allow"** (Cho phép)

### 3.4. Copy Web App URL ⭐ QUAN TRỌNG
1. Sau khi deploy thành công, bạn sẽ thấy một URL có dạng:
   ```
   https://script.google.com/macros/s/AKfycby...xyz.../exec
   ```
2. **Copy URL này** - đây là URL quan trọng nhất!
3. **Lưu lại** URL này (ví dụ: copy vào Notepad)

---

## ✅ BƯỚC 4: CẤU HÌNH WEBSITE

### 4.1. Mở file script.js
1. Mở file **`script.js`** trong project của bạn
2. Tìm dòng đầu tiên:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```

### 4.2. Thay thế URL
1. **Thay thế** `YOUR_GOOGLE_SCRIPT_URL_HERE` bằng URL bạn đã copy ở Bước 3.4
   
   **Ví dụ:**
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby123456789/exec';
   ```
   (Dùng URL thực tế của bạn, không copy ví dụ này)

### 4.3. Lưu file
1. Lưu file `script.js`

### 4.4. Push lên GitHub
```bash
git add script.js
git commit -m "Configure Google Sheets integration with URL"
git push origin main
```

---

## ✅ BƯỚC 5: KIỂM TRA

### 5.1. Kiểm tra trên Website
1. Mở website của bạn: `https://doklyy.github.io/report/`
2. Điền thông tin vào form (có thể điền test)
3. Click nút **"Gửi báo cáo"**
4. Nếu thành công, sẽ hiện thông báo: **"✓ Dữ liệu đã được gửi thành công!"**

### 5.2. Kiểm tra trên Google Sheets
1. Mở Google Sheet của bạn:
   ```
   https://docs.google.com/spreadsheets/d/1SmS6QoHdRmsB4IU9u7e1Y0x5-yrJAsY4yoFbHRyYVJo/edit
   ```
2. Kiểm tra xem có sheet tên **"Data"** chưa (nếu chưa có sẽ tự động tạo)
3. Xem dữ liệu đã được ghi vào chưa
4. Dòng đầu tiên là **header** (tiêu đề cột) màu xanh lá
5. Các dòng tiếp theo là **dữ liệu** từ form

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Failed to fetch" hoặc "Network error"
**Nguyên nhân:** 
- URL Google Apps Script sai
- Chưa deploy hoặc deploy sai cấu hình

**Cách sửa:**
1. Kiểm tra lại URL trong `script.js`
2. Đảm bảo đã deploy với quyền **"Anyone"**
3. Thử deploy lại Google Apps Script

### Lỗi: Dữ liệu không hiện trên Sheet
**Nguyên nhân:**
- Sheet ID sai
- Chưa authorize

**Cách sửa:**
1. Kiểm tra Sheet ID trong Google Apps Script có đúng không:
   ```javascript
   const SPREADSHEET_ID = '1SmS6QoHdRmsB4IU9u7e1Y0x5-yrJAsY4yoFbHRyYVJo';
   ```
2. Đảm bảo bạn có quyền chỉnh sửa Sheet
3. Xem Execution Logs trong Apps Script để kiểm tra lỗi

### Lỗi: Permission denied
**Nguyên nhân:**
- Chưa authorize Google Apps Script

**Cách sửa:**
1. Vào Google Apps Script
2. Chạy lại function `doPost` một lần để authorize
3. Hoặc deploy lại và authorize khi được hỏi

---

## 📊 KIỂM TRA LOGS

### Xem Execution Logs trong Google Apps Script
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

## ✅ CHECKLIST

- [ ] Đã mở Google Sheet với ID: `1SmS6QoHdRmsB4IU9u7e1Y0x5-yrJAsY4yoFbHRyYVJo`
- [ ] Đã tạo Google Apps Script và paste code
- [ ] Đã kiểm tra Sheet ID trong code đúng
- [ ] Đã deploy Web App với quyền "Anyone"
- [ ] Đã copy Web App URL
- [ ] Đã cập nhật URL trong `script.js`
- [ ] Đã push code lên GitHub
- [ ] Đã test form và kiểm tra dữ liệu trên Sheet

---

## 🎉 HOÀN THÀNH!

Sau khi hoàn thành tất cả các bước, form của bạn sẽ tự động gửi dữ liệu về Google Sheet!

**Lưu ý:** 
- Mỗi lần submit form, dữ liệu sẽ được thêm vào một dòng mới trong Sheet "Data"
- Header sẽ tự động được tạo ở dòng đầu tiên (màu xanh lá)
- Các cột sẽ tự động resize để vừa với nội dung

**Chúc bạn thành công! 🚀**
