# Hướng dẫn kiểm tra và sửa lỗi không ghi được dữ liệu vào Google Sheets

## Vấn đề
Console log cho thấy dữ liệu đã được gửi thành công, nhưng Google Sheets chưa có dữ liệu.

## Nguyên nhân có thể
1. Google Apps Script chưa được cập nhật với code mới
2. Sheet name không đúng (script tìm sheet "Data" nhưng sheet thật có tên khác)
3. Dữ liệu không được parse đúng cách

## Cách sửa

### Bước 1: Cập nhật Google Apps Script

1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/13uIBESYl6cklFlBWMj0HAjsJpcBCnCZk7t86gvG0y_I/edit
2. Vào **Extensions** > **Apps Script**
3. Copy toàn bộ nội dung từ file `google-apps-script.js` (đã được cập nhật)
4. Dán vào editor Apps Script (thay thế code cũ)
5. **Lưu** (Ctrl+S hoặc Cmd+S)

### Bước 2: Deploy lại Web App (QUAN TRỌNG!)

Sau khi cập nhật code, bạn **PHẢI deploy lại** để áp dụng thay đổi:

1. Trong Apps Script editor, click **Deploy** > **Manage deployments**
2. Click biểu tượng **✏️ Edit** (bút chì) bên cạnh deployment hiện tại
3. Click **Deploy** (không cần thay đổi gì)
4. Copy **Web app URL** mới (nếu có) và cập nhật vào `script.js` nếu URL thay đổi

**LƯU Ý:** Nếu không deploy lại, code cũ vẫn chạy và không có thay đổi!

### Bước 3: Kiểm tra Execution Log

1. Trong Apps Script editor, click **Executions** (biểu tượng đồng hồ ở sidebar trái)
2. Click vào execution gần nhất
3. Xem **Logs** để biết:
   - Dữ liệu có được nhận không
   - Sheet nào đang được sử dụng
   - Có lỗi gì không

### Bước 4: Kiểm tra Sheet name

Script sẽ tự động:
- Tìm sheet tên "Data"
- Nếu không tìm thấy, sử dụng sheet đầu tiên (Sheet1 hoặc tên khác)
- Nếu sheet rỗng, tự động thêm header

**Kiểm tra:**
1. Mở Google Sheet
2. Xem tên các tab ở dưới cùng
3. Dữ liệu sẽ được ghi vào:
   - Tab "Data" (nếu có)
   - HOẶC tab đầu tiên (nếu không có "Data")

### Bước 5: Test lại

1. Mở file `test-google-sheets.html` hoặc `index.html`
2. Gửi dữ liệu test
3. Kiểm tra:
   - Console log (F12) - phải thấy "Request sent"
   - Google Sheets - phải có dòng mới
   - Apps Script Execution Log - phải thấy log chi tiết

## Debug chi tiết

### Xem logs trong Apps Script:

1. Mở Apps Script editor
2. Vào **Executions**
3. Click vào execution gần nhất
4. Xem logs sẽ có dạng:
   ```
   === doPost called ===
   Available sheets: Sheet1, Data, ...
   Found sheet: Sheet1
   === Data received ===
   Received data length: 46
   ✅ Row appended successfully! Row number: 2
   ```

### Nếu vẫn không thấy dữ liệu:

1. **Kiểm tra sheet name:**
   - Xem log "Available sheets: ..."
   - Xem log "Found sheet: ..." hoặc "Using first sheet: ..."
   - Mở đúng sheet đó trong Google Sheets

2. **Kiểm tra quyền truy cập:**
   - Đảm bảo Web App được deploy với "Who has access: Anyone"
   - Đảm bảo script có quyền truy cập Google Sheets

3. **Kiểm tra SPREADSHEET_ID:**
   - Trong `google-apps-script.js`, dòng 16: `const SPREADSHEET_ID = '13uIBESYl6cklFlBWMj0HAjsJpcBCnCZk7t86gvG0y_I';`
   - Đảm bảo ID này đúng với ID trong URL Google Sheet

## Test nhanh

Chạy hàm test trong Apps Script:

1. Trong Apps Script editor, chọn hàm `testDoPost`
2. Click **Run** (▶️)
3. Cho phép quyền truy cập nếu được hỏi
4. Kiểm tra Google Sheets - phải có dòng test mới

## Liên hệ hỗ trợ

Nếu vẫn không được, cung cấp:
1. Screenshot của Apps Script Execution Log
2. Screenshot của Console log (F12)
3. Tên các sheet trong Google Sheet của bạn
