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
const SPREADSHEET_ID = '13uIBESYl6cklFlBWMj0HAjsJpcBCnCZk7t86gvG0y_I';

// Tên sheet để ghi dữ liệu
const SHEET_NAME = 'Data';

// Xử lý CORS preflight request
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let rowData;
    
    // Log để debug - xem dữ liệu nhận được
    Logger.log('=== doPost called ===');
    Logger.log('e.parameter: ' + JSON.stringify(e.parameter));
    Logger.log('e.postData: ' + (e.postData ? JSON.stringify(e.postData) : 'null'));
    
    // Kiểm tra xem dữ liệu đến từ form submission hay JSON
    if (e.postData && e.postData.contents) {
      // Dữ liệu từ JSON (fetch API với JSON body)
      try {
        const jsonData = JSON.parse(e.postData.contents);
        rowData = jsonData.data;
        Logger.log('Parsed from postData.contents (JSON)');
      } catch (parseError) {
        Logger.log('Cannot parse postData.contents as JSON: ' + parseError.toString());
        // Thử lấy từ parameter 'data'
        const dataParam = e.parameter.data;
        if (dataParam) {
          try {
            // Decode URI component nếu cần
            const decoded = decodeURIComponent(dataParam);
            const jsonData = JSON.parse(decoded);
            rowData = jsonData.data;
            Logger.log('Parsed from e.parameter.data (form-encoded)');
          } catch (e2) {
            throw new Error('Cannot parse data from parameter: ' + e2.toString());
          }
        } else {
          throw new Error('Cannot parse data: ' + parseError.toString());
        }
      }
    } else if (e.parameter && e.parameter.data) {
      // Dữ liệu từ form submission (form-encoded)
      const dataParam = e.parameter.data;
      try {
        // Decode URI component vì frontend đã encode
        const decoded = decodeURIComponent(dataParam);
        const jsonData = JSON.parse(decoded);
        rowData = jsonData.data;
        Logger.log('Parsed from e.parameter.data (form-encoded, decoded)');
      } catch (parseError) {
        Logger.log('Error parsing parameter.data: ' + parseError.toString());
        Logger.log('Raw dataParam: ' + dataParam);
        throw new Error('Cannot parse form data: ' + parseError.toString());
      }
    } else {
      Logger.log('No data found in e.parameter or e.postData');
      throw new Error('No data received. Expected JSON in postData.contents or form parameter "data"');
    }
    
    // Open spreadsheet - với error handling tốt hơn
    let ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Cannot access spreadsheet. Please check: 1) Sheet ID is correct, 2) Script has permission to access the sheet, 3) Sheet exists and is not deleted. Error: ' + error.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Try to get the sheet by name, if not found, use the first sheet or create new
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Log tất cả sheet names để debug
    const allSheets = ss.getSheets();
    Logger.log('Available sheets: ' + allSheets.map(s => s.getName()).join(', '));
    
    // If sheet doesn't exist, try to use the first sheet (Sheet1) or create new
    if (!sheet) {
      Logger.log('Sheet "' + SHEET_NAME + '" not found. Trying first sheet...');
      // Try to get the first sheet (usually named "Sheet1" hoặc tên khác)
      const firstSheet = ss.getSheets()[0];
      if (firstSheet) {
        Logger.log('Using first sheet: ' + firstSheet.getName());
        sheet = firstSheet;
        
        // Kiểm tra xem sheet có header chưa (dòng đầu tiên có dữ liệu không)
        const hasData = sheet.getLastRow() > 0;
        if (!hasData) {
          Logger.log('First sheet is empty, adding headers...');
          // Add headers nếu sheet rỗng
          const headers = [
            'Thời gian', 'Tên KH/Tên shop', 'Điện thoại', 'Địa chỉ', 'Các mốc trọng lượng',
            'Tổng sản lượng các mốc', 'Tỷ trọng sản lượng','Tỷ trọng % theo khu vực','Tỷ trọng hàng trên 1.2m',
            'Tỷ trọng hàng nguyên khối từ 100kg trở lên', 'Sản lượng Nội tỉnh', 'Sản lượng Nội miền',
            'Sản lượng Cận miền', 'Sản lượng Liên miền', 'Tổng sản lượng', 'Tỷ trọng %',
            'Hàng thông thường', 'Chất lỏng', 'Dễ cháy', 'Dễ vỡ', 'Ngành hàng',
            'Tên sản phẩm', 'Đối thủ', 'Đối thủ khác', 'Giá đối thủ', 'Đơn giá bình quân Nội tỉnh (ĐT)',
            'Đơn giá bình quân Nội miền (ĐT)', 'Đơn giá bình quân Cận miền (ĐT)',
            'Đơn giá bình quân Liên miền (ĐT)', 'Tỷ lệ hoàn hiện tại',
            'Tỷ lệ hoàn đối thủ miễn phí', 'Chính sách đặc thù đối thủ', 'Giá đề xuất',
            'Đơn giá bình quân Nội tỉnh (ĐX)', 'Đơn giá bình quân Nội miền (ĐX)',
            'Đơn giá bình quân Cận miền (ĐX)', 'Đơn giá bình quân Liên miền (ĐX)',
            'Chính sách đặc thù đề xuất', 'Tỷ lệ hoàn đề xuất','So sánh đơn giá bình quân ','Họ và tên người báo cáo',
            'Điện thoại người báo cáo', 'Tên Bưu cục', 'Chức danh', 'Chi nhánh', 'Mã Bưu cục'
          ];
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
          sheet.getRange(1, 1, 1, headers.length).setBackground('#4CAF50');
          sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
          sheet.setFrozenRows(1);
        } else {
          Logger.log('First sheet already has data, skipping header creation');
        }
      } else {
        // Create new sheet with name "Data"
        Logger.log('Creating new sheet: ' + SHEET_NAME);
        sheet = ss.insertSheet(SHEET_NAME);
        // Add headers
        const headers = [
          'Thời gian', 'Tên KH/Tên shop', 'Điện thoại', 'Địa chỉ', 'Các mốc trọng lượng',
          'Tổng sản lượng các mốc', 'Tỷ trọng sản lượng','Tỷ trọng % theo khu vực','Tỷ trọng hàng trên 1.2m',
          'Tỷ trọng hàng nguyên khối từ 100kg trở lên', 'Sản lượng Nội tỉnh', 'Sản lượng Nội miền',
          'Sản lượng Cận miền', 'Sản lượng Liên miền', 'Tổng sản lượng', 'Tỷ trọng %',
          'Hàng thông thường', 'Chất lỏng', 'Dễ cháy', 'Dễ vỡ', 'Ngành hàng',
          'Tên sản phẩm', 'Đối thủ', 'Đối thủ khác', 'Giá đối thủ', 'Đơn giá bình quân Nội tỉnh (ĐT)',
          'Đơn giá bình quân Nội miền (ĐT)', 'Đơn giá bình quân Cận miền (ĐT)',
          'Đơn giá bình quân Liên miền (ĐT)', 'Tỷ lệ hoàn hiện tại',
          'Tỷ lệ hoàn đối thủ miễn phí', 'Chính sách đặc thù đối thủ', 'Giá đề xuất',
          'Đơn giá bình quân Nội tỉnh (ĐX)', 'Đơn giá bình quân Nội miền (ĐX)',
          'Đơn giá bình quân Cận miền (ĐX)', 'Đơn giá bình quân Liên miền (ĐX)',
          'Chính sách đặc thù đề xuất', 'Tỷ lệ hoàn đề xuất','So sánh đơn giá bình quân ','Họ và tên người báo cáo',
          'Điện thoại người báo cáo', 'Tên Bưu cục', 'Chức danh', 'Chi nhánh', 'Mã Bưu cục'
        ];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        sheet.getRange(1, 1, 1, headers.length).setBackground('#4CAF50');
        sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
        sheet.setFrozenRows(1);
      }
    } else {
      Logger.log('Found sheet: ' + sheet.getName());
    }
    
    // Validate rowData
    if (!rowData || rowData.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'No data provided',
          receivedData: rowData
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Log để debug
    Logger.log('=== Data received ===');
    Logger.log('Received data length: ' + rowData.length);
    Logger.log('First 5 fields: ' + rowData.slice(0, 5).join(', '));
    Logger.log('Sheet name: ' + sheet.getName());
    Logger.log('Current last row: ' + sheet.getLastRow());
    
    // Append new row - đảm bảo tất cả giá trị là string để giữ nguyên format
    try {
      // Convert tất cả giá trị thành string để tránh Google Sheets tự động format
      const stringRowData = rowData.map(cell => {
        if (cell === null || cell === undefined) {
          return '';
        }
        // Đảm bảo là string, không để Google Sheets tự động format số
        return String(cell);
      });
      
      Logger.log('About to append row with ' + stringRowData.length + ' columns');
      sheet.appendRow(stringRowData);
      const newRowNumber = sheet.getLastRow();
      Logger.log('✅ Row appended successfully! Row number: ' + newRowNumber);
      Logger.log('First 5 cells: ' + stringRowData.slice(0, 5).join(', '));
      
      // Verify bằng cách đọc lại dòng vừa ghi
      const verifyRow = sheet.getRange(newRowNumber, 1, 1, stringRowData.length).getValues()[0];
      Logger.log('Verified: First cell of new row = ' + verifyRow[0]);
    } catch (appendError) {
      Logger.log('❌ Error appending row: ' + appendError.toString());
      Logger.log('Error stack: ' + appendError.stack);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Failed to append row: ' + appendError.toString(),
          sheetName: sheet.getName(),
          dataLength: rowData.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Auto-resize columns
    try {
      sheet.autoResizeColumns(1, rowData.length);
    } catch (resizeError) {
      Logger.log('Warning: Could not auto-resize columns: ' + resizeError.toString());
    }
    
    // Return success response với CORS headers
    const output = ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Data saved successfully',
        rowNumber: sheet.getLastRow(),
        dataLength: rowData.length
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Thêm CORS headers để cho phép cross-origin requests
    // Note: ContentService không hỗ trợ setHeader trực tiếp, nhưng Google Apps Script tự động thêm CORS headers khi deploy đúng cách
    return output;
      
  } catch (error) {
    // Return error response với CORS headers
    Logger.log('Error in doPost: ' + error.toString());
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

// Function để đọc dữ liệu từ Sheets (Đồng bộ ngược: Sheets → Website)
function doGet(e) {
  try {
    // Mở spreadsheet - với error handling tốt hơn
    let ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Cannot access spreadsheet. Please check: 1) Sheet ID is correct, 2) Script has permission to access the sheet, 3) Sheet exists and is not deleted. Error: ' + error.toString(),
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Nếu sheet không tồn tại, trả về empty
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          message: 'Sheet not found',
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Lấy tất cả dữ liệu
    const data = sheet.getDataRange().getValues();
    
    // Nếu không có dữ liệu (chỉ có header hoặc rỗng)
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: [],
          headers: data.length > 0 ? data[0] : []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Chuyển đổi thành JSON
    const headers = data[0];
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    // Trả về JSON
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: rows,
        headers: headers,
        total: rows.length
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        data: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
