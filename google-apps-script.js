const SPREADSHEET_ID = '1538u5QD9QeTKOLOKHxXcTyiwzV7b3NdEYaATzaEG60s';
const SHEET_NAME = 'Data';

/**
 * Xử lý yêu cầu POST (Ghi dữ liệu)
 */
function doPost(e) {
  try {
    // 1. Kiểm tra đối tượng event e - dùng optional chaining để tránh lỗi khi e undefined
    var postContents = (e && e.postData && e.postData.contents) ? e.postData.contents : null;
    if (!postContents && e && e.parameter && e.parameter.data) {
      postContents = e.parameter.data; // Hỗ trợ form-encoded
    }
    if (!postContents) {
      return createJsonResponse({
        success: false,
        error: 'Lỗi: Không có dữ liệu sự kiện. Vui lòng không chạy doPost trực tiếp từ Editor. Hãy dùng hàm testDoPost() hoặc gọi từ Web App.'
      });
    }

    // 2. Phân tích dữ liệu JSON từ body
    let jsonData;
    try {
      jsonData = JSON.parse(postContents);
    } catch (parseError) {
      return createJsonResponse({
        success: false,
        error: 'Dữ liệu JSON không hợp lệ: ' + parseError.toString()
      });
    }

    const rowsData = jsonData.data;
    const mergeCells = jsonData.mergeCells !== false;

    // 3. Kết nối Spreadsheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      return createJsonResponse({
        success: false,
        error: 'Không thể truy cập Spreadsheet. Kiểm tra ID và quyền truy cập: ' + error.toString()
      });
    }

    let sheet = ss.getSheetByName(SHEET_NAME);

    // Tạo sheet mới nếu chưa có
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      setupHeaders(sheet);
    }

    // Thêm header nếu sheet trống (đã xóa hết dữ liệu)
    if (sheet.getLastRow() === 0) {
      setupHeaders(sheet);
    }

    // 4. Kiểm tra dữ liệu hàng
    if (!rowsData || rowsData.length === 0) {
      return createJsonResponse({ success: false, error: 'Không có dữ liệu hàng để ghi' });
    }

    const rowsToAppend = Array.isArray(rowsData[0]) ? rowsData : [rowsData];
    const startRow = sheet.getLastRow() + 1;

    // 5. Ghi dữ liệu vào Sheet
    const stringRowsData = rowsToAppend.map(row =>
      row.map(cell => (cell === null || cell === undefined) ? '' : String(cell))
    );

    const numRows = stringRowsData.length;
    const numCols = stringRowsData[0] ? stringRowsData[0].length : 0;

    if (numRows > 0 && numCols > 0) {
      // getRange(row, column, numRows, numColumns) - vùng từ (startRow,1) kéo dài numRows dòng, numCols cột
      sheet.getRange(startRow, 1, numRows, numCols).setValues(stringRowsData);

      // 6. Thực hiện Merge ô (nếu được yêu cầu)
      if (numRows > 1 && mergeCells) {
        performMerge(sheet, startRow, numRows, stringRowsData[0]);
      }

      // Tự động căn chỉnh cột
      try {
        sheet.autoResizeColumns(1, numCols);
      } catch (resizeError) {
        Logger.log('Warning: autoResizeColumns - ' + resizeError.toString());
      }
    }

    return createJsonResponse({
      success: true,
      message: 'Lưu dữ liệu thành công',
      startRow: startRow,
      numberOfRows: numRows
    });

  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Hàm hỗ trợ tạo Header cho Sheet
 */
function setupHeaders(sheet) {
  const headers = [
    'Thời gian', 'Tên KH/Tên shop', 'Điện thoại', 'Địa chỉ', 'Các mốc trọng lượng',
    'Sản lượng hàng gửi', 'Tổng sản lượng các mốc', 'Tỷ trọng sản lượng', 'Tỷ trọng % theo khu vực',
    'Tỷ trọng hàng trên 1.2m', 'Tỷ trọng hàng nguyên khối từ 100kg trở lên',
    'Sản lượng Nội tỉnh', 'Sản lượng Nội miền', 'Sản lượng Cận miền', 'Sản lượng Liên miền',
    'Tổng sản lượng', 'Tỷ trọng %', 'Hàng thông thường', 'Chất lỏng', 'Dễ cháy', 'Dễ vỡ',
    'Ngành hàng', 'Tên sản phẩm', 'Đối thủ', 'Đối thủ khác', 'Giá đối thủ',
    'Đơn giá bình quân Nội tỉnh (ĐT)', 'Đơn giá bình quân Nội miền (ĐT)',
    'Đơn giá bình quân Cận miền (ĐT)', 'Đơn giá bình quân Liên miền (ĐT)',
    'Tỷ lệ hoàn hiện tại', 'Tỷ lệ hoàn đối thủ miễn phí', 'Chính sách đặc thù đối thủ',
    'Giá đề xuất', 'Đơn giá bình quân Nội tỉnh (ĐX)', 'Đơn giá bình quân Nội miền (ĐX)',
    'Đơn giá bình quân Cận miền (ĐX)', 'Đơn giá bình quân Liên miền (ĐX)',
    'Chính sách đặc thù đề xuất', 'Tỷ lệ hoàn đề xuất', 'So sánh đơn giá bình quân',
    'Họ và tên người báo cáo', 'Điện thoại người báo cáo', 'Tên Bưu cục',
    'Chức danh', 'Chi nhánh', 'Mã Bưu cục', 'Kết quả', 'Ghi chú'
  ];
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold').setBackground('#4CAF50').setFontColor('white');
  sheet.setFrozenRows(1);
}

/**
 * Hàm thực hiện Merge các ô giống nhau
 * getRange(row, column, numRows, numColumns) - tham số 3 là SỐ DÒNG, 4 là SỐ CỘT
 */
function performMerge(sheet, startRow, numRows, firstRowData) {
  // Không merge cột 5,6,7 (mốc trọng lượng, sản lượng hàng gửi, tổng SL các mốc), cột 26 (Giá đối thủ), cột 34 (Giá đề xuất) - vì khác nhau mỗi dòng
  const mergeRanges = [
    { startCol: 1, endCol: 4 },   // Cột 1-4: Thời gian, Tên KH, Điện thoại, Địa chỉ
    { startCol: 8, endCol: 23 },  // Cột 8-23: Tỷ trọng SL đến Ngành hàng (bỏ cột 7 Tổng SL các mốc)
    { startCol: 25, endCol: 25 },// Cột 25: Đối thủ khác
    { startCol: 27, endCol: 33 },// Cột 27-33: Đơn giá ĐT đến Chính sách đặc thù đối thủ (bỏ cột 26 Giá đối thủ)
    { startCol: 35, endCol: 49 } // Cột 35-49: Đơn giá ĐX đến Ghi chú (bỏ cột 34 Giá đề xuất)
  ];

  mergeRanges.forEach(range => {
    for (let col = range.startCol; col <= range.endCol; col++) {
      try {
        const cellRange = sheet.getRange(startRow, col, numRows, 1);
        cellRange.merge();
        if (cellRange.getValue() === '') {
          cellRange.setValue(firstRowData[col - 1] || '');
        }
      } catch (mergeError) {
        Logger.log('Warning: Merge col ' + col + ' - ' + mergeError.toString());
      }
    }
  });
}

/**
 * Tạo phản hồi JSON chuẩn
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hàm Test - DÙNG CÁI NÀY ĐỂ TEST TRONG EDITOR
 */
function testDoPost() {
  const dummyData = Array(49).fill('Test Value');
  dummyData[0] = new Date().toLocaleString('vi-VN');
  dummyData[1] = 'Test Customer';
  dummyData[2] = '0123456789';
  dummyData[3] = 'Test Address';
  dummyData[4] = '0-1000';
  dummyData[5] = '100/200/300/400';
  dummyData[47] = 'Phê duyệt';
  dummyData[48] = 'Test ghi chú';

  const testPayload = {
    postData: {
      contents: JSON.stringify({
        data: [dummyData, dummyData],
        mergeCells: true
      })
    }
  };
  const response = doPost(testPayload);
  Logger.log(response.getContent());
}

/**
 * Xử lý yêu cầu GET (Đọc dữ liệu)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({ success: false, message: 'Không tìm thấy sheet', data: [] });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createJsonResponse({ success: true, data: [], headers: data[0] || [] });
    }

    const headers = data[0];
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i] || '');
      return obj;
    });

    return createJsonResponse({ success: true, data: rows, headers: headers, total: rows.length });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString(), data: [] });
  }
}
