# 🚀 Hướng dẫn đưa AgriMart Shop lên Google Play Store

## 📋 Checklist trước khi bắt đầu

- [ ] Đã có tài khoản Google Play Console (Phí $25 một lần)
- [ ] Đã chuẩn bị icon app (512x512px, PNG)
- [ ] Đã chuẩn bị feature graphic (1024x500px)
- [ ] Đã chuẩn bị screenshots (ít nhất 2 ảnh)
- [ ] Đã có mô tả app (tiếng Việt và tiếng Anh)
- [ ] Đã test kỹ app trên thiết bị thật

---

## 🔧 Bước 1: Cài đặt EAS CLI (Expo Application Services)

EAS là dịch vụ build và deploy app của Expo.

```powershell
# Cài đặt EAS CLI globally
npm install -g eas-cli

# Đăng nhập vào Expo account (tạo tài khoản tại expo.dev nếu chưa có)
eas login
```

**Nếu chưa có tài khoản Expo:**
1. Truy cập: https://expo.dev/signup
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

---

## 🎨 Bước 2: Chuẩn bị Assets

### Icon App (1024x1024px)
- File hiện tại: `./assets/images/logoA.jpg`
- **Yêu cầu**: Icon phải là hình vuông 1024x1024px, PNG, không có alpha channel (hoặc có background)
- Tool tạo icon: https://makeappicon.com/ hoặc https://appicon.co/

### Feature Graphic (1024x500px)
- Banner lớn hiển thị trên Google Play Store
- Nên có logo + slogan của app
- Tool thiết kế: Canva, Figma, hoặc Photoshop

### Screenshots
- Ít nhất 2 ảnh, tối đa 8 ảnh
- Kích thước khuyến nghị: 1080x1920px (phone), 1920x1080px (tablet landscape)
- Chụp các màn hình chính: Login, Home, Farm Detail, Profile, etc.

### Video (Optional)
- YouTube link demo app
- Thời lượng 30s - 2 phút

---

## ⚙️ Bước 3: Cấu hình EAS Build

### 3.1. Khởi tạo EAS

```powershell
cd D:\CP2025

# Khởi tạo EAS project
eas build:configure
```

Lệnh này sẽ:
- Tạo file `eas.json`
- Liên kết project với Expo account
- Tạo project ID

### 3.2. Cấu hình build profile

File `eas.json` sẽ được tạo tự động. Cập nhật nó như sau:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 🔑 Bước 4: Tạo Keystore (Android Signing Key)

### Option 1: Để Expo quản lý (Khuyến nghị cho người mới)

```powershell
# Build app - Expo sẽ tự động tạo và quản lý keystore
eas build --platform android --profile production
```

### Option 2: Tự quản lý keystore

```powershell
# Tạo keystore
keytool -genkeypair -v -storetype PKCS12 -keystore agrimart-release.keystore -alias agrimart-key -keyalg RSA -keysize 2048 -validity 10000

# Lưu thông tin này an toàn:
# - Keystore password
# - Key alias: agrimart-key
# - Key password
```

**⚠️ Quan trọng**: Backup keystore file an toàn! Nếu mất keystore, bạn không thể update app nữa.

---

## 🏗️ Bước 5: Build App Bundle (AAB)

### 5.1. Build lần đầu

```powershell
# Build production app bundle
eas build --platform android --profile production
```

Quá trình build sẽ:
- Chạy trên cloud của Expo (miễn phí với giới hạn)
- Mất khoảng 10-20 phút
- Tạo file `.aab` (Android App Bundle)

### 5.2. Theo dõi tiến trình build

- Truy cập: https://expo.dev/accounts/[your-username]/projects/agrimart-shop/builds
- Hoặc xem trong terminal

### 5.3. Download file AAB

Sau khi build xong:
```powershell
# Download về máy
eas build:download --platform android --profile production
```

Hoặc download từ Expo dashboard.

---

## 📱 Bước 6: Tạo ứng dụng trên Google Play Console

### 6.1. Đăng ký Google Play Developer

1. Truy cập: https://play.google.com/console/signup
2. Đăng nhập bằng Google Account
3. Thanh toán phí đăng ký $25 (một lần duy nhất)
4. Hoàn thành thông tin developer

### 6.2. Tạo app mới

1. Vào **Google Play Console**: https://play.google.com/console
2. Click **"Create app"**
3. Điền thông tin:
   - **App name**: AgriMart Shop
   - **Default language**: Tiếng Việt (hoặc English)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Đồng ý các điều khoản

---

## 📝 Bước 7: Hoàn thiện thông tin app

### 7.1. Store listing (Thông tin hiển thị)

**App details:**
- **App name**: AgriMart Shop
- **Short description** (80 ký tự):
  ```
  Ứng dụng quản lý nông trại thông minh, kết nối nông dân với thị trường
  ```

- **Full description** (4000 ký tự):
  ```
  AgriMart Shop - Nền tảng quản lý nông trại thông minh

  ✨ TÍNH NĂNG NỔI BẬT:
  
  🌾 Quản lý trang trại
  - Theo dõi thông tin trang trại chi tiết
  - Cập nhật hình ảnh và trạng thái
  - Quản lý nhiều vùng canh tác
  
  🌱 Quản lý vườn cây
  - Ghi nhận thông tin giống cây
  - Theo dõi chu kỳ trồng trọt
  - Lịch sử chăm sóc và phát triển
  
  📊 Quản lý thu hoạch
  - Ghi nhận sản lượng thu hoạch
  - Theo dõi chất lượng sản phẩm
  - Lịch sử thu hoạch
  
  👤 Quản lý hồ sơ
  - Cập nhật thông tin cá nhân
  - Xác thực danh tính nông dân
  - Bảo mật thông tin
  
  🎯 LỢI ÍCH:
  - Giao diện thân thiện, dễ sử dụng
  - Đồng bộ dữ liệu real-time
  - Hỗ trợ tiếng Việt
  - Miễn phí sử dụng
  
  📞 HỖ TRỢ:
  Email: support@agrimart.com
  Website: https://agrimart.com
  
  Tải ngay AgriMart Shop để trải nghiệm cách quản lý nông trại hiện đại!
  ```

**App icon**: Upload logoA.jpg (512x512px PNG)

**Feature graphic**: Upload ảnh 1024x500px

**Screenshots**: Upload 2-8 ảnh màn hình app

**App category**: 
- Category: **Business** hoặc **Productivity**
- Tags: nông nghiệp, quản lý, trang trại

**Contact details**:
- Email: your-email@example.com
- Phone: +84 xxx xxx xxx
- Website: https://agrimart.com (nếu có)

**Privacy policy URL**: 
- **Bắt buộc** - Tạo privacy policy tại: https://app-privacy-policy-generator.firebaseapp.com/
- Host trên GitHub Pages hoặc website của bạn

### 7.2. Content rating (Phân loại nội dung)

1. Vào **Content rating**
2. Chọn **Start questionnaire**
3. Trả lời các câu hỏi:
   - App category: Other
   - Không có nội dung bạo lực, khiêu dâm, v.v.
4. Submit để nhận rating (thường là Everyone/3+)

### 7.3. Target audience (Đối tượng mục tiêu)

- **Age group**: 18+ (người lớn, nông dân)
- Không phải app dành cho trẻ em

### 7.4. App content

**Privacy policy**: Upload URL privacy policy

**App access**: 
- [ ] All functionality is available without special access
- [x] Some functionality requires account login
  - Giải thích: User cần đăng ký/đăng nhập để sử dụng tính năng quản lý trang trại

**Ads**:
- [ ] No, my app does not contain ads

**Data safety**:
- Khai báo dữ liệu thu thập:
  - User account info (email, name)
  - Location data (farm location)
  - Photos (farm images)
  - Files and documents

---

## 📦 Bước 8: Upload App Bundle lên Google Play

### 8.1. Tạo release mới

1. Vào **Production** > **Create new release**
2. Upload file `.aab` đã build
3. Điền thông tin release:

**Release name**: `1.0.0 (1)`

**Release notes** (Tiếng Việt):
```
Phiên bản đầu tiên của AgriMart Shop!

🎉 Tính năng:
- Quản lý thông tin trang trại
- Quản lý vườn cây trồng
- Ghi nhận thu hoạch
- Quản lý hồ sơ người dùng

Cảm ơn bạn đã sử dụng AgriMart Shop!
```

4. Click **Save** > **Review release**

### 8.2. Internal testing (Testing nội bộ)

Trước khi release công khai, nên test trước:

1. Vào **Internal testing**
2. Create new release
3. Upload AAB file
4. Thêm email testers
5. Share link test với testers
6. Thu thập feedback

### 8.3. Submit for review

1. Kiểm tra tất cả yêu cầu (icon, screenshots, privacy policy, etc.)
2. Click **Send for review**
3. Đợi Google review (1-7 ngày)

---

## 🔄 Bước 9: Update app (Phiên bản mới)

### 9.1. Tăng version

```javascript
// app.config.js
export default {
  expo: {
    version: "1.0.1", // Tăng version
    android: {
      versionCode: 2, // Tăng versionCode (bắt buộc)
      // ...
    }
  }
}
```

### 9.2. Build version mới

```powershell
eas build --platform android --profile production
```

### 9.3. Upload lên Google Play

1. Vào **Production** > **Create new release**
2. Upload AAB mới
3. Viết release notes
4. Submit for review

---

## 🚀 Bước 10: Tự động hóa với EAS Submit

Sau khi đã setup xong lần đầu:

### 10.1. Tạo Service Account Key

1. Vào Google Cloud Console
2. Tạo Service Account
3. Download JSON key file
4. Đặt tên: `google-service-account.json`
5. Thêm vào `.gitignore`

### 10.2. Auto submit

```powershell
# Build và tự động submit lên Google Play
eas build --platform android --profile production --auto-submit
```

---

## 📊 Bước 11: Theo dõi và phân tích

### Google Play Console Analytics

- **Statistics**: Lượt download, rating
- **Crash reports**: Lỗi app
- **ANRs**: App not responding
- **User reviews**: Đánh giá của user

### Cập nhật thường xuyên

- Sửa bugs
- Thêm tính năng mới
- Cải thiện performance
- Phản hồi reviews của users

---

## ✅ Checklist hoàn chỉnh

- [ ] Cài đặt EAS CLI
- [ ] Đăng nhập Expo account
- [ ] Cập nhật app.config.js
- [ ] Chuẩn bị assets (icon, screenshots, feature graphic)
- [ ] Viết privacy policy
- [ ] Build app với `eas build`
- [ ] Đăng ký Google Play Developer ($25)
- [ ] Tạo app trên Google Play Console
- [ ] Hoàn thiện store listing
- [ ] Hoàn thiện content rating
- [ ] Upload app bundle
- [ ] Submit for review
- [ ] Đợi approval (1-7 ngày)
- [ ] Publish app!

---

## 🆘 Troubleshooting

### Lỗi build thất bại
```powershell
# Xem logs chi tiết
eas build:list
eas build:view [build-id]
```

### Lỗi upload AAB
- Kiểm tra versionCode phải lớn hơn version trước
- Kiểm tra package name không trùng với app khác
- Kiểm tra keystore signature

### App bị reject
- Đọc kỹ email từ Google
- Sửa theo yêu cầu
- Submit lại

---

## 📚 Tài liệu tham khảo

- **Expo Docs**: https://docs.expo.dev/submit/android/
- **Google Play Console**: https://support.google.com/googleplay/android-developer
- **EAS Build**: https://docs.expo.dev/build/introduction/

---

## 💡 Tips

1. **Test kỹ trước khi submit**: Dùng internal testing
2. **Backup keystore**: Rất quan trọng!
3. **Viết release notes rõ ràng**: Giúp users biết có gì mới
4. **Phản hồi reviews**: Tạo niềm tin với users
5. **Monitor crashes**: Sửa bugs nhanh chóng
6. **Update thường xuyên**: Giữ app luôn mới

---

🎉 **Chúc bạn thành công với AgriMart Shop trên Google Play Store!**
