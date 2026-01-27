# 🔧 Hướng Dẫn Deploy Lại Google Apps Script

## Vấn đề hiện tại:
- Website hiển thị "Gửi thành công" nhưng dữ liệu không xuất hiện trong Google Sheets
- URL script báo lỗi "Script function not found: doGet"

## Giải pháp:

### Bước 1: Mở Google Sheets
1. Mở Google Sheet của bạn: https://docs.google.com/spreadsheets/d/1YjkGHzgWznniXi2eUU_EWWNRXzeshRnajxZYy-yndhU6eXqV2e0oK7hE
2. Đảm bảo bạn có quyền chỉnh sửa

### Bước 2: Mở Google Apps Script
1. Trong Google Sheets, vào **Extensions** > **Apps Script**
2. Hoặc truy cập trực tiếp: https://script.google.com/home/projects

### Bước 3: Tạo Script Mới hoặc Cập nhật Script Hiện Tại

**Nếu bạn chưa có script:**
1. Tạo script mới
2. Copy toàn bộ nội dung từ file `google-apps-script.js` trong project này
3. Dán vào editor

**Nếu bạn đã có script:**
1. Kiểm tra Sheet ID trong script có đúng là: `1YjkGHzgWznniXi2eUU_EWWNRXzeshRnajxZYy-yndhU6eXqV2e0oK7hE`
2. Đảm bảo có cả 2 hàm: `doPost()` và `doGet()`

### Bước 4: Lưu Script
1. Nhấn **Ctrl+S** hoặc click nút **Save** (💾)
2. Đặt tên project (ví dụ: "Report Form Handler")

### Bước 5: Deploy Script
1. Click vào **Deploy** > **New deployment**
2. Click vào biểu tượng ⚙️ (Settings) bên cạnh "Select type"
3. Chọn **Web app**
4. Điền thông tin:
   - **Description**: "Report Form Handler v1"
   - **Execute as**: **Me** (tài khoản của bạn)
   - **Who has access**: **Anyone** (quan trọng!)
5. Click **Deploy**

### Bước 6: Cấp Quyền
1. Lần đầu deploy, Google sẽ yêu cầu cấp quyền
2. Click **Review Permissions**
3. Chọn tài khoản Google của bạn
4. Click **Advanced** > **Go to [Project Name] (unsafe)**
5. Click **Allow** để cấp quyền

### Bước 7: Copy URL Mới
1. Sau khi deploy thành công, bạn sẽ thấy URL mới
2. Copy URL này (có dạng: `https://script.google.com/macros/s/.../exec`)
3. URL hiện tại của bạn: `https://script.google.com/macros/s/AKfycbyY78-vMsIQQUZtWJZRF8lg2ukp26g4i9cN-KlNL0UobeDh2AqumgBs3CyZrVOdFe3ARg/exec`

### Bước 8: Kiểm Tra Script Hoạt Động
1. Mở URL script trong trình duyệt mới (incognito)
2. Nếu thấy JSON response (không phải lỗi) = Script hoạt động ✅
3. Nếu thấy "Script function not found" = Cần deploy lại ❌

### Bước 9: Tạo Sheet "Data" (Nếu Chưa Có)
1. Trong Google Sheets, kiểm tra xem có sheet tên "Data" chưa
2. Nếu chưa có, script sẽ tự động tạo khi có dữ liệu đầu tiên được gửi
3. Hoặc bạn có thể tạo thủ công: Click **+** ở dưới cùng để thêm sheet mới, đặt tên "Data"

### Bước 10: Test Gửi Dữ Liệu
1. Mở website: https://doklyy.github.io/report/
2. Điền form và nhấn "Gửi báo cáo"
3. Kiểm tra Google Sheets xem có dữ liệu mới không

## Lưu ý Quan Trọng:
- ✅ **Who has access** PHẢI là **Anyone**, không phải "Only myself"
- ✅ Sheet ID trong script PHẢI đúng với Sheet của bạn
- ✅ Sau mỗi lần sửa code, cần **Deploy lại** (chọn "New version" hoặc "New deployment")
- ✅ Nếu thay đổi code, URL có thể giữ nguyên hoặc thay đổi tùy cách deploy

## Khắc Phục Lỗi:

### Lỗi: "Script function not found: doGet"
- **Nguyên nhân**: Script chưa được deploy hoặc deploy sai
- **Giải pháp**: Deploy lại theo Bước 5-6

### Lỗi: "Gửi thành công" nhưng không có dữ liệu
- **Nguyên nhân 1**: Sheet ID sai
- **Giải pháp**: Kiểm tra và sửa Sheet ID trong script

- **Nguyên nhân 2**: Quyền truy cập chưa đúng
- **Giải pháp**: Deploy lại với "Who has access: Anyone"

- **Nguyên nhân 3**: Script chưa có quyền truy cập Sheets
- **Giải pháp**: Cấp quyền lại theo Bước 6

### Lỗi: "Access denied" hoặc "Permission denied"
- **Nguyên nhân**: Script chưa được cấp quyền
- **Giải pháp**: Làm lại Bước 6

## Kiểm Tra Nhanh:
1. Mở URL script: https://script.google.com/macros/s/AKfycbyY78-vMsIQQUZtWJZRF8lg2ukp26g4i9cN-KlNL0UobeDh2AqumgBs3CyZrVOdFe3ARg/exec
2. Nếu thấy JSON với `{"success":true,"data":[...]}` = OK ✅
3. Nếu thấy lỗi = Cần deploy lại ❌
