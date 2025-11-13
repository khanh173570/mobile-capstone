# Harvest Grade Detail Feature

## 📋 Tổng quan
Tính năng này cho phép nông dân quản lý đánh giá chất lượng (grade) của từng mùa vụ thu hoạch. Mỗi mùa vụ có thể có nhiều loại quả với các cấp độ chất lượng khác nhau.

## 🎯 Chức năng chính

### 1. **View Danh sách Harvest Grade Details**
- Xem tất cả các loại quả được đánh giá cho một mùa vụ
- Hiển thị số lượng và ngày tạo của mỗi loại quả
- Mỗi loại quả được bố cục với màu sắc khác nhau
- **Pull-to-refresh** để tải lại danh sách

### 2. **Tạo Harvest Grade Detail Mới**
- Chọn loại quả (1 = quả loại to, 2 = quả loại vừa, 3 = quả loại nhỏ)
- Nhập số lượng (kg) - bắt buộc phải > 0
- Unit mặc định là "kg"
- Validation kiểm tra input

### 3. **Cập nhật Harvest Grade Detail**
- Nhấn vào nút 3 chấm (⋮) trên mỗi card
- Chọn "Cập nhật"
- Thay đổi số lượng (loại quả không thể thay đổi)
- Lưu thay đổi

### 4. **Xóa Harvest Grade Detail**
- Nhấn vào nút 3 chấm (⋮) trên mỗi card
- Chọn "Xóa"
- Xác nhận xóa trong dialog
- Danh sách sẽ tự động cập nhật

### 5. **Navigation**
- Từ HarvestCard → nhấn nút "Xem đánh giá mùa vụ"
- Điều hướng đến trang chi tiết grade của mùa vụ

## 📁 Cấu trúc file

### Services
```
services/
  └── harvestGradeDetailService.ts  # API calls cho harvest grades
```

### Components
```
components/farmer/
  ├── HarvestGradeCard.tsx          # Component hiển thị 1 grade (với menu)
  ├── CreateGradeModal.tsx          # Modal tạo mới grade
  └── EditGradeModal.tsx            # Modal cập nhật grade
```

### Pages
```
app/pages/farmer/harvestGradeDetail/
  ├── _layout.tsx                   # Layout definition
  └── index.tsx                     # Trang chính grade details
```

## 🔌 API Endpoints

### 1. Tạo Grade Detail (POST)
```
POST /api/farm-service/harvestgradedetail
Headers: Authorization: Bearer {token}

Body:
{
  "grade": 1,           // 1 | 2 | 3
  "quantity": 350,      // Số > 0
  "unit": "kg",
  "harvestID": "uuid"
}

Response (201):
{
  "isSuccess": true,
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "grade": 1,
    "quantity": 350,
    "unit": "kg",
    "harvestID": "uuid",
    "createdAt": "2025-11-13T19:46:08...",
    "updatedAt": null
  }
}
```

### 2. Lấy danh sách Grade Details (GET)
```
GET /api/farm-service/harvest/{harvestId}/gradedetail
Headers: Authorization: Bearer {token}

Response (200):
{
  "isSuccess": true,
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "grade": 1,
      "quantity": 350,
      "unit": "kg",
      "harvestID": "uuid",
      "createdAt": "2025-11-13T19:46:08...",
      "updatedAt": null
    }
  ]
}
```

### 3. Cập nhật Grade Detail (PUT)
```
PUT /api/farm-service/harvestgradedetail/{gradeDetailId}
Headers: Authorization: Bearer {token}

Body:
{
  "grade": 1,           // 1 | 2 | 3
  "quantity": 10,       // Số > 0 (thay đổi)
  "unit": "kg",
  "harvestID": "uuid"
}

Response (200):
{
  "isSuccess": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "grade": 1,
    "quantity": 10,
    "unit": "kg",
    "harvestID": "uuid",
    "createdAt": "...",
    "updatedAt": "2025-11-13T20:00:00..."
  }
}
```

### 4. Xóa Grade Detail (DELETE)
```
DELETE /api/farm-service/harvestgradedetail/{gradeDetailId}
Headers: Authorization: Bearer {token}

Response (200):
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "HarvestGradeDetail deleted successfully!",
  "errors": null,
  "data": null
}
```

## 🎨 UI Components

### Grade Labels & Colors
- **Grade 1**: "Quả loại to" - Màu vàng (Amber)
- **Grade 2**: "Quả loại vừa" - Màu xanh (Indigo)  
- **Grade 3**: "Quả loại nhỏ" - Màu tím (Purple)

### Menu Items
- **Cập nhật** - Mở EditGradeModal
- **Xóa** - Xác nhận xóa (đỏ)

### Buttons
- **"Xem đánh giá mùa vụ"** - Blue button trong HarvestCard
- **"Tạo đánh giá mới"** - FAB hoặc button trong trang rỗng
- **⋮ (Menu)** - 3 chấm bên phải của HarvestGradeCard

## 🔄 Data Flow

```
HarvestCard
    ↓
  [Xem đánh giá mùa vụ] button
    ↓
HarvestGradeDetailPage
    ├─→ Fetch grades (getHarvestGradeDetails)
    ├─→ Display HarvestGradeCard list with menu
    │   ├─→ [⋮] → Cập nhật → EditGradeModal
    │   │        ↓
    │   │    updateHarvestGradeDetail()
    │   │        ↓
    │   │    Refresh list
    │   │
    │   └─→ [⋮] → Xóa → Confirm Dialog
    │             ↓
    │        deleteHarvestGradeDetail()
    │             ↓
    │        Refresh list
    │
    └─→ [+] FAB → CreateGradeModal
            ↓
        createHarvestGradeDetail()
            ↓
        Refresh list
```

## 📊 State Management

### HarvestGradeDetailPage State
- `grades` - Array<HarvestGradeDetail> - Danh sách grades
- `loading` - boolean - Loading state (chỉ lần đầu)
- `refreshing` - boolean - Pull-to-refresh state
- `showCreateModal` - boolean - Modal tạo visibility
- `showEditModal` - boolean - Modal cập nhật visibility
- `selectedGrade` - HarvestGradeDetail | null - Grade đang chỉnh sửa

## 🚀 Cách sử dụng

### 1. Xem danh sách grades
```typescript
// Tự động gọi khi trang load
useEffect(() => {
  fetchGrades();
}, [harvestId]);
```

### 2. Pull-to-refresh
```typescript
const onRefresh = async () => {
  setRefreshing(true);
  await fetchGrades();
  // setRefreshing(false) được gọi trong fetchGrades
};
```

### 3. Tạo grade mới
```typescript
const handleCreateSuccess = async () => {
  setShowCreateModal(false);
  await fetchGrades(); // Refresh list
};
```

### 4. Cập nhật grade
```typescript
const handleUpdateSuccess = async () => {
  setShowEditModal(false);
  setSelectedGrade(null);
  await fetchGrades();
};
```

### 5. Xóa grade
```typescript
const handleDeleteGrade = async (gradeId: string) => {
  // Hiển thị confirm dialog
  // Nếu xác nhận: deleteHarvestGradeDetail()
  // Refresh list
};
```

## 🐛 Debugging

### Log chính
- `getHarvestGradeDetails` - Log khi fetch grades
- `createHarvestGradeDetail` - Log khi tạo grade mới
- `updateHarvestGradeDetail` - Log khi cập nhật
- `deleteHarvestGradeDetail` - Log khi xóa

### Common Issues
1. **"Cannot find module"** - Kiểm tra đường dẫn import (sử dụng @/ alias)
2. **Route không hoạt động** - Kiểm tra `pages/_layout.tsx` có registered route không
3. **Validation error** - Kiểm tra grade selection và quantity > 0
4. **Refresh control không hiện** - Sử dụng FlatList/ScrollView đúng cách với refreshControl prop

## 📝 Validation Rules

### Grade Detail Creation/Update
- ✅ Grade: Bắt buộc chọn (1, 2, hoặc 3)
- ✅ Quantity: Bắt buộc nhập, phải > 0, phải là số
- ✅ Unit: Mặc định "kg"
- ✅ HarvestID: Lấy từ params

### Edit Modal
- ✅ Grade: Read-only (không thể thay đổi)
- ✅ Quantity: Có thể thay đổi
- ✅ Unit & HarvestID: Tự động từ dữ liệu hiện tại

## 🔐 Authentication
Tất cả API calls yêu cầu `Authorization: Bearer {token}` từ AsyncStorage

## 🎯 Features Completed
✅ Create harvest grade detail
✅ View list of harvest grade details  
✅ Update harvest grade detail (quantity only)
✅ Delete harvest grade detail
✅ Pull-to-refresh functionality
✅ Menu actions (edit/delete) on each card
✅ Proper loading and error states
✅ Form validation
