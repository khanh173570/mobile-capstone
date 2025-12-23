# Hướng Dẫn Tạo Tranh Chấp và Kết Quả Tranh Chấp

## Mục Lục
1. [Tổng Quan Về Tranh Chấp](#tổng-quan-về-tranh-chấp)
2. [Điều Kiện Tạo Tranh Chấp](#điều-kiện-tạo-tranh-chấp)
3. [Cách Tạo Tranh Chấp](#cách-tạo-tranh-chấp)
4. [Các Trạng Thái Tranh Chấp](#các-trạng-thái-tranh-chấp)
5. [Xem Chi Tiết Tranh Chấp](#xem-chi-tiết-tranh-chấp)
6. [Review Tranh Chấp](#review-tranh-chấp)
7. [Kết Quả Giải Quyết Tranh Chấp](#kết-quả-giải-quyết-tranh-chấp)
8. [API Endpoints](#api-endpoints)
9. [Luồng Xử Lý Tranh Chấp](#luồng-xử-lý-tranh-chấp)

---

## Tổng Quan Về Tranh Chấp

Tranh chấp là tính năng cho phép **Nông dân** hoặc **Thương lái** tạo yêu cầu khi có sự khác biệt giữa khối lượng thực tế và khối lượng trong hợp đồng sau khi giao hàng.

### Mục Đích
- Giải quyết các vấn đề về khối lượng thực tế khác với hợp đồng
- Đề xuất số tiền hoàn lại phù hợp
- Đảm bảo công bằng cho cả hai bên trong giao dịch

### Ai Có Thể Tạo Tranh Chấp?
- ✅ **Thương lái**: Khi nhận hàng và phát hiện khối lượng thực tế khác với hợp đồng
- ✅ **Nông dân**: Khi có vấn đề về thanh toán hoặc giao dịch

---

## Điều Kiện Tạo Tranh Chấp

### Điều Kiện Trạng Thái Escrow
Tranh chấp chỉ có thể được tạo khi hợp đồng (Escrow) ở một trong các trạng thái sau:

1. **ReadyToHarvest** (Sẵn sàng thu hoạch)
   - Thương lái đã đặt cọc
   - Nông dân đã xác nhận sẵn sàng thu hoạch

2. **FullyFunded** (Đã thanh toán đủ)
   - Thương lái đã thanh toán đủ số tiền
   - Đang chờ giao hàng hoặc đã giao hàng

### Điều Kiện Khác
- ✅ Hợp đồng phải tồn tại và có ID hợp lệ
- ✅ Người tạo phải là một trong hai bên tham gia giao dịch
- ✅ Chưa có tranh chấp đang xử lý cho hợp đồng này (hoặc đã được giải quyết)

---

## Cách Tạo Tranh Chấp

### Bước 1: Truy Cập Trang Quản Lý Giao Dịch

#### Đối Với Nông Dân:
1. Đăng nhập vào hệ thống
2. Vào menu **"Quản lý giao dịch"** hoặc **"Hợp đồng"**
3. Tìm hợp đồng cần tạo tranh chấp

#### Đối Với Thương Lái:
1. Đăng nhập vào hệ thống
2. Vào menu **"Hợp đồng"** hoặc **"Đơn hàng"**
3. Tìm hợp đồng cần tạo tranh chấp

### Bước 2: Mở Form Tạo Tranh Chấp

1. Tìm hợp đồng có trạng thái **"Sẵn sàng thu hoạch"** hoặc **"Đã thanh toán đủ"**
2. Click vào nút **"Tranh chấp"** (có icon cảnh báo màu cam)
3. Form tạo tranh chấp sẽ hiển thị

### Bước 3: Điền Thông Tin Tranh Chấp

#### Thông Tin Bắt Buộc:

1. **Lý do tranh chấp** (Bắt buộc)
   - Mô tả chi tiết lý do tranh chấp
   - Ví dụ: "Khối lượng thực tế chỉ có 450kg trong khi hợp đồng là 500kg"
   - Tối thiểu: Có nội dung
   - Tối đa: Không giới hạn

2. **Khối lượng thực tế** (Bắt buộc)
   
   Có 2 cách nhập:
   
   **Cách 1: Nhập tổng khối lượng**
   - Nhập tổng khối lượng thực tế (kg)
   - Hệ thống sẽ tự động phân bổ cho các loại
   
   **Cách 2: Nhập theo từng loại**
   - **Loại 1**: Khối lượng thực tế (kg)
   - **Loại 2**: Khối lượng thực tế (kg)
   - **Loại 3**: Khối lượng thực tế (kg)
   - Tổng sẽ được tính tự động

#### Thông Tin Tùy Chọn:

3. **Tệp đính kèm** (Không bắt buộc nhưng khuyến khích)
   - Hỗ trợ: Ảnh (jpg, png, gif, webp) và Video (mp4, webm, mov)
   - Có thể đính kèm nhiều file
   - Mục đích: Cung cấp bằng chứng minh chứng cho tranh chấp
   - Ví dụ: Ảnh cân hàng, video quá trình giao hàng, biên bản nghiệm thu

4. **Số tiền đề xuất hoàn lại** (Tùy chọn)
   - Số tiền bạn đề xuất được hoàn lại
   - Tính toán dựa trên chênh lệch khối lượng
   - Có thể để trống, admin sẽ tính toán

### Bước 4: Gửi Tranh Chấp

1. Kiểm tra lại thông tin đã nhập
2. Click nút **"Gửi tranh chấp"**
3. Hệ thống sẽ xử lý và gửi thông báo cho bên kia

### Ví Dụ Form Dữ Liệu

```typescript
{
  escrowId: "123e4567-e89b-12d3-a456-426614174000",
  message: "Khối lượng thực tế chỉ có 450kg, thiếu 50kg so với hợp đồng 500kg",
  actualAmount: 450,           // Tổng khối lượng thực tế
  actualGrade1Amount: 200,    // Loại 1: 200kg
  actualGrade2Amount: 150,     // Loại 2: 150kg
  actualGrade3Amount: 100,     // Loại 3: 100kg
  attachments: [File1, File2],  // Ảnh/video minh chứng
  refundAmount: 5000000,       // Đề xuất hoàn lại 5 triệu VND
  isWholesalerCreated: true    // true nếu thương lái tạo, false nếu nông dân tạo
}
```

---

## Các Trạng Thái Tranh Chấp

Hệ thống có 5 trạng thái tranh chấp:

### 1. Pending (Đang chờ duyệt) - 0
**Mô tả**: Tranh chấp vừa được tạo, đang chờ bên kia xem xét và phản hồi.

**Màu hiển thị**: Vàng (`bg-yellow-50 text-yellow-700`)

**Hành động có thể thực hiện**:
- Bên tạo: Chỉ có thể xem
- Bên kia: Có thể **Chấp nhận** hoặc **Từ chối**

### 2. Approved (Đã chấp nhận) - 1
**Mô tả**: Bên kia đã chấp nhận kết quả tranh chấp, hai bên đã thống nhất.

**Màu hiển thị**: Xanh lá (`bg-emerald-50 text-emerald-700`)

**Hành động**: 
- Hệ thống sẽ tự động xử lý hoàn tiền theo đề xuất
- Không cần admin can thiệp

### 3. Rejected (Đã từ chối) - 2
**Mô tả**: Bên kia không đồng ý với kết quả tranh chấp, cần admin can thiệp.

**Màu hiển thị**: Đỏ (`bg-red-50 text-red-700`)

**Hành động**:
- Tranh chấp sẽ tự động chuyển sang trạng thái **InAdminReview**
- Admin sẽ xem xét và đưa ra quyết định cuối cùng

### 4. InAdminReview (Admin đang xem xét) - 3
**Mô tả**: Admin đang xem xét và đưa ra phán quyết cuối cùng.

**Màu hiển thị**: Xanh dương (`bg-blue-50 text-blue-700`)

**Hành động**:
- Cả hai bên chỉ có thể xem
- Chờ admin đưa ra quyết định

### 5. Resolved (Đã giải quyết) - 4
**Mô tả**: Admin đã giải quyết và đóng tranh chấp.

**Màu hiển thị**: Xanh lá (`bg-green-50 text-green-700`)

**Hành động**:
- Tranh chấp đã được giải quyết hoàn toàn
- Số tiền hoàn lại đã được xử lý
- Không thể chỉnh sửa hoặc tạo tranh chấp mới cho hợp đồng này

---

## Xem Chi Tiết Tranh Chấp

### Cách Xem Tranh Chấp

1. Vào trang **"Quản lý giao dịch"** hoặc **"Hợp đồng"**
2. Tìm hợp đồng có trạng thái **"Đang tranh chấp"**
3. Click nút **"Xem tranh chấp"** (icon mắt)

### Thông Tin Hiển Thị

#### 1. Trạng Thái Tranh Chấp
- Badge hiển thị trạng thái hiện tại với màu tương ứng

#### 2. Lý Do Tranh Chấp
- Hiển thị đầy đủ nội dung lý do mà người tạo đã nhập

#### 3. Khối Lượng Thực Tế
- **Tổng khối lượng**: Tổng số kg thực tế
- **Loại 1**: Khối lượng loại 1 (kg)
- **Loại 2**: Khối lượng loại 2 (kg)
- **Loại 3**: Khối lượng loại 3 (kg)

#### 4. Số Tiền Đề Xuất Hoàn Lại
- Hiển thị số tiền được đề xuất hoàn lại (nếu có)
- Format: VND với dấu phẩy phân cách hàng nghìn

#### 5. Tệp Đính Kèm
- Hiển thị dạng grid (lưới)
- Hỗ trợ xem ảnh fullscreen khi click
- Video có thể phát trực tiếp trong dialog

#### 6. Thông Tin Thời Gian
- **Ngày tạo**: Thời điểm tạo tranh chấp
- **Ngày giải quyết**: Thời điểm admin giải quyết (nếu có)

#### 7. Kết Quả Giải Quyết (Nếu có)
- Hiển thị khi admin đã giải quyết
- Bao gồm:
  - Số tiền hoàn lại cuối cùng
  - Ghi chú từ admin
  - Quyết định cuối cùng hay chưa

---

## Review Tranh Chấp

### Ai Có Thể Review?

Chỉ **bên không tạo tranh chấp** mới có thể review khi tranh chấp ở trạng thái **Pending**.

**Ví dụ**:
- Nếu thương lái tạo tranh chấp → Nông dân có thể review
- Nếu nông dân tạo tranh chấp → Thương lái có thể review

### Các Hành Động Review

#### 1. Chấp Nhận (Approve)
**Khi nào**: Khi bạn đồng ý với kết quả tranh chấp

**Hành động**:
1. Click nút **"Chấp nhận"** (màu xanh)
2. Xác nhận trong dialog
3. Tranh chấp chuyển sang trạng thái **Approved**
4. Hệ thống tự động xử lý hoàn tiền

**Kết quả**:
- ✅ Tranh chấp được giải quyết nhanh chóng
- ✅ Không cần admin can thiệp
- ✅ Số tiền hoàn lại được xử lý tự động

#### 2. Từ Chối (Reject)
**Khi nào**: Khi bạn không đồng ý với kết quả tranh chấp

**Hành động**:
1. Click nút **"Từ chối"** (màu đỏ)
2. Xác nhận trong dialog
3. Tranh chấp chuyển sang trạng thái **Rejected**
4. Tự động chuyển sang **InAdminReview**
5. Admin sẽ xem xét và đưa ra quyết định

**Kết quả**:
- ⚠️ Tranh chấp được chuyển lên admin
- ⚠️ Cần thời gian chờ admin xử lý
- ⚠️ Admin sẽ đưa ra quyết định cuối cùng

### API Review Dispute

```typescript
// Endpoint
PATCH /api/payment-service/dispute/{disputeId}/review

// Request Body
{
  isApproved: boolean  // true = chấp nhận, false = từ chối
}

// Response
{
  isSuccess: true,
  message: "Đã cập nhật kết quả tranh chấp"
}
```

---

## Kết Quả Giải Quyết Tranh Chấp

### Khi Nào Có Kết Quả?

Kết quả giải quyết tranh chấp xuất hiện khi:
1. Admin đã xem xét tranh chấp (trạng thái **InAdminReview**)
2. Admin đã đưa ra quyết định cuối cùng (trạng thái **Resolved**)

### Thông Tin Kết Quả

#### 1. Số Tiền Hoàn Lại Cuối Cùng
- Số tiền mà admin quyết định hoàn lại
- Có thể khác với số tiền đề xuất ban đầu
- Format: VND với dấu phẩy phân cách

#### 2. Quyết Định Cuối Cùng
- **isFinalDecision = true**: Quyết định cuối cùng, không thể khiếu nại
- **isFinalDecision = false**: Chưa phải quyết định cuối cùng, có thể có điều chỉnh

#### 3. Ghi Chú Từ Admin
- Lý do admin đưa ra quyết định
- Hướng dẫn các bước tiếp theo
- Thông tin liên hệ nếu cần

#### 4. Trạng Thái Tranh Chấp
- Hiển thị trạng thái cuối cùng: **Resolved**

### Ví Dụ Kết Quả

```typescript
{
  id: "dispute-resolve-id",
  escrowId: "escrow-id",
  refundAmount: 5000000,        // 5 triệu VND
  isFinalDecision: true,        // Quyết định cuối cùng
  adminNote: "Sau khi xem xét bằng chứng, chúng tôi quyết định hoàn lại 5 triệu VND cho thương lái do thiếu 50kg hàng.",
  createdAt: "2024-01-15T10:30:00Z",
  disputeStatus: 4              // Resolved
}
```

---

## API Endpoints

### 1. Tạo Tranh Chấp

```http
POST /api/payment-service/dispute
Content-Type: multipart/form-data

FormData:
- EscrowId: string (bắt buộc)
- Message: string (bắt buộc)
- ActualAmount: number (bắt buộc)
- ActualGrade1Amount: number (bắt buộc)
- ActualGrade2Amount: number (bắt buộc)
- ActualGrade3Amount: number (bắt buộc)
- IsWholeSalerCreated: boolean (bắt buộc)
- Attachments: File[] (tùy chọn)
- CreateDistupeResolve.RefundAmount: number (tùy chọn)
```

**Response**:
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Tạo tranh chấp thành công",
  "data": true
}
```

### 2. Lấy Tranh Chấp Theo Escrow ID

```http
GET /api/payment-service/dispute/escrow/{escrowId}
```

**Response**:
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": {
    "id": "dispute-id",
    "escrowId": "escrow-id",
    "disputeMessage": "Lý do tranh chấp...",
    "actualAmount": 450,
    "actualGrade1Amount": 200,
    "actualGrade2Amount": 150,
    "actualGrade3Amount": 100,
    "attachments": [
      {
        "id": "attachment-id",
        "url": "/uploads/dispute/attachment.jpg"
      }
    ],
    "disputeStatus": 0,
    "isWholesalerCreated": true,
    "resolvedAt": null,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": null,
    "refundAmount": 5000000
  }
}
```

### 3. Review Tranh Chấp

```http
PATCH /api/payment-service/dispute/{disputeId}/review
Content-Type: application/json

{
  "isApproved": true  // hoặc false
}
```

**Response**:
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Đã cập nhật kết quả tranh chấp"
}
```

### 4. Lấy Kết Quả Giải Quyết Tranh Chấp

```http
GET /api/payment-service/dispute/resolve/escrow/{escrowId}
```

**Response**:
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": {
    "id": "resolve-id",
    "escrowId": "escrow-id",
    "refundAmount": 5000000,
    "isFinalDecision": true,
    "adminNote": "Ghi chú từ admin...",
    "createdAt": "2024-01-15T11:00:00Z",
    "disputeStatus": 4
  }
}
```

---

## Luồng Xử Lý Tranh Chấp

### Luồng Cơ Bản

```
┌─────────────────┐
│  Tạo Tranh Chấp │
│   (Pending)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Bên Kia Review │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Approve│ │  Reject  │
└───┬────┘ └────┬─────┘
    │           │
    │           ▼
    │    ┌──────────────┐
    │    │ InAdminReview│
    │    └──────┬───────┘
    │           │
    │           ▼
    │    ┌──────────────┐
    │    │   Resolved   │
    │    └──────────────┘
    │
    ▼
┌──────────────┐
│   Approved   │
│ (Tự động xử  │
│  lý hoàn tiền)│
└──────────────┘
```

### Luồng Chi Tiết

#### Bước 1: Tạo Tranh Chấp
1. Người dùng (Nông dân hoặc Thương lái) tạo tranh chấp
2. Điền đầy đủ thông tin: lý do, khối lượng thực tế, đính kèm file
3. Gửi tranh chấp
4. Trạng thái: **Pending**
5. Escrow status chuyển sang: **Disputed**

#### Bước 2: Bên Kia Nhận Thông Báo
1. Hệ thống gửi thông báo cho bên kia
2. Bên kia có thể xem chi tiết tranh chấp
3. Bên kia quyết định: **Chấp nhận** hoặc **Từ chối**

#### Bước 3a: Nếu Chấp Nhận
1. Trạng thái: **Pending** → **Approved**
2. Hệ thống tự động xử lý hoàn tiền
3. Escrow status có thể chuyển sang: **Refunded** hoặc **PartialRefund**
4. Tranh chấp được giải quyết, không cần admin

#### Bước 3b: Nếu Từ Chối
1. Trạng thái: **Pending** → **Rejected** → **InAdminReview**
2. Admin nhận được thông báo
3. Admin xem xét tranh chấp và bằng chứng
4. Admin đưa ra quyết định cuối cùng

#### Bước 4: Admin Giải Quyết (Nếu cần)
1. Admin xem xét:
   - Lý do tranh chấp
   - Bằng chứng đính kèm
   - Khối lượng thực tế vs hợp đồng
   - Đề xuất hoàn tiền
2. Admin đưa ra quyết định:
   - Số tiền hoàn lại cuối cùng
   - Ghi chú giải thích
   - Đánh dấu quyết định cuối cùng
3. Trạng thái: **InAdminReview** → **Resolved**
4. Hệ thống xử lý hoàn tiền theo quyết định của admin

---

## Lưu Ý Quan Trọng

### ⚠️ Khi Tạo Tranh Chấp

1. **Chuẩn bị bằng chứng**: Luôn đính kèm ảnh/video minh chứng để tăng tính thuyết phục
2. **Mô tả chi tiết**: Viết rõ ràng lý do tranh chấp, tránh mơ hồ
3. **Tính toán chính xác**: Kiểm tra lại khối lượng thực tế trước khi gửi
4. **Đề xuất hợp lý**: Số tiền hoàn lại nên dựa trên chênh lệch thực tế

### ⚠️ Khi Review Tranh Chấp

1. **Xem xét kỹ lưỡng**: Đọc kỹ lý do và xem tất cả bằng chứng
2. **Phản hồi nhanh**: Phản hồi sớm để giải quyết nhanh chóng
3. **Giao tiếp**: Nếu có thể, liên hệ trực tiếp với bên kia trước khi từ chối

### ⚠️ Về Thời Gian

- Tranh chấp ở trạng thái **Pending**: Không giới hạn thời gian, nhưng nên phản hồi trong 24-48 giờ
- Tranh chấp ở trạng thái **InAdminReview**: Admin sẽ xử lý trong 3-5 ngày làm việc
- Sau khi **Resolved**: Số tiền hoàn lại sẽ được xử lý trong 1-3 ngày làm việc

### ⚠️ Về File Đính Kèm

- **Định dạng hỗ trợ**: JPG, PNG, GIF, WebP (ảnh), MP4, WebM, MOV (video)
- **Kích thước tối đa**: 10MB mỗi file (khuyến nghị)
- **Số lượng**: Không giới hạn, nhưng khuyến nghị 3-5 file để dễ xem xét
- **Nội dung**: Nên là bằng chứng rõ ràng như: ảnh cân hàng, biên bản nghiệm thu, video quá trình giao hàng

---

## Ví Dụ Thực Tế

### Ví Dụ 1: Thương Lái Tạo Tranh Chấp Vì Thiếu Hàng

**Tình huống**: 
- Hợp đồng: 500kg
- Thực tế nhận: 450kg
- Thiếu: 50kg

**Các bước**:
1. Thương lái vào trang "Hợp đồng"
2. Tìm hợp đồng có trạng thái "Đã thanh toán đủ"
3. Click "Tranh chấp"
4. Điền form:
   - Lý do: "Nhận hàng thiếu 50kg so với hợp đồng"
   - Tổng thực tế: 450kg
   - Loại 1: 200kg, Loại 2: 150kg, Loại 3: 100kg
   - Đính kèm: Ảnh cân hàng, biên bản nghiệm thu
   - Đề xuất hoàn lại: 5 triệu VND (tính theo giá hợp đồng)
5. Gửi tranh chấp

**Kết quả**:
- Nông dân nhận thông báo
- Nông dân xem và chấp nhận
- Hệ thống tự động hoàn 5 triệu VND cho thương lái

### Ví Dụ 2: Nông Dân Tạo Tranh Chấp Vì Không Được Thanh Toán

**Tình huống**:
- Đã giao hàng đủ
- Thương lái chưa thanh toán phần còn lại

**Các bước**:
1. Nông dân vào trang "Quản lý giao dịch"
2. Tìm hợp đồng có trạng thái "Sẵn sàng thu hoạch"
3. Click "Tranh chấp"
4. Điền form:
   - Lý do: "Đã giao hàng đủ nhưng chưa nhận được thanh toán phần còn lại"
   - Khối lượng: Nhập đúng như hợp đồng
   - Đính kèm: Ảnh giao hàng, biên bản giao nhận
5. Gửi tranh chấp

**Kết quả**:
- Thương lái nhận thông báo
- Thương lái từ chối vì lý do khác
- Admin xem xét và yêu cầu thương lái thanh toán
- Admin giải quyết và đóng tranh chấp

---

## Troubleshooting

### Lỗi: "Không thể tạo tranh chấp"

**Nguyên nhân có thể**:
- Hợp đồng không ở trạng thái phù hợp
- Đã có tranh chấp đang xử lý
- Thiếu thông tin bắt buộc

**Giải pháp**:
- Kiểm tra trạng thái hợp đồng
- Xem lại tranh chấp hiện có
- Điền đầy đủ tất cả thông tin bắt buộc

### Lỗi: "Không thể upload file"

**Nguyên nhân có thể**:
- File quá lớn (>10MB)
- Định dạng không hỗ trợ
- Lỗi kết nối mạng

**Giải pháp**:
- Nén ảnh/video trước khi upload
- Chuyển đổi sang định dạng hỗ trợ
- Kiểm tra kết nối mạng

### Lỗi: "Không thể review tranh chấp"

**Nguyên nhân có thể**:
- Bạn là người tạo tranh chấp (chỉ bên kia mới review được)
- Tranh chấp không ở trạng thái Pending
- Đã review rồi

**Giải pháp**:
- Chỉ bên không tạo mới có thể review
- Kiểm tra trạng thái tranh chấp
- Xem lại lịch sử review

---

## Tổng Kết

Tranh chấp là tính năng quan trọng để đảm bảo công bằng trong giao dịch. Hãy:

✅ **Tạo tranh chấp** khi có vấn đề thực sự với bằng chứng rõ ràng
✅ **Review nhanh chóng** để giải quyết sớm
✅ **Giao tiếp tốt** với bên kia trước khi tạo tranh chấp
✅ **Chuẩn bị bằng chứng** đầy đủ và rõ ràng

Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ khách hàng.

---

**Phiên bản**: 1.0  
**Cập nhật lần cuối**: 2024-01-15  
**Tác giả**: AgriMart Development Team

