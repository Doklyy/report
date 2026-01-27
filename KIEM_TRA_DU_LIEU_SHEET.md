# 🔍 Hướng Dẫn Kiểm Tra Dữ Liệu Trong Google Sheets

## Vấn đề:
- API trả về dữ liệu (có 4 bản ghi)
- Nhưng trong Google Sheets không thấy dữ liệu

## Nguyên nhân có thể:

### 1. Dữ liệu đang ở Sheet khác
Google Sheets có thể có nhiều sheet (tab). Dữ liệu có thể đang ở:
- Sheet "Data" (nếu đã được tạo)
- Sheet đầu tiên (Sheet1)
- Sheet khác

### 2. Cách kiểm tra:

**Bước 1: Kiểm tra các Sheet (Tab)**
1. Mở Google Sheets: https://docs.google.com/spreadsheets/d/1SmS6QoHdRmsB4IU9u7e1Y0x5-yrJAsY4yoFbHRyYVJo/edit
2. Xem ở dưới cùng có các tab (Sheet1, Data, ...)
3. Click vào từng tab để xem dữ liệu

**Bước 2: Kiểm tra Sheet "Data"**
1. Nếu có tab "Data", click vào đó
2. Xem có dữ liệu không

**Bước 3: Kiểm tra Sheet đầu tiên (Sheet1)**
1. Click vào tab đầu tiên (thường là "Sheet1" hoặc tên khác)
2. Xem có dữ liệu không

**Bước 4: Tìm kiếm dữ liệu**
1. Nhấn Ctrl+F (hoặc Cmd+F trên Mac)
2. Tìm kiếm "Đỗ Khánh Ly" hoặc "Test Customer"
3. Xem dữ liệu ở sheet nào

## Giải pháp:

### Nếu dữ liệu ở Sheet khác:
1. Copy dữ liệu từ sheet đó
2. Paste vào sheet bạn muốn
3. Hoặc đổi tên sheet đó thành "Data"

### Nếu không có dữ liệu nào:
1. Kiểm tra lại Google Apps Script:
   - Mở: https://script.google.com/home/projects
   - Tìm project của bạn
   - Kiểm tra Sheet ID có đúng không
   - Kiểm tra SHEET_NAME = 'Data'

2. Test lại việc gửi dữ liệu:
   - Mở website: https://doklyy.github.io/report/
   - Điền form và gửi
   - Kiểm tra lại Google Sheets

3. Kiểm tra Execution log trong Google Apps Script:
   - Mở Google Apps Script Editor
   - Vào View > Execution log
   - Xem có lỗi gì không

### Tạo Sheet "Data" thủ công:
1. Trong Google Sheets, click vào dấu "+" ở dưới cùng để thêm sheet mới
2. Đặt tên là "Data"
3. Thử gửi dữ liệu lại

## Lưu ý:

- ✅ Script sẽ tự động tạo sheet "Data" nếu chưa có
- ✅ Nếu sheet "Data" đã tồn tại, dữ liệu sẽ được thêm vào đó
- ✅ Nếu không có sheet "Data", script sẽ dùng sheet đầu tiên
- ✅ Dữ liệu mới sẽ được thêm vào dòng cuối cùng (appendRow)

## Kiểm tra nhanh:

1. **Mở Google Sheets**
2. **Xem tất cả các tab (sheet) ở dưới cùng**
3. **Click vào từng tab để tìm dữ liệu**
4. **Nếu không thấy, thử gửi dữ liệu mới và kiểm tra lại**
