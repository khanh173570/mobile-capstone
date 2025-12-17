# Hướng dẫn chức năng Đặt cọc và Xác nhận cho Buy Request

## Tổng quan
Đã thêm 2 chức năng mới cho Buy Request:
1. **Thương lái đặt cọc 30%** sau khi nông dân chấp nhận yêu cầu
2. **Nông dân xác nhận "Sẵn sàng thu hoạch"** sau khi thương lái đã đặt cọc

## API Endpoints

### 1. Lấy thông tin Escrow cho Buy Request
```
GET https://gateway.a-379.store/api/payment-service/escrow/buyrequest/{buyRequestId}
```

Response:
```json
{
  "isSuccess": true,
  "data": {
    "id": "escrow-id",
    "totalAmount": 3500000,
    "escrowAmount": 1050000,  // 30% cần thanh toán cọc
    "escrowStatus": "PendingPayment",
    ...
  }
}
```

### 2. Thanh toán cọc (Wallet)
```
POST https://gateway.a-379.store/api/payment-service/escrow/payescrow?escrowId={escrowId}
```

### 3. Thanh toán cọc (PayOS)
```
GET https://gateway.a-379.store/api/payment-service/payos/paymenturl?escrow={escrowId}
```

### 4. Nông dân xác nhận sẵn sàng thu hoạch
```
POST https://gateway.a-379.store/api/payment-service/escrow/buyrequest/readytoharvest?escrowId={escrowId}
```

## Luồng hoạt động

### Bước 1: Nông dân duyệt yêu cầu (Accepted)
- Nông dân vào trang Buy Request Management
- Xem chi tiết và bấm "Duyệt Yêu Cầu"
- Hệ thống tạo Escrow với trạng thái `PendingPayment`

### Bước 2: Thương lái thanh toán cọc
- Thương lái vào "Lịch sử yêu cầu" 
- Chọn yêu cầu đã được `Accepted`
- Thấy nút "Thanh toán cọc 1.050.000 VND" (30%)
- Chọn phương thức:
  - **Ví**: Thanh toán ngay, cập nhật trạng thái thành `Deposited`
  - **PayOS**: Mở trang thanh toán ngân hàng

### Bước 3: Nông dân xác nhận sẵn sàng
- Sau khi thương lái đã thanh toán cọc (escrowStatus = `Deposited`)
- Nông dân thấy nút "Sẵn Sàng Thu Hoạch"
- Bấm xác nhận
- Escrow status chuyển sang `ReadyToHarvest`

### Bước 4: Thương lái thanh toán phần còn lại
- Khi escrowStatus = `ReadyToHarvest`
- Thương lái có thể thanh toán phần còn lại (70%)
- *(Chức năng này có thể cần thêm sau)*

## Files đã tạo/chỉnh sửa

### Services
1. **buyRequestService.ts** - Thêm:
   - `getBuyRequestEscrow()` - Lấy thông tin escrow
   - `setBuyRequestReadyToHarvest()` - Set ready to harvest
   - Interface `BuyRequestEscrow`

2. **farmerBuyRequestManagementService.ts** - Thêm:
   - `getBuyRequestEscrowForFarmer()` - Lấy thông tin escrow cho farmer
   - `setFarmerBuyRequestReadyToHarvest()` - Set ready to harvest cho farmer
   - Interface `BuyRequestEscrow`

### Components
3. **BuyRequestDepositModal.tsx** - Component mới:
   - Modal thanh toán cọc
   - 2 phương thức: Wallet và PayOS
   - Hiển thị số tiền cần thanh toán

### Pages - Thương lái
4. **wholesaler/auction-browse/history-detail.tsx** - Cập nhật:
   - Load thông tin escrow khi status = Accepted
   - Hiển thị thông tin ký quỹ (tổng tiền, tiền cọc, phí, trạng thái)
   - Nút "Thanh toán cọc" (fixed bottom) khi escrowStatus = PendingPayment
   - Modal thanh toán

### Pages - Nông dân
5. **farmer/buy-request-management/[id].tsx** - Cập nhật:
   - Load thông tin escrow khi status = Accepted
   - Hiển thị card "Thông Tin Ký Quỹ"
   - Nút "Sẵn Sàng Thu Hoạch" khi escrowStatus = Deposited
   - Modal xác nhận

## Trạng thái Escrow

| Status | Label | Mô tả |
|--------|-------|-------|
| PendingPayment | Chờ thanh toán cọc | Mới tạo, chờ thương lái thanh toán |
| Deposited | Đã đặt cọc | Thương lái đã thanh toán 30% |
| ReadyToHarvest | Sẵn sàng thu hoạch | Nông dân đã xác nhận |
| Completed | Hoàn thành | Đã thanh toán đủ và giao hàng |
| Refunded | Đã hoàn tiền | Đã hoàn tiền lại |

## UI Components

### Thương lái - History Detail
- ✅ Card "Thông tin ký quỹ" (sau khi Accepted)
- ✅ Hiển thị: Tổng tiền, Tiền cọc 30%, Phí dịch vụ, Trạng thái
- ✅ Nút thanh toán cọc (fixed bottom)
- ✅ Modal chọn phương thức thanh toán

### Nông dân - Buy Request Detail  
- ✅ Card "Thông Tin Ký Quỹ" (sau khi Accepted)
- ✅ Hiển thị: Tổng giá trị, Tiền cọc, Số tiền nhận được, Trạng thái
- ✅ Nút "Sẵn Sàng Thu Hoạch" (khi Deposited)
- ✅ Modal xác nhận

## Testing Checklist

### Thương lái:
- [ ] Vào lịch sử yêu cầu, chọn request Accepted
- [ ] Thấy thông tin ký quỹ và nút thanh toán
- [ ] Thanh toán bằng Wallet thành công
- [ ] Thanh toán bằng PayOS (mở link)
- [ ] Sau thanh toán, trạng thái cập nhật

### Nông dân:
- [ ] Duyệt buy request
- [ ] Thấy card ký quỹ với trạng thái "Chờ thanh toán cọc"
- [ ] Sau khi thương lái thanh toán, thấy nút "Sẵn Sàng Thu Hoạch"
- [ ] Bấm xác nhận thành công
- [ ] Trạng thái cập nhật sang "Sẵn sàng thu hoạch"

## Notes
- Tất cả số tiền đã chuyển từ "đ" sang "VND"
- Modal thanh toán tái sử dụng logic từ auction payment
- API đã được test với mock data từ gateway.a-379.store
- Cần test với real data và flow hoàn chỉnh
