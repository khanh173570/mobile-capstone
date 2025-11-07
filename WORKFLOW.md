# 🔄 Quy trình làm việc (Workflow)

## 📝 Khi cập nhật code

### 1. Làm việc trên branch main
```bash
git checkout main
git pull origin main
```

### 2. Thực hiện thay đổi code
- Sửa file, thêm tính năng mới
- Test local: `npx expo start`

### 3. Commit và push lên main
```bash
git add .
git commit -m "feat: Mô tả thay đổi"
git push origin main
```

### 4. Tự động diễn ra:
✅ Code được push lên GitHub  
✅ Landing page (index.html) tự động deploy lên GitHub Pages  
✅ Link tải: https://khanh173570.github.io/mobile-capstone/ được cập nhật

---

## 📱 Khi build APK mới

### 1. Build với EAS
```bash
npx eas build --platform android --profile preview
```

### 2. Đợi build hoàn tất
- Truy cập: https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds
- Lấy link download APK mới

### 3. Cập nhật link trong landing page
Sửa file `download-app.html` và `index.html`:
```html
<a href="LINK_APK_MỚI" class="download-btn" target="_blank">
    📥 Tải APK (Android)
</a>
```

### 4. Tạo tag và release mới
```bash
# Tạo tag mới (ví dụ v1.0.1)
git tag -a v1.0.1 -m "AgriMart v1.0.1 - Mô tả cập nhật"
git push origin v1.0.1
```

### 5. Tạo GitHub Release
- Vào: https://github.com/khanh173570/mobile-capstone/releases/new
- Chọn tag vừa tạo (v1.0.1)
- Thêm release notes
- Thêm link APK mới
- Publish release

---

## 🚀 Tự động hóa (Tùy chọn)

### Setup EXPO_TOKEN cho auto-build

1. **Tạo token**
```bash
npx eas login
npx eas token:create
```

2. **Thêm vào GitHub Secrets**
- Vào: https://github.com/khanh173570/mobile-capstone/settings/secrets/actions/new
- Name: `EXPO_TOKEN`
- Value: (paste token)
- Nhấn **Add secret**

3. **Tạo workflow auto-build** (tùy chọn)
- Mỗi lần push tag mới → Tự động build APK
- Build xong → Tự động tạo GitHub Release

---

## 📋 Checklist khi release version mới

- [ ] Test app kỹ trên local
- [ ] Cập nhật version trong `app.json` và `package.json`
- [ ] Build APK mới với EAS
- [ ] Cập nhật link APK trong landing page
- [ ] Commit và push lên main
- [ ] Tạo tag mới (vX.Y.Z)
- [ ] Tạo GitHub Release với release notes
- [ ] Test link download từ landing page
- [ ] Thông báo cho users về version mới

---

## 🔗 Links quan trọng

- **Repo**: https://github.com/khanh173570/mobile-capstone
- **Landing Page**: https://khanh173570.github.io/mobile-capstone/
- **Releases**: https://github.com/khanh173570/mobile-capstone/releases
- **EAS Builds**: https://expo.dev/accounts/khanhtpse173570/projects/agrimart-shop/builds
- **GitHub Pages Settings**: https://github.com/khanh173570/mobile-capstone/settings/pages

---

**Branch chính**: `main` - Mọi thay đổi push lên main sẽ tự động deploy landing page
