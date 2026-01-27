# 🔧 Khắc Phục Lỗi: "Document is missing (perhaps it was deleted, or you don't have read access?)"

## Lỗi hiện tại:
```
{"success":false,"error":"Error: Document 1YjkGHzgWznniXi2eUU_EWWNRXzeshRnajxZYy-yndhU6eXqV2e0oK7hE is missing (perhaps it was deleted, or you don't have read access?)","data":[]}
```

## Nguyên nhân có thể:
1. ❌ **Sheet ID sai** - ID không đúng với Sheet thực tế
2. ❌ **Script không có quyền truy cập Sheet** - Script chưa được cấp quyền
3. ❌ **Sheet bị xóa hoặc không tồn tại**
4. ❌ **Script chạy với tài khoản khác** - Tài khoản deploy script khác với tài khoản sở hữu Sheet

## Giải pháp:

### Bước 1: Kiểm tra Sheet ID

1. Mở Google Sheet của bạn
2. Xem URL trong thanh địa chỉ:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
   ```
3. Copy phần `[SHEET_ID_HERE]` - đây là Sheet ID thực tế
4. So sánh với Sheet ID trong code: `1YjkGHzgWznniXi2eUU_EWWNRXzeshRnajxZYy-yndhU6eXqV2e0oK7hE`

**Nếu khác nhau:**
- Cập nhật Sheet ID trong file `google-apps-script.js` (dòng 16)
- Deploy lại script

### Bước 2: Kiểm tra Sheet có tồn tại không

1. Mở link này (thay `YOUR_SHEET_ID` bằng Sheet ID của bạn):
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   ```
2. Nếu thấy "File not found" = Sheet không tồn tại hoặc bị xóa
3. Tạo Sheet mới và copy Sheet ID mới

### Bước 3: Cấp quyền cho Script

**Cách 1: Chia sẻ Sheet với Script (Khuyến nghị)**

1. Mở Google Sheet
2. Click nút **Share** (Chia sẻ) ở góc trên bên phải
3. Thêm email của tài khoản Google mà bạn dùng để deploy script
4. Chọn quyền: **Editor** (Biên tập viên)
5. Click **Send** (Gửi)

**Cách 2: Cấp quyền khi Deploy Script**

1. Mở Google Apps Script: https://script.google.com/home/projects
2. Chọn project của bạn
3. Click **Deploy** > **Manage deployments**
4. Click biểu tượng ⚙️ (Settings) bên cạnh deployment
5. Click **Edit** (Chỉnh sửa)
6. Đảm bảo:
   - **Execute as**: **Me** (tài khoản của bạn - phải là tài khoản sở hữu Sheet)
   - **Who has access**: **Anyone**
7. Click **Deploy**

### Bước 4: Kiểm tra Tài khoản Deploy Script

**Quan trọng:** Script phải được deploy với tài khoản **sở hữu** hoặc có **quyền Editor** trên Sheet.

1. Kiểm tra tài khoản đang dùng:
   - Mở Google Apps Script
   - Xem góc trên bên phải - đây là tài khoản đang dùng
2. Đảm bảo tài khoản này:
   - Là chủ sở hữu Sheet, HOẶC
   - Đã được chia sẻ Sheet với quyền Editor

### Bước 5: Tạo Sheet Mới (Nếu Sheet cũ bị xóa)

1. Tạo Google Sheet mới: https://sheets.google.com/create
2. Copy Sheet ID từ URL
3. Cập nhật Sheet ID trong `google-apps-script.js`:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_NEW_SHEET_ID_HERE';
   ```
4. Deploy lại script

### Bước 6: Test lại

1. Mở URL script trong trình duyệt:
   ```
   https://script.google.com/macros/s/AKfycbw5bADIT3IsfPQ5xH_IbjR-3DMq9dIvjCbv0Di0E1EjBENTAHHIOn52IS5N9vxME4ZmkA/exec
   ```
2. Nếu thấy JSON với `{"success":true,"data":[...]}` = OK ✅
3. Nếu vẫn thấy lỗi = Làm lại các bước trên

## Kiểm tra nhanh:

### Test 1: Kiểm tra Sheet ID
```javascript
// Mở Google Apps Script Editor
// Chạy hàm test này:

function testSheetAccess() {
  const SPREADSHEET_ID = '1YjkGHzgWznniXi2eUU_EWWNRXzeshRnajxZYy-yndhU6eXqV2e0oK7hE';
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Sheet accessible! Name: ' + ss.getName());
    return 'OK';
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    return 'ERROR: ' + error.toString();
  }
}
```

### Test 2: Kiểm tra Quyền
1. Trong Google Apps Script Editor
2. Chạy hàm `testSheetAccess()` ở trên
3. Xem kết quả trong **Execution log**:
   - ✅ "Sheet accessible!" = Có quyền
   - ❌ "Error: ..." = Không có quyền hoặc Sheet ID sai

## Giải pháp nhanh nhất:

1. **Tạo Sheet mới** (nếu Sheet cũ có vấn đề)
2. **Copy Sheet ID mới**
3. **Cập nhật trong `google-apps-script.js`**
4. **Chia sẻ Sheet với tài khoản deploy script** (quyền Editor)
5. **Deploy lại script**
6. **Test lại**

## Lưu ý:

- ✅ Sheet ID phải đúng 100%
- ✅ Tài khoản deploy script phải có quyền Editor trên Sheet
- ✅ Sau khi sửa Sheet ID, PHẢI deploy lại script
- ✅ Nếu dùng tài khoản khác, phải chia sẻ Sheet với tài khoản đó
