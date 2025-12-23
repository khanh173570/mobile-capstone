# 🔔 Hướng Dẫn Triển Khai Notification Bell với SignalR Realtime

## Tổng Quan

Đã triển khai hệ thống thông báo realtime hoàn chỉnh cho cả **Nông dân** và **Thương lái** sử dụng SignalR. Khi có thông báo mới, số lượng thông báo sẽ tự động tăng lên và người dùng có thể click vào để điều hướng đến trang liên quan.

## Các Component Đã Tạo

### 1. NotificationContext (`contexts/NotificationContext.tsx`)

Context quản lý state tập trung cho notifications:
- **notifications**: Danh sách tất cả notifications
- **unreadCount**: Số lượng thông báo chưa đọc
- **isLoading**: Trạng thái loading
- **isConnected**: Trạng thái kết nối SignalR
- **refreshNotifications()**: Làm mới danh sách notifications
- **refreshUnreadCount()**: Làm mới số lượng chưa đọc
- **markAsRead(id)**: Đánh dấu notification là đã đọc
- **markAllAsRead()**: Đánh dấu tất cả là đã đọc
- **deleteNotification(id)**: Xóa notification

### 2. NotificationBell Component (`components/shared/NotificationBell.tsx`)

Component hiển thị chuông thông báo với badge và modal:
- Hiển thị badge với số lượng thông báo chưa đọc
- Modal hiển thị danh sách notifications
- Tự động điều hướng khi click vào notification
- Pull-to-refresh để làm mới danh sách

### 3. SignalR Service Updates (`services/signalRService.ts`)

Đã cập nhật để listen tất cả 20 notification types:
1. Outbid (1)
2. AuctionEnded (2)
3. AuctionWon (3)
4. AuctionApproved (4)
5. AuctionPaused (5)
6. AuctionStarted (6)
7. System (7)
8. EscrowDepositSuccess (8)
9. EscrowRemainingPaymentSuccess (9)
10. EscrowReleaseReceived (10)
11. WalletFundsAdded (11)
12. AuctionJoinSuccess (12)
13. EscrowCancelled (13)
14. DistupeOpened (14)
15. AuctionCreated (15)
16. AuctionRejected (16)
17. WithdrawalRequested (17)
18. WithdrawalCompleted (18)
19. WithdrawalRejected (19)
20. AuctionExtended (20)

## Cách Sử Dụng

### 1. Trong Header Component

NotificationBell đã được tích hợp vào Header component:

```tsx
import Header from '../components/shared/Header';

<Header 
  title="Trang chủ"
  role="farmer" // hoặc "wholesaler"
  showNotification={true}
/>
```

### 2. Sử Dụng Trực Tiếp NotificationBell

```tsx
import { NotificationBell } from '../components/shared/NotificationBell';

<NotificationBell role="farmer" />
```

### 3. Sử Dụng NotificationContext

```tsx
import { useNotificationContext } from '../contexts/NotificationContext';

const { notifications, unreadCount, refreshNotifications } = useNotificationContext();
```

## Navigation Mapping

Khi click vào notification, hệ thống sẽ tự động điều hướng dựa trên notification type:

| Type | Notification | Navigation Target |
|------|-------------|-------------------|
| 1, 2, 3, 5, 6, 12, 15, 16, 20 | Auction-related | `/pages/wholesaler/auction-detail` |
| 4 | AuctionApproved | `/pages/farmer/auction-detail` |
| 8, 9, 10, 13 | Escrow-related | `/pages/{role}/escrow-detail` |
| 14 | DistupeOpened | `/pages/{role}/dispute-detail` |
| 11, 17, 18, 19 | Wallet-related | `/(tabs)/{role}/wallet` |
| 7 | System | Không điều hướng |

## Tích Hợp Vào App

NotificationProvider đã được tích hợp vào `app/_layout.tsx`:

```tsx
<SignalRProvider>
  <NotificationProvider role={userRole}>
    {/* App content */}
  </NotificationProvider>
</SignalRProvider>
```

## Tính Năng

### ✅ Realtime Updates
- Tự động nhận notifications qua SignalR
- Badge tự động cập nhật khi có notification mới
- Không cần refresh thủ công

### ✅ Navigation
- Tự động điều hướng đến trang liên quan khi click notification
- Hỗ trợ cả farmer và wholesaler routes
- Parse data từ notification để lấy entity IDs

### ✅ UI/UX
- Badge hiển thị số lượng chưa đọc (tối đa 99+)
- Modal với danh sách notifications
- Pull-to-refresh
- Mark all as read
- Delete notification
- Empty state khi không có notification

### ✅ Role-based Filtering
- Backend tự động filter notifications theo role
- Frontend double-check để đảm bảo đúng

## Notification Types Chi Tiết

### Cho Nông Dân (Farmer)
- AuctionApproved (4)
- EscrowReleaseReceived (10)
- WalletFundsAdded (11)
- EscrowDepositSuccess (8)
- DistupeOpened (14)

### Cho Thương Lái (Wholesaler)
- Outbid (1)
- AuctionEnded (2)
- AuctionWon (3)
- AuctionPaused (5)
- AuctionStarted (6)
- EscrowDepositSuccess (8)
- EscrowRemainingPaymentSuccess (9)
- WalletFundsAdded (11)
- AuctionJoinSuccess (12)
- EscrowCancelled (13)
- DistupeOpened (14)

## Troubleshooting

### Notification không hiển thị
1. Kiểm tra SignalR connection: `signalRService.isConnected()`
2. Kiểm tra user đã login chưa
3. Kiểm tra role có đúng không
4. Xem console logs để debug

### Badge không cập nhật
1. Kiểm tra `refreshUnreadCount()` được gọi chưa
2. Kiểm tra SignalR listener đã setup chưa
3. Kiểm tra backend có gửi notification không

### Navigation không hoạt động
1. Kiểm tra route paths có đúng không
2. Kiểm tra `relatedEntityId` hoặc `auctionId` có giá trị không
3. Kiểm tra role có đúng không

## Files Đã Tạo/Cập Nhật

### Files Mới
- `contexts/NotificationContext.tsx` - Context quản lý state
- `components/shared/NotificationBell.tsx` - Component chuông thông báo
- `NOTIFICATION_BELL_IMPLEMENTATION.md` - Tài liệu này

### Files Đã Cập Nhật
- `services/signalRService.ts` - Thêm tất cả notification types
- `services/notificationService.ts` - Cập nhật helper functions
- `components/shared/Header.tsx` - Tích hợp NotificationBell
- `app/_layout.tsx` - Thêm NotificationProvider

## Kết Luận

Hệ thống notification bell đã được triển khai đầy đủ với:
- ✅ Realtime updates qua SignalR
- ✅ Badge tự động cập nhật
- ✅ Navigation khi click notification
- ✅ Hỗ trợ cả farmer và wholesaler
- ✅ UI/UX tốt với modal và pull-to-refresh

---

**Ngày triển khai**: 2024-12-22  
**Phiên bản**: 1.0



