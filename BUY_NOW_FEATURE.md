# Chức Năng Mua Ngay (Buy Now) - Tài Liệu Chi Tiết

## 📋 Tổng Quan

Chức năng **Mua Ngay (Buy Now)** cho phép người bán buôn (wholesaler) có thể mua trực tiếp một phiên đấu giá với giá đã được nông dân (farmer) thiết lập, mà không cần tham gia quá trình đấu thầu thông thường.

### Luồng Công Việc Chính:
1. Nông dân tạo phiên đấu giá với tùy chọn "Mua ngay" (enableBuyNow = true) và giá mua ngay (buyNowPrice)
2. Trên tab "Trang chủ" của người bán buôn, hiển thị nút "Mua ngay" cho các phiên đấu giá có chức năng này
3. Người bán buôn bấm "Mua ngay" → Xác nhận → Thanh toán qua PayOS
4. Tạo giao dịch kí quỹ escrow → Giải phóng tiền cho nông dân sau khi giao hàng

---

## 🛠 Các Service Tạo Mới

### 1. `auctionBuyNowService.ts`
**Đường dẫn:** `d:\Capstone_2025\services\auctionBuyNowService.ts`

**Chức năng:**
- Thực hiện mua ngay phiên đấu giá
- Lấy thông tin giao dịch kí quỹ escrow

**API Endpoints:**
```
POST /api/auction-service/englishauction/{auctionId}/buynow
GET /api/payment-service/escrow/auction/{auctionId}
GET /api/payment-service/payos/paymenturl?escrow={escrowId}
```

**Hàm chính:**
```typescript
- executeBuyNow(auctionId: string) // Thực hiện mua ngay
- getEscrowByAuctionId(auctionId: string) // Lấy giao dịch kí quỹ escrow
- getPaymentUrl(escrowId: string) // Lấy URL thanh toán PayOS
- getWholesalerEscrows() // Lấy tất cả giao dịch kí quỹ escrow của người bán buôn
```

### 2. Cập Nhật `escrowPaymentService.ts`
**Đường dẫn:** `d:\Capstone_2025\services\escrowPaymentService.ts`

**Thêm vào:**
- Interface `EscrowRecord` - Mô hình dữ liệu giao dịch kí quỹ escrow
- Interface `PaymentUrlResponse` - Phản hồi URL thanh toán
- Hàm `getEscrowByAuctionId()` - Lấy escrow theo auctionId
- Hàm `getPaymentUrl()` - Lấy URL thanh toán PayOS
- Hàm `getWholesalerEscrows()` - Lấy danh sách escrow của wholesaler
- Hàm `getEscrowStatusLabel()` - Dịch mã trạng thái escrow
- Hàm `formatCurrency()` - Định dạng tiền tệ

**Trạng thái Escrow:**
```
0 = Chờ thanh toán (Pending)
1 = Đã xác nhận (Confirmed)
2 = Đã giải phóng (Released)
3 = Hoàn tiền (Refunded)
```

---

## 🎨 Component Mới

### `BuyNowModal.tsx`
**Đường dẫn:** `d:\Capstone_2025\components\wholesaler\BuyNowModal.tsx`

**Props:**
```typescript
interface BuyNowModalProps {
  visible: boolean;           // Hiển thị modal
  auction: any;              // Dữ liệu phiên đấu giá
  onClose: () => void;       // Đóng modal
  onSuccess: () => void;     // Callback thành công
}
```

**Các Bước Thực Hiện:**
1. **Confirm Step** - Xác nhận thông tin mua ngay:
   - Hiển thị giá mua ngay (buyNowPrice)
   - Số lượng dự kiến (expectedTotalQuantity)
   - Ngày cần hàng (expectedHarvestDate)
   - Cảnh báo về thanh toán tức thời

2. **Processing Step** - Đang xử lý:
   - Gọi API `executeBuyNow()` để mua ngay
   - Lấy thông tin escrow từ `getEscrowByAuctionId()`
   - Lấy URL thanh toán từ `getPaymentUrl()`

3. **Payment Step** - Thanh toán:
   - Hiển thị thông báo mua ngay thành công
   - Mở URL PayOS để người dùng quét mã QR/thanh toán
   - Sau khi thanh toán → đóng modal và cập nhật danh sách

**Giao Diện Màu Sắc:**
- Nút mua ngay: Đỏ (#DC2626)
- Giá mua ngay: Đỏ nghiêm trọng (text)
- Cảnh báo: Vàng (#FEF3C7) với border vàng

---

## 📱 Cập Nhật Screen

### `app/(tabs)/wholesaler/home/index.tsx`

**Thay Đổi:**
1. **Interface Auction:**
   ```typescript
   interface Auction {
     // ... existing fields ...
     enableBuyNow?: boolean;    // Có bật mua ngay không
     buyNowPrice?: number;      // Giá mua ngay
   }
   ```

2. **State Mới:**
   ```typescript
   const [buyNowModalVisible, setBuyNowModalVisible] = useState(false);
   const [selectedAuctionForBuyNow, setSelectedAuctionForBuyNow] = useState<Auction | null>(null);
   ```

3. **Card Footer:**
   - Thêm nút "Mua ngay" (màu đỏ) nếu `enableBuyNow && buyNowPrice`
   - Nút "Xem chi tiết" thay đổi flex nếu có nút mua ngay

4. **Import & Modal:**
   - Import `BuyNowModal` component
   - Render modal tại cuối screen
   - Gọi `loadDataQuietly()` sau khi mua ngay thành công

**Styles Mới:**
```typescript
buyNowButton: {
  backgroundColor: '#DC2626',      // Đỏ
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 16,
  minWidth: 100,
}

buyNowButtonText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#FFFFFF',
}
```

---

## 🔄 Quy Trình Chi Tiết

### Khi Người Bán Buôn Bấm "Mua Ngay":

```
1. Modal Xác Nhận
   ├─ Hiển thị thông tin phiên đấu giá
   ├─ Giá mua ngay
   ├─ Số lượng
   └─ Ngày cần hàng

2. Xử Lý (Processing)
   ├─ API POST /englishauction/{id}/buynow
   │  └─ Response: Auction object với status=Completed, winnerId=currentUser
   ├─ API GET /escrow/auction/{auctionId}
   │  └─ Response: EscrowRecord (escrowStatus=0 - pending)
   └─ API GET /payos/paymenturl?escrow={escrowId}
      └─ Response: Payment URL (https://pay.payos.vn/...)

3. Thanh Toán
   ├─ Mở URL PayOS
   ├─ Người dùng quét mã QR hoặc nhập thông tin thẻ
   ├─ PayOS xác nhận thanh toán
   └─ Escrow Status: 0 → 1 (Confirmed)

4. Sau Thanh Toán
   ├─ Reload danh sách phiên đấu giá
   ├─ Modal tự động đóng
   └─ Phiên đấu giá hiển thị trạng thái "Đã hoàn thành"
```

---

## 📊 API Responses

### 1. Buy Now Response
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Auction purchased successfully with buy now!",
  "data": {
    "id": "auctionId",
    "status": "Completed",
    "winnerId": "wholesalerId",
    "buyNowPrice": 2000000,
    "enableBuyNow": true,
    "currentPrice": 2000000,
    "expectedTotalQuantity": 375,
    "expectedHarvestDate": "2025-12-10T17:00:00Z"
  }
}
```

### 2. Escrow Record Response
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": {
    "id": "escrowId",
    "auctionId": "auctionId",
    "winnerId": "wholesalerId",
    "totalAmount": 2000000,
    "escrowAmount": 600000,
    "escrowStatus": 0,
    "createdAt": "2025-12-07T10:43:18.080102Z"
  }
}
```

### 3. Payment URL Response
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": "https://pay.payos.vn/web/fab5421cef344549af3515c7a32b8e56"
}
```

---

## 🧪 Hướng Dẫn Testing

### Test Case 1: Hiển Thị Nút Mua Ngay
```
Given: Phiên đấu giá có enableBuyNow=true và buyNowPrice>0
When:  Người bán buôn mở tab "Trang chủ"
Then:  Nút "Mua ngay" hiển thị màu đỏ bên cạnh "Xem chi tiết"
```

### Test Case 2: Mua Ngay Thành Công
```
Given: Người bán buôn bấm nút "Mua ngay"
When:  Xác nhận thanh toán
Then:
  1. Modal Processing hiển thị loading
  2. API executeBuyNow() được gọi → trả về auction with status=Completed
  3. API getEscrowByAuctionId() được gọi → trả về escrow record
  4. API getPaymentUrl() được gọi → trả về URL PayOS
  5. URL PayOS được mở trong browser/WebView
  6. Sau thanh toán → modal đóng → danh sách được reload
```

### Test Case 3: Lỗi Thanh Toán
```
Given: Người dùng hủy thanh toán PayOS hoặc lỗi mạng
When:  Modal Processing gặp exception
Then:  Alert lỗi hiển thị, modal quay về step "Confirm"
```

---

## 📝 Ghi Chú Quan Trọng

1. **Mặc Định Auto-Bid:** Khi bid thông thường (không phải buy now), auto-bid mặc định là `false`

2. **Status Phiên Đấu Giá:** 
   - Sau khi mua ngay, status sẽ là "Completed"
   - winnerId sẽ là wholesalerId của người bấm mua ngay

3. **Escrow Status:**
   - Lúc tạo: status = 0 (Pending)
   - Sau thanh toán: status = 1 (Confirmed)
   - Sau giao hàng: status = 2 (Released)

4. **Liên Kết Với Các Màn Hình Khác:**
   - giao dịch kí quỹ escrow sẽ hiển thị trong tab "giao dịch kí quỹ" (nếu có)
   - Phiên đấu giá sẽ được liệt kê trong "Lịch sử đấu giá" với status=Completed

5. **Quyền Hạn:**
   - Chỉ wholesaler mới có thể mua ngay
   - Chỉ có thể mua ngay với phiên đấu giá có enableBuyNow=true

---

## 🚀 Các File Đã Sửa Đổi

1. **Service Files:**
   - `services/auctionBuyNowService.ts` (tạo mới)
   - `services/escrowPaymentService.ts` (cập nhật)

2. **Component:**
   - `components/wholesaler/BuyNowModal.tsx` (tạo mới)

3. **Screen:**
   - `app/(tabs)/wholesaler/home/index.tsx` (cập nhật)

---

## 🔗 Related Features

- **Escrow Payment:** `services/escrowPaymentService.ts`
- **Auction Management:** `services/auctionService.ts`
- **PayOS Integration:** `services/paymentService.ts` (nếu có)
- **Bidding System:** Tab "Lịch sử đấu giá" trong wholesaler home

---

**Phiên Bản:** v1.0  
**Ngày Tạo:** 2025-12-07  
**Trạng Thái:** Ready for Testing
