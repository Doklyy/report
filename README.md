# Form Báo Cáo Khách Hàng

Giao diện web form để thu thập thông tin khách hàng và gửi dữ liệu về Google Sheets. Website được tối ưu cho mobile và có thể truy cập công khai.

## Tính năng

- ✅ Giao diện responsive, hoạt động tốt trên điện thoại
- ✅ Các ô input có màu vàng nổi bật
- ✅ Nút gửi màu xanh lá
- ✅ Checkbox (ô vuông) cho các lựa chọn
- ✅ Tính toán tự động:
  - Tổng = Nội tỉnh + Nội miền + Cận miền + Liên miền
  - Tỷ trọng % = (Sản lượng loại / Tổng sản lượng) * 100
  - Tỷ trọng = (Số lượng hàng trên 1.2m / Tổng sản lượng) * 100
  - Bình quân có trọng số = SUM(Sản lượng mốc i * Đơn giá mốc i) / Tổng sản lượng
  - Tỷ lệ hoàn = (Số hoàn / Tổng gửi) * 100
- ✅ Tích hợp Google Sheets để lưu trữ dữ liệu

## Cài đặt

### 1. Tải các file về máy

Đảm bảo bạn có các file sau:
- `index.html`
- `style.css`
- `script.js`
- `google-apps-script.js` (để tham khảo)

### 2. Thiết lập Google Sheets

#### Bước 1: Tạo Google Sheet mới
1. Mở [Google Sheets](https://sheets.google.com)
2. Tạo một sheet mới
3. Copy ID của sheet từ URL (phần giữa `/d/` và `/edit`)

#### Bước 2: Tạo Google Apps Script
1. Trong Google Sheet, vào **Extensions** > **Apps Script**
2. Xóa code mặc định
3. Copy toàn bộ nội dung từ file `google-apps-script.js`
4. Dán vào editor
5. Thay đổi `SPREADSHEET_ID` thành ID của sheet bạn vừa copy
6. Lưu project (Ctrl+S hoặc Cmd+S)

#### Bước 3: Deploy Web App
1. Click vào **Deploy** > **New deployment**
2. Click vào biểu tượng bánh răng ⚙️ bên cạnh "Select type"
3. Chọn **Web app**
4. Điền thông tin:
   - **Description**: "Form Data Receiver"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
5. Click **Deploy**
6. Copy **Web app URL** (sẽ có dạng: `https://script.google.com/macros/s/...`)

#### Bước 4: Cấu hình trong script.js
1. Mở file `script.js`
2. Tìm dòng:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```
3. Thay thế bằng URL bạn vừa copy từ Google Apps Script

### 3. Mở form trong trình duyệt

1. Mở file `index.html` bằng trình duyệt web
2. Hoặc sử dụng local server:
   ```bash
   # Nếu có Python
   python -m http.server 8000
   
   # Hoặc nếu có Node.js
   npx http-server
   ```
3. Truy cập `http://localhost:8000` trong trình duyệt

## Sử dụng

1. Điền thông tin vào form
2. Các tính toán sẽ tự động cập nhật khi bạn nhập dữ liệu
3. Click nút **GỬI** để gửi dữ liệu
4. Dữ liệu sẽ được ghi vào Google Sheets tự động

## Cấu trúc dữ liệu trong Google Sheets

Dữ liệu sẽ được ghi vào Google Sheets với các cột sau:
- Thời gian
- Thông tin khách hàng (Tên, Điện thoại, Địa chỉ)
- Mức trọng lượng
- Sản lượng hàng gửi
- Đặc tính hàng hóa
- Ngành hàng
- Đối thủ
- Chính sách đối thủ
- Chính sách đề xuất
- Thông tin người báo cáo

## Lưu ý

- Đảm bảo Google Apps Script đã được deploy với quyền "Anyone"
- Nếu gặp lỗi CORS, kiểm tra lại cấu hình Google Apps Script
- Dữ liệu sẽ được ghi vào sheet tên "Data", nếu chưa có sẽ tự động tạo

## Deploy để Truy cập Công khai

Để mọi người có thể truy cập website, bạn có thể deploy lên các nền tảng miễn phí:

### Các phương pháp phổ biến:
1. **GitHub Pages** - Dễ nhất, miễn phí
2. **Netlify** - Tự động deploy, miễn phí
3. **Vercel** - Nhanh, miễn phí
4. **Surge.sh** - Đơn giản, miễn phí
5. **Firebase Hosting** - Google, miễn phí

Xem chi tiết hướng dẫn trong file **[DEPLOY.md](DEPLOY.md)**

### Quick Start với GitHub Pages:
```bash
# 1. Tạo repository trên GitHub
# 2. Push code lên GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# 3. Vào Settings > Pages > Chọn branch main > Save
# 4. Website sẽ có tại: https://YOUR_USERNAME.github.io/YOUR_REPO/
```

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Console của trình duyệt (F12) để xem lỗi
2. Google Apps Script execution log
3. Đảm bảo URL Google Apps Script đúng và đã được deploy
4. Xem file DEPLOY.md để biết cách deploy website
