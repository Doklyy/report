const SPREADSHEET_ID = '1538u5QD9QeTKOLOKHxXcTyiwzV7b3NdEYaATzaEG60s';

// Tên sheet để ghi dữ liệu
const SHEET_NAME = 'Data';
function doPost(e) {
  try {
    // Parse JSON data
    const jsonData = JSON.parse(e.postData.contents);
    const rowsData = jsonData.data; // Mảng các rows (mỗi mốc trọng lượng = 1 row)
    const mergeCells = jsonData.mergeCells !== false; // Mặc định là true
    
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
    
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      const firstSheet = ss.getSheets()[0];
      if (firstSheet && firstSheet.getName() === 'Data') {
        sheet = firstSheet;
      } else {
        // Create new sheet with name "Data"
        sheet = ss.insertSheet(SHEET_NAME);
      }
      // Add headers
      const headers = [
         'Thời gian', 'Tên KH/Tên shop', 'Điện thoại', 'Địa chỉ', 'Các mốc trọng lượng', 
    'Sản lượng hàng gửi', 'Tổng sản lượng các mốc', 'Tỷ trọng sản lượng','Tỷ trọng % theo khu vực',
    'Tỷ trọng hàng trên 1.2m', 'Tỷ trọng hàng nguyên khối từ 100kg trở lên', 
    'Sản lượng Nội tỉnh', 'Sản lượng Nội miền', 'Sản lượng Cận miền', 'Sản lượng Liên miền', 
    'Tổng sản lượng', 'Tỷ trọng %', 'Hàng thông thường', 'Chất lỏng', 'Dễ cháy', 'Dễ vỡ', 
    'Ngành hàng','Tên sản phẩm', 'Đối thủ', 'Đối thủ khác', 'Giá đối thủ', 
    'Đơn giá bình quân Nội tỉnh (ĐT)', 'Đơn giá bình quân Nội miền (ĐT)', 
    'Đơn giá bình quân Cận miền (ĐT)','Đơn giá bình quân Liên miền (ĐT)', 
    'Tỷ lệ hoàn hiện tại','Tỷ lệ hoàn đối thủ miễn phí', 'Chính sách đặc thù đối thủ', 
    'Giá đề xuất','Đơn giá bình quân Nội tỉnh (ĐX)', 'Đơn giá bình quân Nội miền (ĐX)',
    'Đơn giá bình quân Cận miền (ĐX)', 'Đơn giá bình quân Liên miền (ĐX)',
    'Chính sách đặc thù đề xuất', 'Tỷ lệ hoàn đề xuất','So sánh đơn giá bình quân ',
    'Họ và tên người báo cáo','Điện thoại người báo cáo', 'Tên Bưu cục', 
    'Chức danh', 'Chi nhánh','Mã Bưu cục',
    'Kết quả', 'Ghi chú'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#4CAF50');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
      sheet.setFrozenRows(1);
    }
    
    // Validate rowsData
    if (!rowsData || rowsData.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'No data provided',
          receivedData: rowsData
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Kiểm tra xem rowsData là mảng hay là 1 row đơn
    const isArray = Array.isArray(rowsData[0]);
    const rowsToAppend = isArray ? rowsData : [rowsData];
    
    // Log để debug
    Logger.log('Received number of rows: ' + rowsToAppend.length);
    Logger.log('First row first 5 fields: ' + (rowsToAppend[0] ? rowsToAppend[0].slice(0, 5).join(', ') : ''));
    
    // Lấy số dòng hiện tại
    const startRow = sheet.getLastRow() + 1;
    
    // Append tất cả các rows
    try {
      // Convert tất cả giá trị thành string để tránh Google Sheets tự động format
      const stringRowsData = rowsToAppend.map(row => {
        return row.map(cell => {
          if (cell === null || cell === undefined) {
            return '';
          }
          return String(cell);
        });
      });
      
      // Ghi tất cả các rows vào sheet
      const numRows = stringRowsData.length;
      const numCols = stringRowsData[0] ? stringRowsData[0].length : 0;
      
      if (numRows > 0 && numCols > 0) {
        sheet.getRange(startRow, 1, numRows, numCols).setValues(stringRowsData);
        Logger.log('Rows appended successfully. Start row: ' + startRow + ', Number of rows: ' + numRows);
        
        // Merge các ô chung nếu có nhiều hơn 1 row và mergeCells = true
        if (numRows > 1 && mergeCells) {
          // Các cột cần merge: 1-4 (Thời gian, Tên KH, Điện thoại, Địa chỉ)
          // 6-23 (Tổng sản lượng đến Đối thủ khác)
          // 25-31 (Đơn giá bình quân ĐT đến Chính sách đặc thù đối thủ)
          // 33-45 (Đơn giá bình quân ĐX đến Mã Bưu cục)
          
          const mergeRanges = [
            { startCol: 1, endCol: 4 },      // Cột 1-4: Thời gian, Tên KH, Điện thoại, Địa chỉ
            { startCol: 7, endCol: 23 },     // Cột 7-23: Tổng SL đến Ngành hàng (không merge cột 5,6 - mốc trọng lượng, sản lượng hàng gửi)
            { startCol: 25, endCol: 33 },    // Cột 25-33: Đối thủ đến Chính sách đặc thù đối thủ
            { startCol: 35, endCol: 49 }     // Cột 35-49: Đơn giá bình quân ĐX đến Ghi chú
          ];
          
          mergeRanges.forEach(range => {
            try {
              // Merge từng cột một
              for (let col = range.startCol; col <= range.endCol; col++) {
                const rangeToMerge = sheet.getRange(startRow, col, numRows, 1);
                rangeToMerge.merge();
                // Đặt giá trị vào ô đầu tiên (nếu chưa có)
                if (rangeToMerge.getValue() === '') {
                  rangeToMerge.setValue(stringRowsData[0][col - 1]);
                }
              }
            } catch (mergeError) {
              Logger.log('Warning: Could not merge columns ' + range.startCol + '-' + range.endCol + ': ' + mergeError.toString());
            }
          });
          
          Logger.log('Cells merged successfully');
        }
      }
    } catch (appendError) {
      Logger.log('Error appending rows: ' + appendError.toString());
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Failed to append rows: ' + appendError.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Auto-resize columns
    try {
      const numCols = rowsToAppend[0] ? rowsToAppend[0].length : 49;
      sheet.autoResizeColumns(1, numCols);
    } catch (resizeError) {
      Logger.log('Warning: Could not auto-resize columns: ' + resizeError.toString());
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Data saved successfully',
        startRow: startRow,
        numberOfRows: rowsToAppend.length
      }))
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
      '100/200/300/400',
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
      '100000',
      'Kết quả test',
      'Ghi chú test'
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