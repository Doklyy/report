# 🔧 Sửa Lỗi 404 - Kích Hoạt GitHub Pages

## ❌ Vấn đề: Lỗi 404 "There isn't a GitHub Pages site here"

Điều này có nghĩa là **GitHub Pages chưa được kích hoạt** hoặc chưa được cấu hình đúng.

---

## ✅ GIẢI PHÁP: Kích Hoạt GitHub Pages

### Bước 1: Kiểm tra Code đã Push chưa

1. Truy cập: https://github.com/Doklyy/report
2. Kiểm tra xem có file `index.html` trong repository chưa
3. Nếu chưa có, cần push code lên GitHub

**Nếu chưa push code:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Bước 2: Kích Hoạt GitHub Pages

1. **Truy cập repository:**
   ```
   https://github.com/Doklyy/report
   ```

2. **Vào Settings:**
   - Click vào tab **"Settings"** ở menu trên cùng
   - (Nếu không thấy Settings, đảm bảo bạn là owner của repository)

3. **Tìm phần Pages:**
   - Scroll xuống phần **"Pages"** ở menu bên trái
   - Hoặc scroll xuống dưới trang Settings

4. **Cấu hình Source:**
   - Ở phần **"Source"**, click vào dropdown
   - Chọn:
     - **Branch:** `main`
     - **Folder:** `/ (root)` hoặc `/docs` (nếu dùng docs folder)
   - **Chọn `/ (root)`** nếu file `index.html` ở root

5. **Save:**
   - Click nút **"Save"**

6. **Đợi:**
   - GitHub sẽ hiển thị thông báo: "Your site is ready to be published..."
   - Đợi 1-2 phút để GitHub build website

7. **Kiểm tra URL:**
   - Sau khi save, GitHub sẽ hiển thị URL:
     ```
     https://doklyy.github.io/report/
     ```
   - Click vào link này hoặc đợi vài phút rồi refresh

---

## 🔍 KIỂM TRA CÁC VẤN ĐỀ KHÁC

### Vấn đề 1: Không thấy Settings

**Nguyên nhân:** Bạn không phải owner của repository

**Giải pháp:**
- Đảm bảo bạn đã đăng nhập đúng tài khoản GitHub
- Kiểm tra repository có thuộc về bạn không

### Vấn đề 2: Không có branch `main`

**Kiểm tra:**
```bash
git branch
```

**Nếu thấy `master` thay vì `main`:**
```bash
git branch -M main
git push origin main
```

Sau đó trong Settings → Pages, chọn branch `main`

### Vấn đề 3: File index.html không ở root

**Kiểm tra cấu trúc:**
- File `index.html` phải ở thư mục gốc của repository
- Không được ở trong thư mục con

**Cấu trúc đúng:**
```
report/
  ├── index.html
  ├── script.js
  ├── style.css
  └── ...
```

**Cấu trúc sai:**
```
report/
  └── web/
      ├── index.html
      └── ...
```

### Vấn đề 4: Đã kích hoạt nhưng vẫn 404

**Giải pháp:**
1. **Đợi thêm vài phút** - GitHub có thể mất 5-10 phút để build
2. **Clear cache trình duyệt:**
   - Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
   - Hoặc mở chế độ ẩn danh (Incognito)
3. **Kiểm tra Actions:**
   - Vào tab **"Actions"** trong repository
   - Xem có workflow nào đang chạy không
   - Nếu có lỗi, xem log để biết nguyên nhân

---

## 📋 CHECKLIST

- [ ] Code đã được push lên GitHub
- [ ] File `index.html` có trong repository
- [ ] Đã vào Settings → Pages
- [ ] Đã chọn branch `main`
- [ ] Đã chọn folder `/ (root)`
- [ ] Đã click Save
- [ ] Đã đợi 1-2 phút
- [ ] Đã thử refresh hoặc mở chế độ ẩn danh

---

## 🎯 CÁC BƯỚC CHI TIẾT (Hình ảnh mô tả)

### Bước 1: Vào Repository
```
https://github.com/Doklyy/report
```

### Bước 2: Click Settings
- Ở menu trên cùng, click tab **"Settings"**
- (Tab thứ 2 từ bên phải, sau Code, Issues, Pull requests)

### Bước 3: Tìm Pages
- Scroll xuống menu bên trái
- Tìm mục **"Pages"** (có thể ở cuối menu)
- Click vào **"Pages"**

### Bước 4: Cấu hình
- Ở phần **"Build and deployment"**
- **Source:** Chọn **"Deploy from a branch"**
- **Branch:** Chọn `main` và `/ (root)`
- Click **"Save"**

### Bước 5: Đợi và Kiểm tra
- Đợi 1-2 phút
- GitHub sẽ hiển thị URL: `https://doklyy.github.io/report/`
- Click vào link hoặc copy vào trình duyệt

---

## 🆘 NẾU VẪN KHÔNG ĐƯỢC

### Thử các cách sau:

1. **Kiểm tra Actions:**
   - Vào tab **"Actions"** trong repository
   - Xem có workflow nào failed không

2. **Tạo file `.nojekyll`:**
   ```bash
   # Tạo file trống
   touch .nojekyll
   git add .nojekyll
   git commit -m "Add .nojekyll"
   git push origin main
   ```

3. **Kiểm tra tên repository:**
   - Đảm bảo tên repository là `report` (chữ thường)
   - URL phải là: `doklyy.github.io/report/`

4. **Thử đổi tên repository:**
   - Nếu vẫn không được, thử đổi tên repository
   - Settings → General → Repository name
   - Đổi thành tên khác (ví dụ: `customer-report`)
   - URL mới sẽ là: `doklyy.github.io/customer-report/`

---

## ✅ SAU KHI SỬA XONG

Website sẽ hoạt động tại:
```
https://doklyy.github.io/report/
```

**Lưu ý:** 
- Có thể mất 5-10 phút để GitHub build website
- Thử refresh sau vài phút
- Nếu vẫn 404, kiểm tra lại các bước trên

---

**Chúc bạn thành công! 🎉**
