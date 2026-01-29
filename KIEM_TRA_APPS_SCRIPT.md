# Hướng dẫn kiểm tra Apps Script có nhận được dữ liệu không

## Vấn đề
Form đã submit thành công, nhưng không thấy dữ liệu trong Google Sheets.

## Cách kiểm tra

### Bước 1: Kiểm tra Apps Script Execution Log

1. **Mở Google Sheet:**
   https://docs.google.com/spreadsheets/d/13uIBESYl6cklFlBWMj0HAjsJpcBCnCZk7t86gvG0y_I/edit

2. **Vào Apps Script:**
   - Click **Extensions** > **Apps Script**

3. **Xem Executions:**
   - Click **Executions** (biểu tượng đồng hồ ⏰ ở sidebar trái)
   - Tìm execution gần nhất (sau khi bạn submit form)
   - Click vào execution đó

4. **Xem Logs:**
   - Trong execution details, scroll xuống phần **Logs**
   - Bạn sẽ thấy các dòng log như:
     ```
     === doPost called ===
     e.parameter: {"data":"..."}
     Parsed from e.parameter.data (form-encoded, decoded)
     Available sheets: Sheet1, Data, ...
     Found sheet: Sheet1
     === Data received ===
     Received data length: 46
     ✅ Row appended successfully! Row number: 2
     ```

### Bước 2: Phân tích Logs

#### ✅ Nếu thấy "doPost called":
- Apps Script **ĐÃ NHẬN** được request
- Tiếp tục kiểm tra các dòng tiếp theo

#### ✅ Nếu thấy "Parsed from e.parameter.data":
- Dữ liệu **ĐÃ ĐƯỢC PARSE** thành công
- Tiếp tục kiểm tra

#### ✅ Nếu thấy "Row appended successfully":
- Dữ liệu **ĐÃ ĐƯỢC GHI** vào sheet
- Kiểm tra sheet mà log chỉ ra (ví dụ: "Found sheet: Sheet1")
- **Mở đúng sheet đó** trong Google Sheets

#### ❌ Nếu thấy lỗi:
- Copy toàn bộ log lỗi
- Gửi cho tôi để phân tích

#### ❌ Nếu KHÔNG THẤY execution nào:
- Apps Script **CHƯA NHẬN** được request
- Có thể do:
  1. URL Google Apps Script sai
  2. Apps Script chưa được deploy
  3. Network/firewall block request

### Bước 3: Kiểm tra Sheet name

Trong logs, bạn sẽ thấy:
```
Available sheets: Sheet1, Data, De xuat bang gia hang nang, ...
Found sheet: Sheet1
```

**Quan trọng:** Mở đúng sheet mà log chỉ ra!

- Nếu log nói "Found sheet: Sheet1" → Mở tab "Sheet1"
- Nếu log nói "Using first sheet: De xuat bang gia hang nang" → Mở tab "De xuat bang gia hang nang"

### Bước 4: Kiểm tra quyền truy cập

1. Trong Apps Script editor, click **Deploy** > **Manage deployments**
2. Kiểm tra:
   - **Who has access:** Phải là "Anyone" hoặc "Anyone with Google account"
   - **Execute as:** Phải là "Me"

### Bước 5: Deploy lại nếu cần

Nếu bạn đã cập nhật code Apps Script:

1. **Deploy** > **Manage deployments**
2. Click **Edit** (✏️) bên cạnh deployment hiện tại
3. Click **Deploy**
4. Đợi vài giây để deployment hoàn tất

**LƯU Ý:** Mỗi lần sửa code Apps Script, bạn PHẢI deploy lại!

## Test nhanh

Chạy hàm test trong Apps Script:

1. Trong Apps Script editor, chọn hàm `testDoPost` từ dropdown
2. Click **Run** (▶️)
3. Cho phép quyền truy cập nếu được hỏi
4. Kiểm tra Google Sheets - phải có dòng test mới
5. Xem Execution Log để biết sheet nào được sử dụng

## Checklist

- [ ] Apps Script Execution Log có "doPost called"
- [ ] Log có "Parsed from e.parameter.data"
- [ ] Log có "Row appended successfully"
- [ ] Đã mở đúng sheet mà log chỉ ra
- [ ] Apps Script đã được deploy với "Anyone" access
- [ ] Đã deploy lại sau khi cập nhật code

## Nếu vẫn không thấy dữ liệu

Gửi cho tôi:
1. **Screenshot của Apps Script Execution Log** (toàn bộ logs)
2. **Tên các sheet** trong Google Sheet của bạn
3. **Console log** từ trình duyệt (F12)
