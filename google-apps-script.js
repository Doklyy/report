/**
 * Google Apps Script để nhận dữ liệu từ form và ghi vào Google Sheets
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Mở Google Sheets mới
 * 2. Vào Extensions > Apps Script
 * 3. Xóa code mặc định và dán code này vào
 * 4. Thay đổi SPREADSHEET_ID thành ID của Google Sheet của bạn
 * 5. Lưu và chạy hàm doPost để tạo trigger
 * 6. Deploy > New deployment > chọn Web app
 * 7. Chọn "Execute as: Me" và "Who has access: Anyone"
 * 8. Copy URL và dán vào biến GOOGLE_SCRIPT_URL trong file script.js
 */

// Thay đổi ID này thành ID của Google Sheet của bạn
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// Tên sheet để ghi dữ liệu
const SHEET_NAME = 'Data';

function doPost(e) {
  try {
    // Parse JSON data
    const jsonData = JSON.parse(e.postData.contents);
    const rowData = jsonData.data;
    
    // Open spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Add headers
      const headers = [
        'Thời gian',
        'Tên KH/Tên shop',
        'Điện thoại',
        'Địa chỉ',
        'Các mốc trọng lượng',
        'Tổng sản lượng các mốc',
        'Tỷ trọng sản lượng',
        'Tỷ trọng hàng trên 1.2m',
        'Sản lượng Nội tỉnh',
        'Sản lượng Nội miền',
        'Sản lượng Cận miền',
        'Sản lượng Liên miền',
        'Tổng sản lượng',
        'Tỷ trọng %',
        'Hàng thông thường',
        'Chất lỏng',
        'Dễ cháy',
        'Dễ vỡ',
        'Ngành hàng',
        'Đối thủ',
        'Đối thủ khác',
        'Giá đối thủ',
        'Đơn giá bình quân Nội tỉnh (ĐT)',
        'Đơn giá bình quân Nội miền (ĐT)',
        'Đơn giá bình quân Cận miền (ĐT)',
        'Đơn giá bình quân Liên miền (ĐT)',
        'Tỷ lệ hoàn hiện tại',
        'Tỷ lệ hoàn đối thủ miễn phí',
        'Chính sách đặc thù đối thủ',
        'Giá đề xuất',
        'Đơn giá bình quân Nội tỉnh (ĐX)',
        'Đơn giá bình quân Nội miền (ĐX)',
        'Đơn giá bình quân Cận miền (ĐX)',
        'Đơn giá bình quân Liên miền (ĐX)',
        'Chính sách đặc thù đề xuất',
        'Tỷ lệ hoàn đề xuất',
        'Họ và tên người báo cáo',
        'Điện thoại người báo cáo',
        'Tên Bưu cục',
        'Chức danh',
        'Chi nhánh',
        'Mã Bưu cục'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#4CAF50');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
      sheet.setFrozenRows(1);
    }
    
    // Append new row
    sheet.appendRow(rowData);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, rowData.length);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Data saved successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to test the script
function testDoPost() {
  const testData = {
    data: [
      new Date().toLocaleString('vi-VN'),
      'Test Customer',
      '0123456789',
      'Test Address',
      '0-1000',
      '1000',
      '100%',
      '50',
      '100', '200', '300', '400',
      '1000',
      '100%',
      'Có', 'Không', 'Không', 'Không',
      'Hàng điện tử',
      'GHN; GHTK',
      '',
      '0-1000: 10000/15000/20000/25000',
      '10000', '15000', '20000', '25000',
      '5', '3',
      'Test policies',
      '0-1000: 9500/14000/19000/24000',
      '9500', '14000', '19000', '24000',
      'Test proposed policies',
      '4',
      'Test Reporter',
      '0987654321',
      'Test Post Office',
      'Nhân viên',
      'Hà Nội',
      '100000'
    ]
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  doPost(mockEvent);
}
