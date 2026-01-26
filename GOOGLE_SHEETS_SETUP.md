# 🚀 Hướng Dẫn Setup Google Sheets - Phiên Bản Đơn Giản

## 📋 Checklist Nhanh

- [ ] Bước 1: Tạo Google Sheet và lấy ID
- [ ] Bước 2: Tạo Google Apps Script
- [ ] Bước 3: Deploy Web App
- [ ] Bước 4: Cấu hình trong script.js
- [ ] Bước 5: Test

---

## 📝 BƯỚC 1: TẠO GOOGLE SHEET

### 1.1. Tạo Sheet mới
```
1. Vào: https://sheets.google.com
2. Click "Blank" (Trang tính trống)
3. Đặt tên: "Báo cáo Khách hàng"
```

### 1.2. Copy Sheet ID
Từ URL: `https://docs.google.com/spreadsheets/d/[ID_NÀY]/edit`

**Ví dụ:**
```
URL: https://docs.google.com/spreadsheets/d/1ABC123xyz456/edit
ID:  1ABC123xyz456
```

**Lưu ID này lại!** 📌

---

## 🔧 BƯỚC 2: TẠO GOOGLE APPS SCRIPT

### 2.1. Mở Apps Script
```
Trong Google Sheet:
Extensions → Apps Script
```

### 2.2. Copy code
1. Mở file `google-apps-script.js`
2. Copy TOÀN BỘ code
3. Paste vào Google Apps Script editor

### 2.3. Thay Sheet ID
Tìm dòng:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

Thay bằng ID của bạn:
```javascript
const SPREADSHEET_ID = '1ABC123xyz456'; // ID của bạn
```

### 2.4. Lưu
```
Click Save (💾) → Đặt tên: "Form Receiver" → Save
```

---

## 🚀 BƯỚC 3: DEPLOY WEB APP

### 3.1. Tạo Deployment
```
Deploy → New deployment → ⚙️ → Web app
```

### 3.2. Cấu hình
```
Description: Form Receiver
Execute as: Me
Who has access: Anyone ← QUAN TRỌNG!
```

### 3.3. Deploy
```
Click "Deploy"
→ Authorize (nếu được hỏi)
→ Copy Web App URL
```

**URL sẽ có dạng:**
```
https://script.google.com/macros/s/AKfycby...xyz.../exec
```

**Lưu URL này!** 📌

---

## ⚙️ BƯỚC 4: CẤU HÌNH WEBSITE

### 4.1. Mở script.js
Mở file `script.js` trong project

### 4.2. Tìm dòng này:
```javascript
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
```

### 4.3. Thay bằng URL của bạn:
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby...xyz.../exec';
```

### 4.4. Lưu và push
```bash
git add script.js
git commit -m "Add Google Sheets URL"
git push origin main
```

---

## ✅ BƯỚC 5: TEST

1. Mở website
2. Điền form
3. Click "Gửi báo cáo"
4. Kiểm tra Google Sheet → Sheet "Data" → Xem dữ liệu

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Failed to fetch"
- ✅ Kiểm tra URL trong script.js đúng chưa
- ✅ Đảm bảo đã deploy với "Anyone"
- ✅ Thử deploy lại

### Lỗi: Dữ liệu không hiện
- ✅ Kiểm tra Sheet ID đúng chưa
- ✅ Xem Execution Logs trong Apps Script
- ✅ Kiểm tra Console (F12) trong browser

### Lỗi: Permission denied
- ✅ Chạy lại function doPost để authorize
- ✅ Hoặc deploy lại và authorize

---

## 📊 CẤU TRÚC DỮ LIỆU

Dữ liệu sẽ được ghi vào Sheet "Data" với:
- Dòng 1: Header (tiêu đề các cột)
- Dòng 2+: Dữ liệu từ form

---

## 💡 TIPS

1. **Test trước:** Gửi 1-2 form test trước khi dùng thật
2. **Backup:** Định kỳ export Sheet về Excel
3. **Filter:** Tạo filter trong Sheet để dễ tìm kiếm
4. **Logs:** Xem Execution Logs nếu có lỗi

---

## 🎯 TÓM TẮT

```
1. Tạo Sheet → Copy ID
2. Apps Script → Paste code → Thay ID
3. Deploy → Copy URL → Chọn "Anyone"
4. script.js → Thay URL
5. Test → Xong! 🎉
```

**Cần giúp đỡ?** Xem file `HUONG_DAN_GOOGLE_SHEETS.md` để biết chi tiết hơn!
