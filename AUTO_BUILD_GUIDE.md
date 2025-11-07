# 🚀 Auto-Build Setup Guide

## 📝 Đã setup xong!

Mỗi khi bạn push code lên GitHub, hệ thống sẽ **tự động build APK** cho bạn!

---

## 🔄 Cách hoạt động

### 1️⃣ **Push code thường (development)**
```bash
git add .
git commit -m "fix: sửa bug xyz"
git push origin PhuongKhanh
```
**➡️ Kết quả**: Tự động build **APK Preview** (để test)

### 2️⃣ **Release version mới (production)**
```bash
# 1. Tăng version trong app.config.js
# version: "1.0.1"
# versionCode: 2

# 2. Commit và tạo tag
git add .
git commit -m "release: v1.0.1"
git tag v1.0.1
git push origin PhuongKhanh
git push origin v1.0.1
```
**➡️ Kết quả**: 
- Tự động build **APK Preview** 
- Tự động build **AAB Production** (để lên Play Store)

---

## 📱 Xem tiến trình build

Sau khi push code:
1. Vào: https://github.com/quochungg/agrimart-mobile/actions
2. Xem workflow đang chạy
3. Hoặc xem tại: https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds

**Thời gian build**: ~15-20 phút

---

## 📥 Download APK sau khi build xong

**Cách 1: Từ Expo**
1. Vào: https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds
2. Chọn build mới nhất
3. Click "Download"

**Cách 2: Tạo GitHub Release (Khuyến nghị)**
1. Download APK từ Expo
2. Vào: https://github.com/quochungg/agrimart-mobile/releases
3. Create new release
4. Upload APK
5. Share link với mọi người!

---

## 🎯 Workflow Triggers

| Hành động | Build APK? | Build AAB? |
|-----------|------------|------------|
| Push code bình thường | ✅ Yes | ❌ No |
| Push với tag (v1.0.0) | ✅ Yes | ✅ Yes |
| Chạy thủ công (Actions) | ✅ Yes | ❌ No |

---

## 🔧 Manual Trigger

Nếu muốn chạy build thủ công (không cần push code):
1. Vào: https://github.com/quochungg/agrimart-mobile/actions
2. Chọn workflow "Auto Build Android App"
3. Click "Run workflow"
4. Chọn branch
5. Click "Run workflow"

---

## ⚙️ Cấu hình

### Thay đổi trigger branches

Sửa file `.github/workflows/eas-build.yml`:
```yaml
on:
  push:
    branches:
      - main
      - PhuongKhanh
      - develop  # Thêm branch khác
```

### Build profile khác

- **Preview**: APK để test
- **Production**: AAB để lên Play Store
- **Development**: Build debug (nhanh hơn)

---

## 📊 Build Status Badge

Thêm vào README.md:
```markdown
![Build Status](https://github.com/quochungg/agrimart-mobile/actions/workflows/eas-build.yml/badge.svg)
```

Kết quả: ![Build Status](https://github.com/quochungg/agrimart-mobile/actions/workflows/eas-build.yml/badge.svg)

---

## 🐛 Troubleshooting

### Build failed?
1. Check logs tại GitHub Actions
2. Xem lỗi tại Expo builds
3. Kiểm tra `EXPO_TOKEN` secret có đúng không

### Token expired?
1. Tạo token mới tại: https://expo.dev/accounts/khanhtpse173570/settings/access-tokens
2. Update GitHub Secret `EXPO_TOKEN`

---

## ✅ Checklist hoàn thành

- [x] Tạo Expo Access Token
- [x] Thêm `EXPO_TOKEN` vào GitHub Secrets
- [x] Tạo workflow file
- [ ] Push code để test
- [ ] Xem build chạy trên GitHub Actions
- [ ] Download APK từ Expo

---

## 🎉 Hoàn thành!

Giờ mỗi lần push code → Tự động build APK! 🚀

**Link theo dõi:**
- GitHub Actions: https://github.com/quochungg/agrimart-mobile/actions
- Expo Builds: https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds
