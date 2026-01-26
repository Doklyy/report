# Hướng dẫn Deploy Website để Truy cập Công khai

Có nhiều cách để deploy website này để mọi người có thể truy cập. Dưới đây là các phương pháp phổ biến nhất:

## Phương pháp 1: GitHub Pages (Miễn phí, Dễ nhất)

### Bước 1: Tạo tài khoản GitHub
1. Truy cập [GitHub.com](https://github.com) và tạo tài khoản (nếu chưa có)

### Bước 2: Tạo Repository mới
1. Click vào dấu `+` ở góc trên bên phải → chọn "New repository"
2. Đặt tên repository (ví dụ: `customer-report-form`)
3. Chọn "Public"
4. **KHÔNG** tích vào "Initialize with README"
5. Click "Create repository"

### Bước 3: Upload files lên GitHub
1. Trong thư mục project của bạn, mở terminal/command prompt
2. Chạy các lệnh sau:

```bash
# Khởi tạo git (nếu chưa có)
git init

# Thêm tất cả files
git add .

# Commit
git commit -m "Initial commit"

# Thêm remote repository (thay YOUR_USERNAME và YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

### Bước 4: Kích hoạt GitHub Pages
1. Vào repository trên GitHub
2. Click vào tab **Settings**
3. Scroll xuống phần **Pages** (bên trái)
4. Ở phần **Source**, chọn branch `main` và folder `/ (root)`
5. Click **Save**
6. Đợi vài phút, GitHub sẽ cung cấp URL: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

**Lưu ý:** URL sẽ có dạng: `https://yourusername.github.io/customer-report-form/`

---

## Phương pháp 2: Netlify (Miễn phí, Tự động deploy)

### Bước 1: Chuẩn bị
1. Tạo tài khoản tại [Netlify.com](https://www.netlify.com)
2. Đảm bảo code đã được push lên GitHub (theo Phương pháp 1)

### Bước 2: Deploy
1. Đăng nhập vào Netlify
2. Click **"Add new site"** → **"Import an existing project"**
3. Chọn **GitHub** và authorize
4. Chọn repository của bạn
5. Cấu hình:
   - **Build command:** (để trống)
   - **Publish directory:** `/` hoặc để trống
6. Click **"Deploy site"**
7. Netlify sẽ tự động tạo URL: `https://random-name-123.netlify.app`

### Bước 3: Tùy chỉnh domain (Tùy chọn)
1. Vào **Site settings** → **Domain settings**
2. Click **"Add custom domain"** để thêm domain riêng (nếu có)

---

## Phương pháp 3: Vercel (Miễn phí, Nhanh)

### Bước 1: Chuẩn bị
1. Tạo tài khoản tại [Vercel.com](https://vercel.com)
2. Đảm bảo code đã được push lên GitHub

### Bước 2: Deploy
1. Đăng nhập vào Vercel
2. Click **"Add New Project"**
3. Import repository từ GitHub
4. Cấu hình:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
5. Click **"Deploy"**
6. Vercel sẽ tự động tạo URL: `https://your-project.vercel.app`

---

## Phương pháp 4: Surge.sh (Miễn phí, Đơn giản)

### Bước 1: Cài đặt Surge
```bash
npm install -g surge
```

### Bước 2: Deploy
```bash
# Trong thư mục project
surge

# Lần đầu tiên sẽ yêu cầu:
# - Email: nhập email của bạn
# - Password: tạo password
# - Domain: nhập domain (ví dụ: my-form.surge.sh) hoặc để trống để tự động tạo
```

**Lưu ý:** Surge sẽ tạo URL ngẫu nhiên nếu bạn không chỉ định domain.

---

## Phương pháp 5: Firebase Hosting (Miễn phí, Google)

### Bước 1: Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
```

### Bước 2: Đăng nhập
```bash
firebase login
```

### Bước 3: Khởi tạo project
```bash
# Trong thư mục project
firebase init hosting

# Chọn:
# - Use an existing project hoặc Create a new project
# - Public directory: . (dấu chấm)
# - Configure as single-page app: No
# - Set up automatic builds: No
```

### Bước 4: Deploy
```bash
firebase deploy
```

URL sẽ có dạng: `https://your-project-id.web.app`

---

## Cấu hình Google Sheets (Quan trọng!)

Sau khi deploy, bạn cần cấu hình Google Sheets:

1. Làm theo hướng dẫn trong file `README.md` để tạo Google Apps Script
2. Copy URL của Google Apps Script
3. Mở file `script.js` trên website đã deploy
4. Tìm dòng: `const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';`
5. Thay thế bằng URL thực tế
6. Commit và push lại lên GitHub (nếu dùng GitHub Pages)

**Lưu ý:** Nếu dùng GitHub Pages, bạn có thể:
- Sửa trực tiếp trên GitHub (Edit file)
- Hoặc sửa local và push lại

---

## So sánh các phương pháp

| Phương pháp | Độ khó | Tốc độ | Miễn phí | Tùy chỉnh domain |
|------------|--------|--------|----------|------------------|
| GitHub Pages | ⭐ Dễ | ⭐⭐⭐ Nhanh | ✅ Có | ✅ Có |
| Netlify | ⭐ Dễ | ⭐⭐⭐ Rất nhanh | ✅ Có | ✅ Có |
| Vercel | ⭐ Dễ | ⭐⭐⭐ Rất nhanh | ✅ Có | ✅ Có |
| Surge | ⭐⭐ Trung bình | ⭐⭐⭐ Nhanh | ✅ Có | ✅ Có |
| Firebase | ⭐⭐ Trung bình | ⭐⭐ Trung bình | ✅ Có | ✅ Có |

---

## Khuyến nghị

**Cho người mới bắt đầu:** GitHub Pages hoặc Netlify
- Dễ sử dụng
- Miễn phí
- Tự động deploy khi có thay đổi
- Hỗ trợ custom domain

**Cho người có kinh nghiệm:** Vercel hoặc Firebase
- Nhiều tính năng hơn
- Tích hợp tốt với các công cụ khác

---

## Lưu ý bảo mật

1. **KHÔNG** commit file chứa thông tin nhạy cảm
2. Google Apps Script URL có thể public (không sao)
3. Nếu cần bảo mật hơn, sử dụng environment variables

---

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Console của trình duyệt (F12)
2. Logs trên platform bạn sử dụng
3. Đảm bảo tất cả files đã được upload đúng
