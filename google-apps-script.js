function doPost(e) {
  try {
    // 1. Nhận & parse JSON từ web
    const jsonData = JSON.parse(e.postData.contents);
    const rowsData = jsonData.data;           // Mảng các row (mỗi mốc trọng lượng = 1 row)
    const mergeCells = jsonData.mergeCells !== false; // Mặc định = true

    // 2. Kiểm tra dữ liệu
    if (!rowsData || rowsData.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'No data provided',
          receivedData: rowsData
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Đảm bảo luôn là mảng 2 chiều [[...], [...]]
    const rowsToAppend = Array.isArray(rowsData[0]) ? rowsData : [rowsData];

    // 4. Mở file & sheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        'Thời gian', 'Tên KH/Tên shop', 'Điện thoại', 'Địa chỉ', 'Các mốc trọng lượng',
        'Tổng sản lượng các mốc', 'Tỷ trọng sản lượng', 'Tỷ trọng % theo khu vực',
        'Tỷ trọng hàng trên 1.2m', 'Tỷ trọng hàng nguyên khối từ 100kg trở lên',
        'Sản lượng Nội tỉnh', 'Sản lượng Nội miền', 'Sản lượng Cận miền', 'Sản lượng Liên miền',
        'Tổng sản lượng', 'Tỷ trọng %', 'Hàng thông thường', 'Chất lỏng', 'Dễ cháy', 'Dễ vỡ',
        'Ngành hàng', 'Tên sản phẩm', 'Đối thủ', 'Đối thủ khác', 'Giá đối thủ',
        'Đơn giá bình quân Nội tỉnh (ĐT)', 'Đơn giá bình quân Nội miền (ĐT)',
        'Đơn giá bình quân Cận miền (ĐT)', 'Đơn giá bình quân Liên miền (ĐT)',
        'Tỷ lệ hoàn hiện tại', 'Tỷ lệ hoàn đối thủ miễn phí', 'Chính sách đặc thù đối thủ',
        'Giá đề xuất', 'Đơn giá bình quân Nội tỉnh (ĐX)', 'Đơn giá bình quân Nội miền (ĐX)',
        'Đơn giá bình quân Cận miền (ĐX)', 'Đơn giá bình quân Liên miền (ĐX)',
        'Chính sách đặc thù đề xuất', 'Tỷ lệ hoàn đề xuất', 'So sánh đơn giá bình quân ',
        'Họ và tên người báo cáo', 'Điện thoại người báo cáo', 'Tên Bưu cục',
        'Chức danh', 'Chi nhánh', 'Mã Bưu cục'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }

    // 5. Chuyển tất cả value thành string (tránh Google tự format)
    const stringRowsData = rowsToAppend.map(row =>
      row.map(cell => (cell === null || cell === undefined) ? '' : String(cell))
    );

    const startRow = sheet.getLastRow() + 1;
    const numRows  = stringRowsData.length;
    const numCols  = stringRowsData[0].length;

    // 6. Ghi dữ liệu: mỗi row = 1 dòng, mỗi phần tử = 1 cột
    sheet.getRange(startRow, 1, numRows, numCols).setValues(stringRowsData);

    // 7. Gộp ô dọc cho các cột chung (trừ cột mốc trọng lượng & cột giá)
    if (numRows > 1 && mergeCells) {
      const mergeRanges = [
        { startCol: 1, endCol: 4 },   // Thời gian → Địa chỉ
        { startCol: 6, endCol: 22 },  // Tổng SL → Ngành hàng
        { startCol: 24, endCol: 32 }, // Đối thủ → Chính sách đặc thù đối thủ
        { startCol: 34, endCol: 46 }  // Đơn giá ĐX → Mã Bưu cục
      ];

      mergeRanges.forEach(range => {
        for (let col = range.startCol; col <= range.endCol; col++) {
          const r = sheet.getRange(startRow, col, numRows, 1);
          r.mergeVertically(); // Gộp DỌC, vẫn giữ nhiều dòng
        }
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Data saved successfully',
        startRow,
        numberOfRows: numRows
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
