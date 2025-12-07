# Cập Nhật Tính Năng Quản Lý Hợp Đồng Cọc Tiền - Chi Tiết Thực Hiện

## 📋 Tóm Tắt Thay Đổi

Đã hoàn tất cập nhật hệ thống quản lý hợp đồng cọc tiền với các tính năng chi tiết và giao diện riêng biệt cho nông dân và nhà bán buôn.

---

## 🎯 Những Gì Đã Thực Hiện

### 1. **Tạo Màn Hình Quản Lý Hợp Đồng Riêng Biệt**

#### **Nông Dân:**
- Đường dẫn: `app/(tabs)/farmer/escrow-contracts/`
  - `index.tsx` - Danh sách tất cả hợp đồng cọc
  - `_layout.tsx` - Header với tiêu đề "Quản lý hợp đồng"

**Tính năng:**
- Hiển thị danh sách hợp đồng cọc với EscrowContractCard
- Pull-to-refresh để cập nhật danh sách
- Loading state khi đang tải
- Empty state khi không có hợp đồng
- Click vào card → Mở modal chi tiết
- Tự động refresh danh sách khi quay lại từ màn hình khác

#### **Nhà Bán Buôn:**
- Đường dẫn: `app/(tabs)/wholesaler/escrow-contracts/`
  - `index.tsx` - Danh sách tất cả hợp đồng cọc
  - `_layout.tsx` - Header với tiêu đề "Quản lý hợp đồng"

**Tính năng:** Giống nông dân, nhưng hiển thị từ quan điểm của nhà bán buôn

---

### 2. **Cập Nhật Modal Chi Tiết Hợp Đồng**

**File:** `components/shared/EscrowDetailModal.tsx`

**Những cập nhật:**
- Thêm state để lưu thông tin auction, farmer, winner
- Thêm loading state cho dữ liệu chi tiết
- Fetch dữ liệu từ 3 API khi modal mở:
  - `getAuctionDetail(auctionId)` - Lấy thông tin đấu giá
  - `getUserById(farmerId)` - Lấy thông tin nông dân
  - `getUserById(winnerId)` - Lấy thông tin người mua

**Thông tin được hiển thị:**

**Phần Đấu Giá:**
- ID Đấu giá
- Mã phiên (sessionCode)
- Ghi chú
- Giá khởi điểm
- Giá hiện tại (highlight)
- Số lượng dự kiến
- Ngày thu hoạch dự kiến

**Phần Nông Dân:**
- Tên đầy đủ
- Email
- Số điện thoại
- Địa chỉ

**Phần Người Mua (Nhà Bán Buôn):**
- Tên đầy đủ
- Email
- Số điện thoại
- Địa chỉ

**Phần Hợp Đồng:**
- ID Hợp đồng
- ID Đấu giá
- Ngày tạo
- Ngày thanh toán (nếu có)

**Phần Tài Chính:**
- Tổng tiền (highlight)
- Phí dịch vụ
- Số tiền cọc
- Số tiền nông dân nhận / Nhà bán buôn thanh toán (highlight)

**Phần Giao Dịch:**
- Giao dịch thanh toán (hoặc "Chưa thanh toán")
- Giao dịch phát hành (hoặc "Chưa phát hành")

---

### 3. **Cập Nhật authService.ts**

**Thêm hàm mới:**
```typescript
export const getUserById = async (userId: string): Promise<User | null>
```

**Mục đích:**
- Lấy thông tin user theo ID
- Được dùng để fetch thông tin nông dân và người mua trong modal
- Trả về `null` nếu không lấy được dữ liệu

**Xử lý lỗi:**
- Log warning nếu không có token
- Log warning nếu lỗi khi fetch
- Trả về null thay vì throw error để không break UI

---

### 4. **Cập Nhật Farmer Profile**

**File:** `app/(tabs)/farmer/profile/index.tsx`

**Thay đổi:**
- Thêm nút "Hợp đồng cọc tiền" (màu purple #8B5CF6)
- Click nút → Navigate tới `/(tabs)/farmer/escrow-contracts/index`
- Nút được thêm vào mục "Escrow Contracts Section"
- Có icon Shield

**Các style:**
```typescript
escrowButton: {
  backgroundColor: '#8B5CF6',
  borderRadius: 12,
  paddingVertical: 14,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  marginTop: 8,
}
escrowButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '600',
}
```

---

### 5. **Cập Nhật Wholesaler Profile**

**File:** `app/(tabs)/wholesaler/profile/index.tsx`

**Thay đổi:**
- Thêm section "Hợp đồng cọc tiền" (sau phần Báo cáo)
- Thêm nút "Quản lý hợp đồng" (màu purple #8B5CF6)
- Click nút → Navigate tới `/(tabs)/wholesaler/escrow-contracts/index`
- Icon: Shield
- Thêm import Shield từ lucide-react-native

**Các style:**
```typescript
escrowButton: {
  backgroundColor: '#8B5CF6',
  borderRadius: 12,
  paddingVertical: 14,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
}
escrowButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '600',
}
```

---

## 🔄 Quy Trình Sử Dụng

### **Nông Dân:**
1. Vào Profile
2. Scroll xuống tìm "Hợp đồng cọc tiền"
3. Click nút "Hợp đồng cọc tiền"
4. Xem danh sách tất cả hợp đồng của mình
5. Click hợp đồng → Modal mở
6. Xem chi tiết đầy đủ:
   - Thông tin đấu giá
   - Thông tin người mua
   - Thông tin tài chính
7. Nếu sẵn sàng:
   - Click nút "Sẵn sàng thu hoạch"
   - Trạng thái thay đổi từ 0/1 → 2
   - Modal đóng, list cập nhật

### **Nhà Bán Buôn:**
1. Vào Profile
2. Scroll xuống tìm "Hợp đồng cọc tiền"
3. Click nút "Quản lý hợp đồng"
4. Xem danh sách tất cả hợp đồng của mình
5. Click hợp đồng → Modal mở
6. Xem chi tiết đầy đủ:
   - Thông tin đấu giá
   - Thông tin nông dân
   - Thông tin tài chính
7. Nếu trạng thái = 2 (Sẵn sàng thu hoạch):
   - Click nút "Thanh toán phần còn lại"
   - Mở browser với PayOS
   - Thanh toán qua QR code hoặc thẻ
   - Quay lại app → List cập nhật

---

## 📂 Cấu Trúc Tệp

```
app/
├── (tabs)/
│   ├── farmer/
│   │   ├── profile/
│   │   │   └── index.tsx (CẬP NHẬT: Thêm nút escrow)
│   │   └── escrow-contracts/
│   │       ├── _layout.tsx (MỚI)
│   │       └── index.tsx (MỚI)
│   └── wholesaler/
│       ├── profile/
│       │   └── index.tsx (CẬP NHẬT: Thêm section escrow)
│       └── escrow-contracts/
│           ├── _layout.tsx (MỚI)
│           └── index.tsx (MỚI)
components/
└── shared/
    └── EscrowDetailModal.tsx (CẬP NHẬT: Fetch & hiển thị chi tiết)
services/
└── authService.ts (CẬP NHẬT: Thêm getUserById)
```

---

## ✅ Kiểm Tra Lỗi

Tất cả tệp đã kiểm tra và không có lỗi TypeScript:
- ✅ farmer/escrow-contracts/index.tsx
- ✅ farmer/escrow-contracts/_layout.tsx
- ✅ wholesaler/escrow-contracts/index.tsx
- ✅ wholesaler/escrow-contracts/_layout.tsx
- ✅ farmer/profile/index.tsx
- ✅ wholesaler/profile/index.tsx
- ✅ EscrowDetailModal.tsx
- ✅ authService.ts

---

## 🎨 Giao Diện

### **Màu Sắc:**
- **Hợp đồng cọc tiền button:** Purple (#8B5CF6)
- **Status colors:** Theo hệ thống (0-8)
- **Header:** Trắng với text tối

### **Icon:**
- Farmer: Shield
- Wholesaler: Shield
- Empty state: Shield (farmer) hoặc FileText (wholesaler)

### **Responsive:**
- Hoạt động tốt trên tất cả kích thước màn hình
- Pull-to-refresh hỗ trợ
- Loading và empty state rõ ràng

---

## 📌 Lưu Ý Quan Trọng

1. **Modal chi tiết sẽ:**
   - Tự động fetch dữ liệu khi mở
   - Show loading spinner cho đến khi dữ liệu load xong
   - Handle lỗi gracefully (không crash app)

2. **API mà modal gọi:**
   - `GET /auction-service/englishauction/{auctionId}` - Thông tin đấu giá
   - `GET /Auth/{userId}` - Thông tin user (nông dân & người mua)

3. **Danh sách sẽ:**
   - Tự động cập nhật khi screen focus
   - Hỗ trợ pull-to-refresh
   - Show empty state khi không có dữ liệu

4. **Tính năng nút:**
   - Farmer: "Sẵn sàng thu hoạch" (chỉ show khi status ≤ 1)
   - Wholesaler: "Thanh toán phần còn lại" (chỉ show khi status = 2)

---

## 🚀 Sẵn Sàng Để Sử Dụng

Tất cả tính năng đã hoàn tất và sẵn sàng để test với backend API!
