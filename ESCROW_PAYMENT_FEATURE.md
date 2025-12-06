# Tính năng Thanh toán Escrow cho Đấu giá

## Tổng quan
Tính năng này cho phép người thắng đấu giá đặt cọc tiền thông qua hệ thống escrow (ký quỹ) sử dụng cổng thanh toán PayOS.

## Flow hoạt động

### 1. **Kiểm tra người thắng đấu giá**
- Sau khi auction kết thúc với status = "Completed"
- Hệ thống so sánh `winnerId` từ API với `userId` từ access token
- Nếu trùng khớp → Hiển thị badge "Thắng" và nút "Đặt cọc"

### 2. **Lấy thông tin Escrow**
**API:** `GET https://gateway.a-379.store/api/payment-service/escrow/auction/{auctionId}`

**Response:**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Escrow for auction retrieved successfully!",
  "data": {
    "id": "a300b68b-9d00-4c49-a13e-7822652ce35f",
    "auctionId": "8e87037d-e96b-41ff-b4a1-78ab0e41a617",
    "winnerId": "4321abf1-2ed3-44ec-ae53-9acd1e82d21e",
    "totalAmount": 1750000,
    "feeAmount": 52500,
    "sellerReceiveAmount": 1697500,
    "escrowStatus": 0,  // PendingPayment
    ...
  }
}
```

### 3. **Escrow Status**
```typescript
enum EscrowStatus {
  PendingPayment = 0,      // Chờ thanh toán - Hiển thị nút "Đặt cọc"
  PartiallyFunded = 1,     // Đã cọc một phần
  FullyFunded = 2,         // Đã thanh toán đủ
  Completed = 3,           // Hoàn thành
  Disputed = 4,            // Đang tranh chấp
  Refunded = 5,            // Đã hoàn tiền
  PartialRefund = 6,       // Hoàn tiền một phần
  Canceled = 7             // Đã hủy
}
```

### 4. **Tạo Payment URL**
**API:** `GET https://gateway.a-379.store/api/payment-service/transaction/paymenturl?escrow={escrowId}`

**Response:**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Get payment URL successful!",
  "data": "https://pay.payos.vn/web/e3f55e2d57e843719241bfcdbbfe86f6"
}
```

### 5. **Thanh toán**
- Mở link PayOS trong browser/webview
- User thanh toán qua PayOS
- Backend tự động cập nhật escrow status
- PayOS redirect về app:
  - Success: `/payment/success`
  - Failure: `/payment/failure`

## Cấu trúc Code

### Services
**`services/escrowService.ts`**
- `getEscrowByAuctionId(auctionId)` - Lấy thông tin escrow
- `getPaymentUrl(escrowId)` - Tạo link thanh toán
- `getEscrowStatusName(status)` - Tên status tiếng Việt
- `getEscrowStatusColor(status)` - Màu badge theo status

### Components
**`components/wholesaler/EscrowPaymentButton.tsx`**
- Hiển thị status badge escrow
- Nút "Đặt cọc ngay" (khi PendingPayment)
- Badge "Đã thanh toán" (khi FullyFunded/Completed)
- Hiển thị chi tiết:
  - Tổng tiền ký quỹ
  - Phí dịch vụ
  - Người bán nhận
- Modal xác nhận thanh toán
- Mở link PayOS

**`components/wholesaler/WholesalerAuctionCard.tsx`**
- Thêm props `showPaymentButton`
- Render `EscrowPaymentButton` khi:
  - `showPaymentButton = true`
  - `isWinner = true`
  - `auction.status = 'Completed'`

### Screens
**`app/(tabs)/wholesaler/bidding-history/index.tsx`**
- Filter auctions completed
- Check winnerId = userId
- Truyền `showPaymentButton={true}` cho card

**`app/payment/success.tsx`**
- Screen hiển thị sau thanh toán thành công
- Auto redirect về bidding-history sau 3s

**`app/payment/failure.tsx`**
- Screen hiển thị khi thanh toán thất bại
- Auto redirect về bidding-history sau 5s

## Cài đặt cần thiết

### 1. **Không cần cài thêm package**
Code sử dụng:
- `axios` (đã có)
- `@react-native-async-storage/async-storage` (đã có)
- `expo-router` (đã có)
- `react-native` core components (đã có)
- `lucide-react-native` (đã có)

### 2. **Deep Linking Configuration**
Để handle redirect từ PayOS về app, cần config deep linking trong `app.json`:

```json
{
  "expo": {
    "scheme": "capstone2025",
    "web": {
      "bundler": "metro"
    }
  }
}
```

Backend cần redirect về:
- Success: `capstone2025://payment/success`
- Failure: `capstone2025://payment/failure`

### 3. **Optional: WebView cho PayOS**
Nếu muốn mở PayOS trong app (không mở browser):
```bash
npx expo install react-native-webview
```

Tạo `components/shared/PaymentWebView.tsx` để embed PayOS.

## Testing Flow

### Test Case 1: Người thắng đấu giá chưa thanh toán
1. Login với user có `winnerId` của auction đã Completed
2. Vào tab "Lịch sử đấu giá"
3. Filter "Đã thắng" hoặc "Hoàn thành"
4. Thấy badge "Thắng" màu vàng
5. Thấy section escrow với status "Chờ thanh toán"
6. Nhấn nút "Đặt cọc ngay"
7. Modal hiển thị số tiền và thông tin
8. Nhấn "Mở trang thanh toán"
9. Browser mở PayOS payment page
10. Thanh toán test thành công
11. Redirect về app `/payment/success`
12. Auto chuyển về bidding-history
13. Reload data → Status escrow = FullyFunded
14. Hiển thị "Đã thanh toán" thay vì nút

### Test Case 2: Người không thắng
1. Login với user khác
2. Xem cùng auction completed
3. KHÔNG thấy badge "Thắng"
4. KHÔNG thấy nút "Đặt cọc"

### Test Case 3: Thanh toán thất bại
1. Thực hiện flow thanh toán
2. Cancel hoặc payment failed trên PayOS
3. Redirect về `/payment/failure`
4. Hiển thị error message
5. Auto chuyển về bidding-history
6. Escrow status vẫn = PendingPayment
7. Có thể thử thanh toán lại

## API Authorization
Tất cả API calls đều cần:
```typescript
headers: {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

Token được lấy từ AsyncStorage key `'accessToken'`.

## Error Handling
- Network errors → Toast notification
- API errors → Alert với message từ backend
- Payment timeout → User có thể retry
- Escrow không tồn tại → Silent fail (không hiển thị nút)

## UI/UX Notes
- Badge "Thắng": Màu vàng (#F59E0B), icon Award
- Escrow status colors:
  - PendingPayment: Orange (#F59E0B)
  - FullyFunded: Green (#10B981)
  - Completed: Dark Green (#059669)
  - Disputed: Red (#EF4444)
- Nút "Đặt cọc": Green (#22C55E)
- Badge "Đã thanh toán": Light green background (#D1FAE5)
- Winner card: Border vàng, background cream (#FFFBEB)

## Backend Requirements
Backend cần implement:
1. PayOS webhook để cập nhật escrow status sau payment
2. Deep link redirect:
   - Success: `capstone2025://payment/success?escrowId={escrowId}`
   - Failure: `capstone2025://payment/failure?reason={reason}`
3. Auto update escrow status khi payment confirmed

## Future Enhancements
1. Push notification khi payment success
2. Escrow transaction history
3. Dispute handling UI
4. Refund request UI
5. QR code payment option
6. Multiple payment methods
