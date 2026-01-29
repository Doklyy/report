# Hướng dẫn Test Form Submission

## Cách 1: Sử dụng trang Test (Khuyến nghị)

1. Mở trang test: `https://doklyy.github.io/report/test.html`
2. Click các nút test để kiểm tra:
   - **Test Thu thập dữ liệu**: Kiểm tra hàm collectFormData
   - **Test Định dạng dữ liệu**: Kiểm tra formatDataForSheets
   - **Test Validation**: Kiểm tra các validation rules
   - **Test Kết nối Google Sheets**: Kiểm tra kết nối đến Google Apps Script
   - **Test Gửi dữ liệu (Mock)**: Gửi dữ liệu test thực tế

## Cách 2: Test trên trang chính với Console

1. Mở trang chính: `https://doklyy.github.io/report/`
2. Mở Developer Console (F12)
3. Điền form với dữ liệu test
4. Chạy các lệnh sau trong Console:

```javascript
// Test 1: Kiểm tra GOOGLE_SCRIPT_URL
console.log('Google Script URL:', GOOGLE_SCRIPT_URL);

// Test 2: Thu thập dữ liệu form
const formData = collectFormData();
console.log('Form Data:', formData);

// Test 3: Định dạng dữ liệu
const formattedData = formatDataForSheets(formData);
console.log('Formatted Data:', formattedData);
console.log('Data Length:', formattedData.length);

// Test 4: Gửi dữ liệu test
const testData = [
    new Date().toLocaleString('vi-VN'),
    'Test Customer',
    '0942235138',
    'Test Address',
    '0-1000',
    '1000',
    '1',
    '25.0%/25.0%/25.0%/25.0%',
    '10',
    '10',
    '250',
    '250',
    '250',
    '250',
    '1000',
    '100.00%',
    'Có',
    'Không',
    'Không',
    'Không',
    'Hàng điện tử, điện lạnh, gia dụng',
    'Test Product',
    'VNpost',
    '',
    '0-1000: 10000/15000/20000/25000',
    '10000.00',
    '15000.00',
    '20000.00',
    '25000.00',
    '5%',
    '3%',
    'Test policy',
    '0-1000: 9500/14000/19000/24000',
    '9500.00',
    '14000.00',
    '19000.00',
    '24000.00',
    'Test proposed policy',
    '4%',
    '9500.00/10000.00/-5.0%/14000.00/15000.00/-6.7%/19000.00/20000.00/-5.0%/24000.00/25000.00/-4.0%',
    'Test Reporter',
    '0987654321',
    'Test Post Office',
    'NVKD',
    'Test Branch',
    '12345'
];

sendToGoogleSheets(testData)
    .then(result => {
        console.log('✅ Success:', result);
        alert('Gửi thành công! Dòng ' + (result.rowNumber || 'N/A'));
    })
    .catch(error => {
        console.error('❌ Error:', error);
        alert('Lỗi: ' + error.message);
    });
```

## Cách 3: Test thủ công trên form

1. Mở trang chính: `https://doklyy.github.io/report/`
2. Điền đầy đủ form với dữ liệu test:
   - Tên KH/Tên shop: Test Customer
   - Điện thoại: 0942235138
   - Địa chỉ: Test Address
   - Thêm mốc trọng lượng: 0-1000
   - Điền sản lượng các khu vực
   - Chọn ngành hàng
   - Chọn đối thủ
   - Điền sản phẩm cụ thể
   - Điền giá đối thủ và giá đề xuất
   - Điền thông tin người báo cáo
3. Click "Gửi báo cáo"
4. Kiểm tra:
   - Nút có đổi thành "✓ GỬI THÀNH CÔNG!" không?
   - Trang có bị redirect không?
   - Mở Google Sheets để kiểm tra dữ liệu đã được thêm chưa

## Checklist kiểm tra

- [ ] Form không bị redirect khi submit
- [ ] Nút hiển thị "✓ GỬI THÀNH CÔNG!" khi thành công
- [ ] Nút hiển thị "✗ GỬI THẤT BẠI" khi có lỗi
- [ ] Dữ liệu xuất hiện trong Google Sheets
- [ ] Số cột dữ liệu đúng (46 cột)
- [ ] Dữ liệu được ghi đúng vào các cột tương ứng
- [ ] Không có lỗi CORS trong Console
- [ ] Thông báo hiển thị ngay tại nút (không phải ở trên cùng)

## Xử lý lỗi thường gặp

### Lỗi CORS
- Đảm bảo Google Apps Script đã được deploy với "Who has access: Anyone"
- Kiểm tra URL Google Apps Script có đúng không

### Dữ liệu không xuất hiện trong Sheets
- Kiểm tra Google Apps Script có chạy không
- Kiểm tra SPREADSHEET_ID có đúng không
- Kiểm tra sheet "Data" có tồn tại không
- Xem logs trong Google Apps Script (Executions)

### Form bị redirect
- Kiểm tra form có `onsubmit="return false;"` không
- Kiểm tra `e.preventDefault()` có được gọi không
- Kiểm tra form submission fallback có dùng iframe không
