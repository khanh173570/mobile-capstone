# Sửa Lỗi: Tạo Tranh Chấp Không Phát Sinh Kết Quả Tranh Chấp

## Vấn Đề

### Vấn đề 1: Không phát sinh kết quả tranh chấp
Khi tạo tranh chấp từ ứng dụng React Native, tranh chấp được tạo thành công nhưng **không phát sinh ra kết quả tranh chấp (Dispute Resolution)**. Trong khi đó, khi tạo tranh chấp từ web hoặc Swagger thì kết quả tranh chấp được tạo tự động bởi backend.

### Vấn đề 2: Lỗi khi upload attachment
Khi tạo tranh chấp với file đính kèm, gặp lỗi: `Property 'blob' doesn't exist`. Nguyên nhân là React Native không có method `blob()` như trong web browser.

## Nguyên Nhân

### Nguyên nhân 1: Format RefundAmount
Backend yêu cầu field `RefundAmount` phải được gửi trong nested object `CreateDistupeResolve` với format cụ thể để tự động tạo dispute resolution. Tuy nhiên, React Native FormData có thể xử lý nested field name khác với web FormData, đặc biệt là với field name có dấu chấm (`.`).

### Nguyên nhân 2: Format attachment trong React Native
Trong React Native, FormData không hỗ trợ `File` object và `blob()` method như trong web browser. Thay vào đó, cần append object với format `{uri, name, type}` trực tiếp vào FormData.

## Giải Pháp Đã Áp Dụng

### 1. Gửi RefundAmount Với Nhiều Format

Để đảm bảo backend nhận được `RefundAmount` và tự động tạo dispute resolution, code đã được cập nhật để gửi field này với **cả hai format**:

- **Format 1**: `CreateDistupeResolve.RefundAmount` (dấu chấm - ASP.NET Core standard)
- **Format 2**: `CreateDistupeResolve[RefundAmount]` (dấu ngoặc vuông - alternative cho React Native)

### 2. Đảm Bảo Luôn Gửi RefundAmount

Code đảm bảo luôn gửi `RefundAmount` (ngay cả khi giá trị là 0) để backend có thể tạo dispute resolution. Giá trị được chuyển đổi sang string để đảm bảo backend parse đúng.

### 3. Sửa Lỗi Upload Attachment

Sửa lại cách xử lý attachment để phù hợp với React Native:
- Thay vì convert URI sang blob và File object (không hỗ trợ trong React Native)
- Sử dụng format React Native: `{uri, name, type}` object trực tiếp
- Tự động detect MIME type dựa trên file extension

### 4. Cải Thiện Logging

Thêm logging chi tiết để debug:
- Log giá trị `RefundAmount` trước khi gửi
- Log cả hai format đã được append vào FormData
- Log toàn bộ FormData fields trước khi gửi request
- Log quá trình xử lý từng attachment

## Thay Đổi Chi Tiết

### File: `services/disputeService.ts`

**Trước đây:**
```typescript
const refundAmount = request.refundAmount ?? 0;
formData.append('CreateDistupeResolve.RefundAmount', refundAmount.toString());
```

**Sau khi sửa:**

**Phần RefundAmount:**
```typescript
const refundAmount = request.refundAmount ?? 0;
const refundAmountStr = refundAmount.toString();

// Format 1: Dấu chấm (ASP.NET Core standard)
formData.append('CreateDistupeResolve.RefundAmount', refundAmountStr);

// Format 2: Dấu ngoặc vuông (alternative cho React Native)
formData.append('CreateDistupeResolve[RefundAmount]', refundAmountStr);
```

**Phần Attachment (trước đây - SAI):**
```typescript
// ❌ SAI: React Native không có blob() method
const response = await fetch(attachment);
const blob = await response.blob();
const file = new File([blob], filename, { type: blob.type });
formData.append('Attachments', file);
```

**Phần Attachment (sau khi sửa - ĐÚNG):**
```typescript
// ✅ ĐÚNG: React Native FormData format
const imageData = {
  uri: attachment,
  name: filename,
  type: mimeType, // 'image/jpeg', 'image/png', etc.
};
formData.append('Attachments', imageData);
```

## Cách Kiểm Tra

1. **Tạo tranh chấp từ app** với đầy đủ thông tin, bao gồm `RefundAmount`
2. **Kiểm tra console logs** để xác nhận cả hai format đã được gửi:
   ```
   ✅ [disputeService] Appended CreateDistupeResolve.RefundAmount (dot notation): 5000000
   ✅ [disputeService] Appended CreateDistupeResolve[RefundAmount] (bracket notation): 5000000
   ```
3. **Sau khi tạo tranh chấp thành công**, gọi API `GET /api/payment-service/dispute/resolve/escrow/{escrowId}` để kiểm tra xem dispute resolution đã được tạo chưa
4. **So sánh với web/Swagger**: Kết quả phải giống nhau

## Lưu Ý

- Nếu backend chỉ nhận một format cụ thể, có thể cần xóa format kia
- Gửi cả hai format để đảm bảo backend nhận được (một trong hai sẽ được ignore nếu không phù hợp)
- Đảm bảo `refundAmount` luôn có giá trị hợp lệ (>= 0) trước khi gửi

## Kết Quả Mong Đợi

Sau khi áp dụng fix này:
- ✅ Tạo tranh chấp từ app sẽ tự động phát sinh dispute resolution
- ✅ Kết quả tranh chấp có thể được lấy ngay sau khi tạo tranh chấp thành công
- ✅ Hành vi giống với web và Swagger

## Nếu Vẫn Không Hoạt Động

Nếu sau khi áp dụng fix mà vẫn không tạo được dispute resolution:

1. **Kiểm tra backend logs** để xem format nào backend nhận được
2. **Kiểm tra backend code** để xem format chính xác mà backend yêu cầu
3. **Thử chỉ gửi một format** (dấu chấm hoặc dấu ngoặc vuông) thay vì cả hai
4. **Kiểm tra xem backend có yêu cầu RefundAmount > 0** để tạo resolution không
5. **Liên hệ backend team** để xác nhận format chính xác

---

**Ngày sửa**: 2024-01-15  
**Người sửa**: AI Assistant  
**Phiên bản**: 1.1

---

## Cập Nhật Phiên Bản 1.1

### Thêm Fix Lỗi Upload Attachment

- ✅ Sửa lỗi `Property 'blob' doesn't exist` khi upload attachment
- ✅ Chuyển sang format React Native FormData: `{uri, name, type}`
- ✅ Tự động detect MIME type dựa trên file extension
- ✅ Hỗ trợ đầy đủ các định dạng: jpg, png, gif, webp, mp4, webm, mov

