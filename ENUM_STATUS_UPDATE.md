# Enum Status Cập Nhật - 2025-12-07

## 📋 Tổng Quan

Cập nhật các enum status từ backend để đồng bộ với hệ thống:
- **CropStatus** - Trạng thái vườn canh tác
- **EscrowStatus** - Trạng thái giao dịch kí quỹ ký quỹ
- **TransactionType** - Loại giao dịch
- **PaymentType** - Loại thanh toán

---

## 🌾 CropStatus - Trạng Thái Vườn Canh Tác

**Namespace:** `Farm.Domain.Enums`  
**File Frontend:** `utils/cropStatusUtils.ts`

### Enum Values:

```csharp
public enum CropStatus
{
    PreSeason = 0,         // Chưa bắt đầu mùa vụ
    Growing = 1,           // Đang phát triển
    OpenForBidding = 2,    // Đang trên sàn đấu giá
    ReadyToHarvest = 3,    // Sẵn sàng thu hoạch
    Harvesting = 4,        // Đang thu hoạch
    Harvested = 5,         // Đã thu hoạch
    StoppedCultivation = 6 // Ngừng canh tác
}
```

### Chi Tiết Từng Trạng Thái:

| ID | Tên Tiếng Việt | Màu | Mô Tả |
|---|---|---|---|
| 0 | Chưa bắt đầu mùa vụ | Gray (#6B7280) | Vừa tạo vườn, chưa bắt đầu canh tác |
| 1 | Đang phát triển | Amber (#F59E0B) | Cây đang trong quá trình phát triển, có thể tạo đấu giá |
| 2 | Đang trên sàn đấu giá | Blue (#3B82F6) | Vườn đang có đấu giá trong sàn |
| 3 | Sẵn sàng thu hoạch | Purple (#8B5CF6) | Cây đã phát triển đủ, sẵn sàng để thu hoạch |
| 4 | Đang thu hoạch | Pink (#EC4899) | Cây đang trong quá trình thu hoạch |
| 5 | Đã thu hoạch | Green (#22C55E) | Đã hoàn thành thu hoạch |
| 6 | Ngừng canh tác | Red (#EF4444) | Ngừng canh tác vườn này |

### Cơ Chế Chuyển Trạng Thái:

```
PreSeason (0)
    ↓
Growing (1) → Có thể tạo đấu giá
    ↓
OpenForBidding (2) → Đang có đấu giá
    ↓
ReadyToHarvest (3) → Sẵn sàng thu hoạch
    ↓
Harvesting (4) → Đang thu hoạch
    ↓
Harvested (5) → Hoàn thành

(Bất cứ lúc nào có thể → StoppedCultivation (6) nếu ngừng canh tác)
```

---

## 💳 EscrowStatus - Trạng Thái Ký Quỹ

**Namespace:** `Payment.Domain.Enums`  
**File Frontend:** `services/escrowService.ts`, `services/escrowPaymentService.ts`

### Enum Values:

```csharp
public enum EscrowStatus
{
    PendingPayment = 0,    // Chờ thanh toán
    PartiallyFunded = 1,   // Đã thanh toán một phần (đặt cọc)
    ReadyToHarvest = 2,    // Vườn đã sẵn sàng để thương lái tới thu hoạch
    FullyFunded = 3,       // Đã thanh toán đủ (full fund)
    Completed = 4,         // Hàng đã giao, tiền released cho seller
    Disputed = 5,          // Đang tranh chấp
    Refunded = 6,          // Đã hoàn toàn bộ về buyer
    PartialRefund = 7,     // Hoàn tiền một phần
    Canceled = 8           // Đã hủy
}
```

### Chi Tiết Từng Trạng Thái:

| ID | Tên Tiếng Việt | Màu | Mô Tả |
|---|---|---|---|
| 0 | Chờ thanh toán | Orange (#F59E0B) | Escrow tạo nhưng buyer chưa thanh toán |
| 1 | Đã cọc một phần | Blue (#3B82F6) | Buyer thanh toán một phần (đặt cọc) |
| 2 | Sẵn sàng thu hoạch | Purple (#8B5CF6) | Vườn sẵn sàng để thương lái tới thu hoạch |
| 3 | Đã thanh toán đủ | Green (#10B981) | Buyer thanh toán đủ (full fund) |
| 4 | Hoàn thành | Dark Green (#059669) | Hàng đã giao, tiền released cho seller |
| 5 | Đang tranh chấp | Red (#EF4444) | Escrow bị tranh chấp |
| 6 | Đã hoàn toàn bộ | Gray (#6B7280) | Refund toàn bộ về buyer |
| 7 | Hoàn tiền một phần | Light Gray (#9CA3AF) | Refund một phần |
| 8 | Đã hủy | Light Gray (#D1D5DB) | Escrow bị hủy |

### Workflow Escrow:

```
1. Buyer tạo bid → Escrow tạo (PendingPayment - 0)
                    ↓
2. Buyer thanh toán một phần (cọc) → PartiallyFunded (1)
                    ↓
3. Vườn sẵn sàng → ReadyToHarvest (2)
                    ↓
4. Buyer thanh toán full → FullyFunded (3)
                    ↓
5. Hàng giao xong → Completed (4) ✅

HOẶC:
- Tranh chấp → Disputed (5) → Refunded (6) hoặc PartialRefund (7)
- Hủy → Canceled (8)
```

---

## 💰 TransactionType - Loại Giao Dịch

**Namespace:** `Payment.Domain.Enums`  
**File Frontend:** `services/escrowPaymentService.ts`

### Enum Values:

```csharp
public enum TransactionType
{
    PayEscrow = 1,              // Thanh toán escrow
    ReleaseEscrow = 2,          // Giải phóng escrow
    RefundEscrow = 3,           // Hoàn tiền escrow
    AddFunds = 4,               // Nạp tiền vào ví
    WithdrawFunds = 5,          // Rút tiền khỏi ví
    PayRemainingEscrow = 6,     // Thanh toán phần còn lại của escrow
}
```

### Chi Tiết:

| ID | Tên | Mô Tả |
|---|---|---|
| 1 | Thanh toán escrow | Buyer thanh toán escrow (deposit hoặc full) |
| 2 | Giải phóng escrow | Admin/System giải phóng tiền cho seller |
| 3 | Hoàn tiền escrow | Refund escrow về buyer (tranh chấp hoặc hủy) |
| 4 | Nạp tiền vào ví | User nạp tiền vào ví điện tử |
| 5 | Rút tiền khỏi ví | User rút tiền từ ví điện tử |
| 6 | Thanh toán phần còn lại | Buyer thanh toán phần còn lại của escrow |

---

## 💳 PaymentType - Loại Thanh Toán

**Namespace:** `Payment.Domain.Enums`  
**File Frontend:** `services/escrowPaymentService.ts`

### Enum Values:

```csharp
public enum PaymentType
{
    PayOS = 0,    // Thanh toán qua PayOS (QR code, thẻ ngân hàng, ví)
    Wallet = 1    // Thanh toán từ ví điện tử (balance của user)
}
```

### Chi Tiết:

| ID | Tên | Mô Tả |
|---|---|---|
| 0 | PayOS | Thanh toán qua PayOS (QR code, thẻ ngân hàng, ví điện tử khác) |
| 1 | Wallet | Thanh toán từ ví điện tử nội bộ (balance của user) |

### Luồng Thanh Toán:

```
User bấm "Thanh toán"
    ↓
Chọn loại thanh toán:
    ├─ PayOS (0) → Mở QR code PayOS → Người dùng quét hoặc nhập thẻ
    └─ Wallet (1) → Kiểm tra balance ví → Thanh toán từ ví
```

---

## 📁 File Được Cập Nhật

### 1. Frontend Files:

#### `utils/cropStatusUtils.ts`
- Cập nhật `CROP_STATUSES` array với 7 status (0-6)
- Cập nhật mô tả và màu sắc
- Thêm Purple (#8B5CF6) cho ReadyToHarvest

#### `services/escrowService.ts`
- Cập nhật `EscrowStatus` enum với 9 giá trị (0-8)
- Thêm `TransactionType` enum
- Thêm `PaymentType` enum
- Cập nhật `getEscrowStatusName()` function
- Cập nhật `getEscrowStatusColor()` function

#### `services/escrowPaymentService.ts`
- Cập nhật `EscrowStatus` enum với 9 giá trị (0-8)
- Thêm `TransactionType` enum
- Thêm `PaymentType` enum
- Cập nhật `getEscrowStatusLabel()` function

---

## 🔄 Hành Động Được Cập Nhật

### Crop Status Changes:

```typescript
// Hiển thị status crop ở các màn hình
getCropStatusInfo(statusId) → Lấy tên, màu, mô tả
getCropStatusName(statusId)
getCropStatusColor(statusId)
getCropStatusBackgroundColor(statusId)
```

### Escrow Status Changes:

```typescript
// Services escrowService.ts
getEscrowStatusName(status: EscrowStatus)
getEscrowStatusColor(status: EscrowStatus)

// Services escrowPaymentService.ts
getEscrowStatusLabel(status: number | EscrowStatus)
formatCurrency(amount: number)
```

---

## ✅ Kiểm Tra Consistency

Các file đã cập nhật đồng bộ giữa:
- Frontend enum values (0-8 cho EscrowStatus, 0-6 cho CropStatus)
- Backend enum definition từ C# code
- Hàm helper (name, color, label)
- Hàm format (currency)

### Các Chức Năng Sử Dụng:

1. **Hiển thị status:**
   - Auction cards → EscrowStatus
   - Crop cards → CropStatus
   - Escrow records → EscrowStatus

2. **Màu sắc:**
   - Status badges
   - Progress indicators
   - UI components

3. **Nhãn (Label):**
   - Toast messages
   - Modal headers
   - List items
   - Detail screens

---

## 🚀 Testing Checklist

- [ ] Crop status 0-6 hiển thị đúng tên tiếng Việt
- [ ] Escrow status 0-8 hiển thị đúng tên tiếng Việt
- [ ] Các status có màu sắc khác nhau theo quy định
- [ ] Không có lỗi compile TypeScript
- [ ] API responses với status values 0-8 hiển thị đúng
- [ ] Transition giữa các status hoạt động đúng
- [ ] Các helper function (getStatusName, getStatusColor) hoạt động chính xác

---

## 📝 Ghi Chú

1. **Không thay đổi Value**: ID của enum không được thay đổi (0-8) để giữ consistency với backend

2. **Thêm Status ReadyToHarvest**: Escrow status mới (2) để theo dõi khi vườn sẵn sàng thu hoạch

3. **CropStatus vs EscrowStatus**: 
   - CropStatus = Trạng thái vườn (7 trạng thái)
   - EscrowStatus = Trạng thái giao dịch kí quỹ ký quỹ (9 trạng thái)
   - Khác nhau hoàn toàn, không trộn lẫn

4. **PaymentType**: Dùng để track loại thanh toán (PayOS vs Wallet)

5. **TransactionType**: Dùng để track loại giao dịch trong history

---

**Phiên Bản:** v1.0  
**Ngày Cập Nhật:** 2025-12-07  
**Trạng Thái:** ✅ Đã cập nhật và kiểm tra
