const SPREADSHEET_ID = '1eat6olsjZLwydmhDND6R1KA6Tzz4nP9lK3CNlForw1I';
const SHEET_NAME = 'Sheet1';

/**
 * Xử lý yêu cầu POST (Ghi dữ liệu)
 * 
 * LƯU Ý 2 LỖI THƯỜNG GẶP:
 * 1. KHÔNG dùng: const contents = e.postData.contents; (e có thể undefined khi chạy từ Editor)
 * 2. KHÔNG dùng: console.error() - Apps Script không có console, phải dùng Logger.log()
 */
function doPost(e) {
  try {
    // 1. BẮT BUỘC kiểm tra e trước - tránh lỗi "Cannot read properties of undefined (reading 'postData')"
    if (e == null || e === undefined) {
      return createJsonResponse({
        success: false,
        error: 'Lỗi: Không có dữ liệu sự kiện. Vui lòng KHÔNG chạy doPost trực tiếp từ Editor. Hãy dùng hàm testDoPost() hoặc gọi từ Web App.'
      });
    }
    
    // 2. Lấy dữ liệu - LUÔN kiểm tra e.postData trước, KHÔNG dùng "const contents = e.postData.contents"
    var postContents = null;
    if (e.postData) {
      postContents = e.postData.contents;
    }
    if (!postContents && e.parameter && e.parameter.data) {
      postContents = e.parameter.data;
    }
    
    if (!postContents) {
      return createJsonResponse({
        success: false,
        error: 'Lỗi: Không có dữ liệu POST. Vui lòng dùng testDoPost() hoặc gửi từ form Web.'
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

      // Xóa dropdown ở cột Kết quả (64) và Ghi chú (65) cho các dòng vừa ghi
      if (numCols >= 65) {
        try {
          var newRowsRange = sheet.getRange(startRow, 64, numRows, 2);
          newRowsRange.setDataValidation(null);
        } catch (vErr) { Logger.log('Validation clear: ' + vErr); }
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

  } catch (err) {
    // Lưu ý: Google Apps Script KHÔNG có console - phải dùng Logger.log
    Logger.log('Lỗi doPost: ' + (err && err.message ? err.message : String(err)));
    return createJsonResponse({ success: false, error: (err && err.message ? err.message : String(err)) });
  }
}

/**
 * Hàm tạo Header cho Sheet - 65 cột
 * Cột 6-9: header gộp "Tổng sản lượng các mốc" (4 cột dữ liệu), cột 10: Tổng
 */
function setupHeaders(sheet) {
  var headers = [
    'Thời gian', 'Tên KH/Tên shop', 'Điện thoại', 'Địa chỉ', 'Các mốc trọng lượng',
    'Tổng sản lượng các mốc', '', '', '',  // 6-9: merge 1 header
    'Tổng', 'Tỷ trọng sản lượng',
    'Tỷ trọng % Nội tỉnh', 'Tỷ trọng % Nội miền', 'Tỷ trọng % Cận miền', 'Tỷ trọng % Liên miền',
    'Tỷ trọng hàng trên 1.2m', 'Tỷ trọng hàng nguyên khối từ 100kg trở lên',
    'Sản lượng Nội tỉnh', 'Sản lượng Nội miền', 'Sản lượng Cận miền', 'Sản lượng Liên miền',
    'Tổng sản lượng', 'Tỷ trọng %', 'Hàng thông thường', 'Chất lỏng', 'Dễ cháy', 'Dễ vỡ',
    'Ngành hàng', 'Tên sản phẩm', 'Đối thủ', 'Đối thủ khác',
    'Giá ĐT N.Tỉnh', 'Giá ĐT N.Miền', 'Giá ĐT C.Miền', 'Giá ĐT L.Miền',
    'Đơn giá bình quân Nội tỉnh (ĐT)', 'Đơn giá bình quân Nội miền (ĐT)',
    'Đơn giá bình quân Cận miền (ĐT)', 'Đơn giá bình quân Liên miền (ĐT)',
    'Tỷ lệ hoàn hiện tại', 'Tỷ lệ hoàn đối thủ miễn phí', 'Chính sách đặc thù đối thủ',
    'Giá ĐX N.Tỉnh', 'Giá ĐX N.Miền', 'Giá ĐX C.Miền', 'Giá ĐX L.Miền',
    'Đơn giá bình quân Nội tỉnh (ĐX)', 'Đơn giá bình quân Nội miền (ĐX)',
    'Đơn giá bình quân Cận miền (ĐX)', 'Đơn giá bình quân Liên miền (ĐX)',
    'Chính sách đặc thù đề xuất', 'Tỷ lệ hoàn đề xuất',
    'So sánh N.Tỉnh', 'So sánh N.Miền', 'So sánh C.Miền', 'So sánh L.Miền',
    'Họ và tên người báo cáo', 'Điện thoại người báo cáo', 'Tên Bưu cục',
    'Chức danh', 'Chi nhánh', 'Mã Bưu cục', 'Kết quả', 'Ghi chú'
  ];
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold').setBackground('#4CAF50').setFontColor('white');
  // Gộp header "Tổng sản lượng các mốc" cho cột 6-9 (4 cột: getRange(row,col,numRows,numCols))
  try {
    sheet.getRange(1, 6, 1, 4).merge();
    sheet.getRange(1, 6).setValue('Tổng sản lượng các mốc');
  } catch (m) { Logger.log('Merge header: ' + m); }
  sheet.setFrozenRows(1);

  // Xóa data validation (dropdown) ở cột Kết quả (64) và Ghi chú (65)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var resultNoteRange = sheet.getRange(2, 64, lastRow - 1, 2);
    resultNoteRange.setDataValidation(null);
    resultNoteRange.clearDataValidations();
    resultNoteRange.clear({ validationsOnly: true });
  }
}

/**
 * Gộp ô nếu có nhiều dòng (cùng 1 đơn hàng/khách hàng)
 * Không gộp: 5-9 (mốc + SL 4 cột + Tổng), 33-36 (Giá ĐT 4 cột), 44-47 (Giá ĐX 4 cột) - khác nhau mỗi dòng
 */
function performMerge(sheet, startRow, numRows, firstRowData) {
  var columnsToMerge = [
    1, 2, 3, 4,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    37, 38, 39, 40, 41, 42, 43,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
    58, 59, 60, 61, 62, 63, 64, 65
  ];
  columnsToMerge.forEach(function(col) {
    try {
      var cellRange = sheet.getRange(startRow, col, numRows, 1);
      cellRange.mergeVertically();
      if (cellRange.getValue() === '' || cellRange.getValue() === null) {
        cellRange.setValue(firstRowData[col - 1] || '');
      }
    } catch (mergeError) {
      Logger.log('Warning: Merge col ' + col + ' - ' + mergeError.toString());
    }
  });
  sheet.getRange(startRow, 1, startRow + numRows - 1, 65).setVerticalAlignment('middle');
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
  var dummyData = Array(65).fill('Test Value');
  dummyData[0] = new Date().toLocaleString('vi-VN');
  dummyData[1] = 'Test Customer';
  dummyData[2] = '0123456789';
  dummyData[3] = 'Test Address';
  dummyData[4] = '0-1000';
  dummyData[5] = '100'; dummyData[6] = '200'; dummyData[7] = '300'; dummyData[8] = '400';
  dummyData[9] = '1000';  // Tổng mỗi mốc
  dummyData[63] = 'Phê duyệt';
  dummyData[64] = 'Test ghi chú';

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
