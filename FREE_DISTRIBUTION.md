# 🎓 Hướng dẫn phân phối app MIỄN PHÍ cho Sinh viên

## 🎯 Mục đích
Hướng dẫn này dành cho sinh viên muốn phân phối app Android **MIỄN PHÍ** mà không cần trả phí $25 cho Google Play Developer.

---

## 📱 PHƯƠNG PHÁP 1: PHÂN PHỐI APK QUA GITHUB RELEASES (Khuyến nghị)

### ✅ Ưu điểm:
- **Hoàn toàn miễn phí**
- Chuyên nghiệp, dễ quản lý version
- Có tracking số lượng download
- Dễ share link

### 📝 Cách làm:

#### Bước 1: Build APK
```powershell
# APK đã có tại:
https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds
```

#### Bước 2: Tạo Release trên GitHub

1. **Vào repo**: https://github.com/quochungg/agrimart-mobile
2. **Click**: "Releases" (bên phải)
3. **Click**: "Create a new release"
4. **Điền thông tin**:
   - Tag version: `v1.0.0`
   - Release title: `AgriMart Shop v1.0.0 - First Release`
   - Description:
     ```markdown
     ## 🎉 Phiên bản đầu tiên của AgriMart Shop!
     
     ### ✨ Tính năng:
     - 🌾 Quản lý thông tin trang trại
     - 🌱 Quản lý vườn cây trồng
     - 📊 Ghi nhận thu hoạch
     - 👤 Quản lý hồ sơ người dùng
     
     ### 📥 Cài đặt:
     1. Download file APK bên dưới
     2. Cài đặt trên điện thoại Android
     3. Cho phép cài đặt từ nguồn không xác định
     
     ### 📱 Yêu cầu hệ thống:
     - Android 5.0 trở lên
     - Dung lượng: ~50MB
     
     ### 🐛 Báo lỗi:
     Vui lòng tạo Issue trên GitHub hoặc email: khanhtpse173570@gmail.com
     ```
5. **Upload APK**: Kéo thả file APK vào mục "Attach binaries"
6. **Click**: "Publish release"

#### Bước 3: Share link

Link tải app của bạn sẽ là:
```
https://github.com/quochungg/agrimart-mobile/releases/download/v1.0.0/agrimart-shop-v1.0.0.apk
```

---

## 📱 PHƯƠNG PHÁP 2: GITHUB PAGES + LANDING PAGE

### Bước 1: Enable GitHub Pages

1. **Vào**: Settings > Pages
2. **Source**: Deploy from a branch
3. **Branch**: `main` / `root`
4. **Save**

### Bước 2: Upload file

1. Copy file `download-app.html` vào root của repo
2. Đổi tên thành `index.html`
3. Sửa dòng này:
   ```html
   <a href="YOUR_APK_DOWNLOAD_LINK_HERE" ...>
   ```
   Thành:
   ```html
   <a href="https://github.com/quochungg/agrimart-mobile/releases/download/v1.0.0/agrimart-shop.apk" ...>
   ```

### Bước 3: Truy cập

Website của bạn sẽ có tại:
```
https://quochungg.github.io/agrimart-mobile/
```

---

## 📱 PHƯƠNG PHÁP 3: FIREBASE APP DISTRIBUTION (Miễn phí)

### ✅ Ưu điểm:
- Miễn phí
- Quản lý testers
- Tự động notify khi có version mới
- Analytics

### 📝 Cách làm:

#### Bước 1: Tạo Firebase Project

1. Truy cập: https://console.firebase.google.com/
2. Click "Add project"
3. Tên: `AgriMart Shop`
4. Disable Google Analytics (không cần)
5. Create project

#### Bước 2: Setup App Distribution

1. Vào: **Build** > **App Distribution**
2. Click: "Get started"
3. Upload file APK
4. **Release notes**: Viết mô tả phiên bản
5. **Testers**: Thêm email người test (giáo viên, bạn bè)
6. Click: "Distribute"

#### Bước 3: Share link

Firebase sẽ tạo link dạng:
```
https://appdistribution.firebase.dev/i/xxx
```

Người nhận sẽ:
- Nhận email invite
- Click link
- Download APK
- Tự động nhận thông báo khi có version mới

---

## 📱 PHƯƠNG PHÁP 4: GOOGLE DRIVE / DROPBOX

### Đơn giản nhất:

1. **Upload APK** lên Google Drive
2. **Share link** với quyền "Anyone with the link"
3. **Copy link** và share

**Nhược điểm**: 
- Không chuyên nghiệp
- Không tracking downloads
- Link dài và xấu

---

## 📱 PHƯƠNG PHÁP 5: APK DISTRIBUTION SERVICES (Miễn phí)

### Các dịch vụ miễn phí:

#### 1. **Appetize.io** (Demo trên web)
- Link: https://appetize.io/
- Cho phép demo app trên web browser
- Miễn phí 100 phút/tháng
- Tốt cho demo với giáo viên

#### 2. **Diawi** (Upload & Share APK)
- Link: https://www.diawi.com/
- Upload APK, nhận link ngắn
- Link hết hạn sau 1 ngày (free plan)

#### 3. **InstallOnAir**
- Link: https://www.installonair.com/
- Miễn phí
- Share APK qua QR code
- Link expire sau 30 ngày

---

## 🎓 KHUYẾN NGHỊ CHO ĐỒ ÁN SINH VIÊN

### **Phương án tốt nhất**:

1. ✅ **GitHub Releases** (chính thức, chuyên nghiệp)
2. ✅ **GitHub Pages** (tạo landing page đẹp)
3. ✅ **Firebase App Distribution** (cho nhóm test nhỏ)

### **Quy trình đề xuất**:

```
1. Build APK
   ↓
2. Upload lên GitHub Releases
   ↓
3. Tạo Landing Page trên GitHub Pages
   ↓
4. Share link với giáo viên/bạn bè
   ↓
5. Thêm link vào báo cáo đồ án
```

---

## 📝 THÊM VÀO BÁO CÁO ĐỒ ÁN

### Phần "Triển khai ứng dụng":

```
### 5.1. Phân phối ứng dụng

Do là đồ án sinh viên và hạn chế về ngân sách, ứng dụng được phân phối 
qua GitHub Releases thay vì Google Play Store.

**Link tải ứng dụng:**
https://github.com/quochungg/agrimart-mobile/releases

**Landing Page:**
https://quochungg.github.io/agrimart-mobile/

**Hướng dẫn cài đặt:**
1. Truy cập link trên từ điện thoại Android
2. Download file APK
3. Cài đặt và sử dụng

**Lý do không sử dụng Google Play Store:**
- Chi phí đăng ký: $25 USD
- Thời gian review: 1-7 ngày
- Không phù hợp cho đồ án demo

**Kế hoạch tương lai:**
Sau khi tốt nghiệp, dự án sẽ được phát triển thêm và đưa lên 
Google Play Store chính thức.
```

---

## ✅ CHECKLIST

- [ ] Build APK preview hoặc production
- [ ] Tạo GitHub Release
- [ ] Upload APK lên Release
- [ ] Tạo Landing Page (optional)
- [ ] Setup GitHub Pages (optional)
- [ ] Test download và cài đặt
- [ ] Share link với giáo viên
- [ ] Thêm vào báo cáo đồ án

---

## 🎯 KẾT LUẬN

**Không cần trả $25** vẫn có thể phân phối app chuyên nghiệp cho đồ án!

**Link sẽ có dạng**:
```
📱 Tải app: https://github.com/[username]/[repo]/releases
🌐 Website: https://[username].github.io/[repo]/
```

**Hoàn toàn miễn phí, chuyên nghiệp và đủ cho đồ án tốt nghiệp!** 🎓

---

## 💡 BONUS: Nếu sau này muốn lên CH Play

Khi đã có công việc và thu nhập:
1. Trả $25 cho Google Play Developer
2. Upload file AAB (không phải APK)
3. Submit lên Play Store
4. App sẽ có trên CH Play chính thức

**Tất cả code và setup đã sẵn sàng, chỉ cần submit!**
