# ⚠️ EXPO_TOKEN Setup Required!

## 🔍 **Vấn đề hiện tại:**

GitHub Actions đang báo lỗi:
```
❌ Context access might be invalid: EXPO_TOKEN
❌ The process '/usr/local/bin/yarn' failed with exit code 1
```

## 🛠️ **Cách fix:**

### 1. **Tạo EXPO_TOKEN:**
```bash
# Login vào Expo CLI
npx expo login

# Tạo access token
npx expo whoami --json
```

### 2. **Thêm vào GitHub Secrets:**
1. Vào GitHub repo: https://github.com/khanh173570/mobile-capstone
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
4. **Name:** `EXPO_TOKEN`
5. **Value:** [Token từ bước 1]

### 3. **Enable workflow:**
Sau khi thêm secret, workflow sẽ tự động hoạt động.

## 🎯 **Workflow hiện tại:**

- ❌ **EAS Auto Update:** Tạm disabled (thiếu EXPO_TOKEN)
- ✅ **Deploy GitHub Pages:** Hoạt động bình thường
- ❌ **Auto Build APK:** Tạm disabled (tránh conflicts)

## 📱 **Ảnh hưởng:**

- **✅ App vẫn hoạt động** bình thường
- **❌ Không có OTA updates** tự động
- **✅ Landing page** vẫn update bình thường

## 🚀 **Sau khi setup EXPO_TOKEN:**

```
Push code → EAS Update → App tự động cập nhật
```

**Landing page:** https://khanh173570.github.io/mobile-capstone/