# 🔄 Đồng Bộ 2 Chiều: Website ↔ Google Sheets

## 📋 Tổng Quan

Bạn muốn:
- ✅ **Website → Sheets:** Gửi dữ liệu từ form về Google Sheets (ĐÃ CÓ)
- ✅ **Sheets → Website:** Hiển thị dữ liệu từ Google Sheets lên website (CẦN THÊM)

**GitHub chỉ là nơi lưu code, không phải database.** Để đồng bộ 2 chiều, cần dùng **Google Sheets API**.

---

## 🎯 GIẢI PHÁP: Sử dụng Google Apps Script

### Cách 1: Đọc dữ liệu qua Google Apps Script (Đơn giản nhất)

Tạo thêm function `doGet` trong Google Apps Script để đọc dữ liệu từ Sheets.

---

## 📝 BƯỚC 1: Cập Nhật Google Apps Script

### 1.1. Mở Google Apps Script
1. Vào Google Sheet của bạn
2. Extensions → Apps Script

### 1.2. Thêm Function doGet

Thêm code sau vào Google Apps Script (cùng file với `doPost`):

```javascript
// Function để đọc dữ liệu từ Sheets
function doGet(e) {
  try {
    // Mở spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Nếu sheet không tồn tại, trả về empty
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Sheet not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Lấy tất cả dữ liệu
    const data = sheet.getDataRange().getValues();
    
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
        headers: headers
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 1.3. Deploy lại Web App
1. Deploy → Manage deployments
2. Click vào biểu tượng ✏️ (Edit) của deployment hiện tại
3. Click "Deploy"
4. **Copy URL mới** (nếu có)

---

## 📝 BƯỚC 2: Thêm Code vào Website

### 2.1. Thêm Function đọc dữ liệu

Thêm vào file `script.js`:

```javascript
// Function để đọc dữ liệu từ Google Sheets
async function loadDataFromSheets() {
  try {
    // URL để đọc dữ liệu (cùng URL với doPost)
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=read');
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error loading data:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Function để hiển thị dữ liệu lên website
function displayData(data) {
  // Tạo bảng hiển thị dữ liệu
  const container = document.getElementById('dataDisplay');
  if (!container) {
    // Tạo container nếu chưa có
    const newContainer = document.createElement('div');
    newContainer.id = 'dataDisplay';
    newContainer.className = 'mt-8 p-4 bg-white rounded-lg shadow';
    document.querySelector('.container').appendChild(newContainer);
  }
  
  if (data.length === 0) {
    container.innerHTML = '<p class="text-gray-500">Chưa có dữ liệu</p>';
    return;
  }
  
  // Tạo bảng
  let html = '<h2 class="text-2xl font-bold mb-4">Dữ liệu đã gửi</h2>';
  html += '<div class="overflow-x-auto">';
  html += '<table class="w-full border-collapse border border-gray-300">';
  
  // Header
  html += '<thead><tr class="bg-green-500 text-white">';
  const headers = Object.keys(data[0]);
  headers.forEach(header => {
    html += `<th class="border border-gray-300 p-2">${header}</th>`;
  });
  html += '</tr></thead>';
  
  // Body
  html += '<tbody>';
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      html += `<td class="border border-gray-300 p-2">${row[header] || ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  html += '</table>';
  html += '</div>';
  
  container.innerHTML = html;
}

// Load dữ liệu khi trang load
document.addEventListener('DOMContentLoaded', function() {
  // Load dữ liệu từ Sheets
  loadDataFromSheets().then(data => {
    displayData(data);
  });
});
```

### 2.2. Thêm nút Refresh (Tùy chọn)

Thêm vào HTML (sau form):

```html
<div id="dataDisplay" class="mt-8 p-4 bg-white rounded-lg shadow">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-2xl font-bold">Dữ liệu đã gửi</h2>
    <button onclick="refreshData()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
      🔄 Làm mới
    </button>
  </div>
  <p class="text-gray-500">Đang tải dữ liệu...</p>
</div>
```

Thêm function refresh:

```javascript
async function refreshData() {
  const container = document.getElementById('dataDisplay');
  container.innerHTML = '<p class="text-gray-500">Đang tải dữ liệu...</p>';
  
  const data = await loadDataFromSheets();
  displayData(data);
}
```

---

## 🔄 CÁCH 2: Đồng Bộ Tự Động (Nâng cao)

### Sử dụng Google Sheets API trực tiếp

Cần:
1. Tạo Google Cloud Project
2. Enable Google Sheets API
3. Tạo API Key hoặc OAuth
4. Sử dụng API để đọc/ghi dữ liệu

**Phức tạp hơn nhưng linh hoạt hơn.**

---

## 📊 CẤU TRÚC DỮ LIỆU

### Dữ liệu từ Sheets sẽ có dạng:

```json
{
  "success": true,
  "data": [
    {
      "Thời gian": "26/01/2025 10:30",
      "Tên KH/Tên shop": "ABC Shop",
      "Điện thoại": "0123456789",
      ...
    },
    {
      "Thời gian": "26/01/2025 11:00",
      "Tên KH/Tên shop": "XYZ Store",
      ...
    }
  ],
  "headers": ["Thời gian", "Tên KH/Tên shop", ...]
}
```

---

## ✅ CHECKLIST

- [ ] Đã thêm function `doGet` vào Google Apps Script
- [ ] Đã deploy lại Web App
- [ ] Đã thêm function `loadDataFromSheets()` vào script.js
- [ ] Đã thêm function `displayData()` vào script.js
- [ ] Đã thêm container hiển thị dữ liệu vào HTML
- [ ] Đã test đọc dữ liệu từ Sheets
- [ ] Đã test hiển thị dữ liệu trên website

---

## 🎯 TÓM TẮT

**GitHub chỉ lưu code, không phải database.**

Để đồng bộ 2 chiều:
1. ✅ **Website → Sheets:** Dùng `doPost` (ĐÃ CÓ)
2. ✅ **Sheets → Website:** Dùng `doGet` (CẦN THÊM)

**Cách làm:**
- Thêm `doGet` vào Google Apps Script
- Thêm function đọc dữ liệu vào website
- Hiển thị dữ liệu trên website

---

## 💡 LƯU Ý

1. **Bảo mật:** 
   - URL Google Apps Script có thể public
   - Có thể thêm authentication nếu cần

2. **Hiệu năng:**
   - Nếu có nhiều dữ liệu, nên thêm pagination
   - Cache dữ liệu để giảm số lần gọi API

3. **Real-time:**
   - Để cập nhật real-time, cần polling (gọi API định kỳ)
   - Hoặc dùng WebSocket (phức tạp hơn)

---

**Bạn muốn tôi tạo code cụ thể cho website của bạn không?** 🚀
