# 🚀 Hướng dẫn đưa AgriMart Shop lên CH Play và Setup Auto-Deploy

## 📋 PHẦN 1: ĐƯA APP LÊN CH PLAY (GOOGLE PLAY STORE)

### 🔧 Bước 1: Build Production AAB

```powershell
eas build --platform android --profile production
```

- Đợi 15-20 phút
- Download file `.aab` sau khi build xong
- Link download: https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds

---

### 💳 Bước 2: Đăng ký Google Play Developer Account

1. **Truy cập**: https://play.google.com/console/signup
2. **Đăng nhập** bằng Google Account
3. **Thanh toán $25 USD** (phí đăng ký một lần, trọn đời)
4. **Hoàn thành** thông tin developer (tên, địa chỉ, email)

**⏰ Thời gian xử lý**: Ngay lập tức sau khi thanh toán

---

### 📱 Bước 3: Tạo App mới trên Google Play Console

1. **Vào**: https://play.google.com/console
2. **Click**: "Create app"
3. **Điền thông tin**:
   - **App name**: `AgriMart Shop`
   - **Default language**: `Tiếng Việt` (Vietnamese)
   - **App or game**: `App`
   - **Free or paid**: `Free`
   - **Check** các điều khoản và policies
4. **Click**: "Create app"

---

### 📝 Bước 4: Hoàn thiện Store Listing

#### 4.1. App details (Thông tin cơ bản)

**Short description** (80 ký tự):
```
Quản lý nông trại thông minh - Kết nối nông dân với thị trường
```

**Full description** (4000 ký tự):
```
🌾 AGRIMART SHOP - NỀN TẢNG QUẢN LÝ NÔNG TRẠI THÔNG MINH

Ứng dụng quản lý trang trại toàn diện dành cho nông dân Việt Nam

✨ TÍNH NĂNG NỔI BẬT:

🌱 Quản lý trang trại
• Theo dõi thông tin trang trại chi tiết
• Cập nhật hình ảnh và trạng thái real-time
• Quản lý nhiều vùng canh tác
• Lưu trữ thông tin trang trại trên cloud

🍎 Quản lý vườn cây
• Ghi nhận thông tin giống cây (mãng cầu xiêm)
• Theo dõi chu kỳ trồng trọt
• Lịch sử chăm sóc và phát triển
• Tính toán diện tích và số lượng cây

📊 Quản lý thu hoạch
• Ghi nhận sản lượng thu hoạch
• Theo dõi chất lượng sản phẩm
• Lịch sử thu hoạch chi tiết
• Thống kê năng suất

👤 Quản lý hồ sơ
• Cập nhật thông tin cá nhân
• Xác thực danh tính nông dân
• Bảo mật thông tin cao
• Đồng bộ dữ liệu đa thiết bị

🎯 LỢI ÍCH:
✓ Giao diện thân thiện, dễ sử dụng
✓ Đồng bộ dữ liệu real-time
✓ Hỗ trợ tiếng Việt 100%
✓ Miễn phí sử dụng
✓ Không quảng cáo
✓ Bảo mật thông tin người dùng

📞 HỖ TRỢ KHÁCH HÀNG:
Email: support@agrimart.com
Hotline: 1900-xxxx (8:00 - 22:00)
Website: https://agrimart.com

💚 Tải ngay AgriMart Shop để trải nghiệm quản lý nông trại hiện đại, 
chuyên nghiệp và hiệu quả!

#QuảnLýNôngTrại #NôngNghiệpThôngMinh #AgriMart #NôngDânViệtNam
```

#### 4.2. Graphics Assets

**Cần chuẩn bị:**

1. **App icon** (512x512px PNG):
   - Đã có: `./assets/images/logoA.jpg`
   - Convert sang PNG 512x512px tại: https://www.iloveimg.com/

2. **Feature graphic** (1024x500px PNG):
   - Banner lớn hiển thị đầu trang
   - Nên có: Logo + Slogan + Background đẹp
   - Tool thiết kế: Canva (https://canva.com)

3. **Screenshots** (Ít nhất 2, tối đa 8):
   - Kích thước: 1080x1920px (phone portrait)
   - Màn hình nên chụp:
     - Login/Register
     - Home screen
     - Farm detail
     - Crop management
     - Harvest management
     - Profile screen
   - Tool: Chụp từ điện thoại hoặc emulator

4. **Video (Optional)**:
   - YouTube demo video
   - Thời lượng: 30s - 2 phút

#### 4.3. Categorization

- **App category**: `Business` hoặc `Productivity`
- **Tags**: nông nghiệp, quản lý, trang trại, nông dân

#### 4.4. Contact details

```
Email: khanhtpse173570@gmail.com (hoặc email của bạn)
Phone: +84 xxx xxx xxx (optional)
Website: https://github.com/quochungg/agrimart-mobile (tạm thời)
```

#### 4.5. Privacy Policy URL

**⚠️ BẮT BUỘC** - Tạo privacy policy:

**Option 1: Dùng Generator (Nhanh)**
1. Truy cập: https://app-privacy-policy-generator.nisrulz.com/
2. Điền thông tin app
3. Generate và copy text
4. Paste vào file mới

**Option 2: Host trên GitHub Pages**
1. Tạo file `privacy-policy.html` trong repo
2. Enable GitHub Pages
3. URL: `https://quochungg.github.io/agrimart-mobile/privacy-policy.html`

---

### 🔒 Bước 5: Content Rating

1. Vào **Content rating**
2. Click **Start questionnaire**
3. **Trả lời các câu hỏi**:
   - App category: `Other`
   - Không có nội dung bạo lực: `No`
   - Không có nội dung khiêu dâm: `No`
   - Không có ngôn từ thô tục: `No`
   - Không có cờ bạc: `No`
   - Không có ma túy: `No`
4. **Submit** để nhận rating (thường là **Everyone/3+**)

---

### 🎯 Bước 6: Target Audience

1. **Age group**: `18+` (người lớn, nông dân)
2. **Not designed for children**: Yes
3. Save

---

### 📋 Bước 7: Data Safety

**Khai báo dữ liệu thu thập**:

**Data collected**:
- ✅ Personal info:
  - Name, Email, Phone number
  - User ID
- ✅ Location:
  - Approximate location (farm location)
- ✅ Photos and videos:
  - Farm images, Crop photos
- ✅ Files and docs:
  - User documents (ID verification)

**Data usage**:
- App functionality
- Account management
- Fraud prevention, security

**Data security**:
- ✅ Data is encrypted in transit
- ✅ Users can request deletion
- ✅ Data is not shared with third parties

---

### 📦 Bước 8: Upload App Bundle (AAB)

1. **Vào**: Production > Create new release
2. **Click**: "Upload" và chọn file `.aab` đã build
3. **Điền Release name**: `1.0.0 (1)`
4. **Release notes** (Tiếng Việt):

```
🎉 Phiên bản đầu tiên của AgriMart Shop!

✨ Tính năng:
• Quản lý thông tin trang trại
• Quản lý vườn cây trồng (mãng cầu xiêm)
• Ghi nhận và theo dõi thu hoạch
• Quản lý hồ sơ người dùng
• Xác thực danh tính

Cảm ơn bạn đã sử dụng AgriMart Shop! 🌾
```

5. **Click**: Save
6. **Click**: Review release
7. **Click**: Start rollout to Production

---

### ⏳ Bước 9: Đợi Google Review

- **Thời gian**: 1-7 ngày (thường 1-3 ngày)
- **Google sẽ kiểm tra**:
  - App có hoạt động đúng không
  - Tuân thủ policies
  - Không có nội dung vi phạm
- **Kết quả**: Nhận email thông báo
  - ✅ Approved → App lên CH Play
  - ❌ Rejected → Sửa theo yêu cầu và submit lại

---

## 🔄 PHẦN 2: SETUP AUTO-DEPLOY TỪ GITHUB

### 🎯 Mục tiêu:

Khi push code lên GitHub → Tự động build và deploy lên CH Play

---

### 📝 Bước 1: Tạo GitHub Actions Workflow

Tạo file `.github/workflows/eas-build.yml`:

```yaml
name: EAS Build and Deploy

on:
  push:
    branches:
      - main  # Trigger khi push vào main
    tags:
      - 'v*'  # Hoặc khi tạo tag (v1.0.1, v1.0.2)

jobs:
  build:
    name: Build and Submit to Play Store
    runs-on: ubuntu-latest
    
    steps:
      - name: 🏗 Checkout repository
        uses: actions/checkout@v3

      - name: 🏗 Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: npm

      - name: 🏗 Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🚀 Build Android Production
        run: |
          eas build --platform android --profile production --non-interactive --no-wait

      # Optional: Auto submit to Play Store
      # - name: 📱 Submit to Play Store
      #   run: |
      #     eas submit --platform android --latest --non-interactive
```

---

### 🔑 Bước 2: Tạo Expo Access Token

1. **Truy cập**: https://expo.dev/accounts/khanhtpse173570/settings/access-tokens
2. **Click**: "Create token"
3. **Name**: `GitHub Actions`
4. **Copy** token (chỉ hiện 1 lần!)
5. **Lưu lại** ở nơi an toàn

---

### 🔐 Bước 3: Thêm Secrets vào GitHub

1. **Vào repo**: https://github.com/quochungg/agrimart-mobile
2. **Settings** > **Secrets and variables** > **Actions**
3. **Click**: "New repository secret"
4. **Thêm**:
   - Name: `EXPO_TOKEN`
   - Value: [paste token từ bước 2]
5. **Click**: "Add secret"

---

### 🔧 Bước 4: Cấu hình Auto Submit (Optional)

Để tự động submit lên Play Store, cần Service Account Key:

#### 4.1. Tạo Service Account trên Google Cloud

1. **Truy cập**: https://console.cloud.google.com/
2. **Tạo project mới** (nếu chưa có)
3. **Enable** Google Play Android Developer API
4. **Tạo Service Account**:
   - IAM & Admin > Service Accounts > Create
   - Name: `github-actions-deploy`
5. **Tạo Key**:
   - Click vào Service Account
   - Keys > Add Key > Create new key
   - Type: JSON
   - Download file JSON

#### 4.2. Grant quyền trên Play Console

1. **Vào**: https://play.google.com/console
2. **Settings** > **API access**
3. **Link** Service Account vừa tạo
4. **Grant access**:
   - Releases: View app information, Manage production releases
   - App access: View app information

#### 4.3. Thêm vào GitHub Secrets

1. Copy nội dung file JSON
2. Thêm secret mới:
   - Name: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: [paste JSON content]

#### 4.4. Cập nhật workflow

Uncomment dòng submit trong `.github/workflows/eas-build.yml`:

```yaml
- name: 📱 Submit to Play Store
  run: |
    eas submit --platform android --latest --non-interactive
  env:
    GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
```

---

### 📌 Bước 5: Tạo cấu trúc thư mục

```powershell
mkdir -p .github/workflows
```

Tạo file workflow theo hướng dẫn trên.

---

### 🚀 Bước 6: Test Auto-Deploy

#### Option 1: Push code

```powershell
git add .
git commit -m "feat: update app version"
git push origin main
```

#### Option 2: Tạo tag (version mới)

```powershell
# Tăng version trong app.config.js trước
# version: "1.0.1", versionCode: 2

git add .
git commit -m "release: v1.0.1"
git tag v1.0.1
git push origin v1.0.1
```

---

### 📊 Bước 7: Theo dõi Build

1. **GitHub**: Actions tab để xem workflow
2. **Expo**: https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds
3. **Play Console**: Releases để xem status

---

## 🔄 QUY TRÌNH UPDATE APP

### Khi muốn update app:

1. **Sửa code**
2. **Tăng version** trong `app.config.js`:
   ```javascript
   version: "1.0.1", // Tăng version number
   android: {
     versionCode: 2, // Tăng version code (BẮT BUỘC)
   }
   ```
3. **Commit và push**:
   ```powershell
   git add .
   git commit -m "release: v1.0.1 - Fix bugs"
   git tag v1.0.1
   git push origin main
   git push origin v1.0.1
   ```
4. **GitHub Actions tự động**:
   - ✅ Build AAB mới
   - ✅ Submit lên Play Store (nếu đã setup)
5. **Hoặc submit thủ công**:
   ```powershell
   eas submit --platform android --latest
   ```

---

## ✅ CHECKLIST HOÀN CHỈNH

### Lần đầu (Manual):
- [ ] Build production AAB
- [ ] Đăng ký Google Play Developer ($25)
- [ ] Tạo app trên Play Console
- [ ] Upload AAB
- [ ] Hoàn thiện store listing
- [ ] Submit for review
- [ ] Đợi approval

### Setup Auto-Deploy:
- [ ] Tạo `.github/workflows/eas-build.yml`
- [ ] Tạo Expo Access Token
- [ ] Thêm `EXPO_TOKEN` vào GitHub Secrets
- [ ] (Optional) Setup Service Account cho auto-submit
- [ ] Test workflow bằng cách push code

### Update app lần sau:
- [ ] Sửa code
- [ ] Tăng version và versionCode
- [ ] Push code hoặc tạo tag
- [ ] GitHub Actions tự động build
- [ ] Submit lên Play Store (auto hoặc manual)

---

## 🆘 TROUBLESHOOTING

### Build thất bại?
```powershell
# Xem logs chi tiết
eas build:list
```

### GitHub Actions failed?
- Check Secrets có đúng không
- Check EXPO_TOKEN còn valid không
- Xem logs trong Actions tab

### Submit failed?
- Check versionCode phải lớn hơn version trước
- Check Service Account key còn valid không

---

## 📚 TÀI LIỆU THAM KHẢO

- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/android/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Play Console**: https://support.google.com/googleplay/android-developer

---

## 💡 TIPS

1. **Backup keystore**: EAS tự động backup trên cloud
2. **Test kỹ APK preview** trước khi build production
3. **Viết release notes rõ ràng** cho mỗi version
4. **Monitor crashes** trên Play Console
5. **Phản hồi user reviews** nhanh chóng
6. **Update thường xuyên** (1-2 tuần/lần)

---

🎉 **Chúc bạn thành công với AgriMart Shop!**
