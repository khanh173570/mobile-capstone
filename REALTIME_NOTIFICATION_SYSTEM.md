# Hệ Thống Thông Báo Real-Time với SignalR

## 📋 Tổng Quan

Hệ thống thông báo real-time cho phép người dùng nhận thông báo ngay lập tức khi có sự kiện quan trọng như:
- **Farmer**: Đấu giá được phê duyệt, đấu giá bắt đầu, nhắc nhở thu hoạch, cọc được phát hành
- **Wholesaler**: Bị vượt giá, đấu giá kết thúc, thắng đấu giá, thanh toán cọc

## 🚀 Luồng Hoạt Động

### 1. **Khi Admin Approve Auction**
```
1. Admin approve auction trên backend
   ↓
2. Backend broadcast SignalR event "ReceiveNotification"
   Event: {
     type: 4,  // AuctionApproved
     title: "Phiên đấu giá đã được duyệt!",
     message: "Phiên đấu giá AUC-XXX đã được duyệt!",
     severity: "Info",
     relatedEntityId: "auction-id",
     relatedEntityType: "Auction"
   }
   ↓
3. SignalR connection nhận event (real-time)
   ↓
4. Frontend handler được trigger:
   - Farmer home screen nhận event
   - Convert event → UserNotification
   - Add vào notifications array
   - Gọi loadUnreadNotifications() → Update badge số
   ↓
5. UI cập nhật NGAY LẬP TỨC:
   - Bell icon hiện badge số thông báo chưa đọc (4)
   - Không cần reload page
```

### 2. **Khi User Mở Notification Modal**
```
1. User click vào Bell icon
   ↓
2. NotificationModal opens
   ↓
3. Modal gọi API REST:
   GET /api/messaging-service/Notifications/user/{userId}?pageNumber=1&pageSize=10
   ↓
4. Backend trả về list notifications từ DB:
   [
     {
       id: "uuid",
       type: 4,
       title: "Phiên đấu giá đã được duyệt!",
       message: "...",
       isRead: false,
       createdAt: "2025-12-10T09:44:55Z"
     },
     ...
   ]
   ↓
5. Modal hiển thị danh sách notifications
   - Icon emoji dựa trên type
   - Color dựa trên severity
   - Badge "chưa đọc" nếu isRead = false
```

### 3. **Khi Modal Đang Mở & Có Notification Mới**
```
1. Có event mới từ SignalR (ví dụ: auction started)
   ↓
2. SignalR handler trigger:
   - Convert event → UserNotification
   - Add vào notifications array STATE
   ↓
3. React re-render modal với notification mới
   ↓
4. User thấy notification xuất hiện ở đầu list
   KHÔNG CẦN đóng modal và mở lại!
```

### 4. **Khi User Click Vào 1 Notification**
```
1. User tap vào notification item
   ↓
2. Gọi API:
   PUT /api/messaging-service/Notifications/{notificationId}/read
   ↓
3. Backend mark notification as read
   ↓
4. Frontend:
   - Update local state: isRead = true
   - Gọi loadUnreadNotifications() → Update badge số
   ↓
5. UI cập nhật:
   - Notification không còn badge "chưa đọc"
   - Bell icon badge giảm số (4 → 3)
```

## 🏗️ Kiến Trúc Hệ Thống

### REST API Endpoints

#### 1. Lấy Danh Sách Notifications
```http
GET /api/messaging-service/Notifications/user/{userId}?pageNumber=1&pageSize=10
```
**Response:**
```json
[
  {
    "id": "bc17cabf-368f-49d2-85d9-ec414985c89c",
    "userId": "c612cc80-b763-416e-91d0-5dc53cd348e3",
    "type": 6,
    "severity": 0,
    "title": "Bắt đầu đấu giá!",
    "message": "Phiên đấu giá của bạn: AUC-20251210164406 đã bắt đầu!",
    "isRead": false,
    "readAt": null,
    "data": "{...}",
    "relatedEntityId": "ef9d7371-f9de-47e6-a41b-6d8f3a886a34",
    "relatedEntityType": "Auction",
    "createdAt": "2025-12-10T09:50:48.655171Z",
    "updatedAt": null
  }
]
```

#### 2. Lấy Số Thông Báo Chưa Đọc
```http
GET /api/messaging-service/Notifications/user/{userId}/unread-count
```
**Response:**
```
4
```

#### 3. Đánh Dấu Đã Đọc
```http
PUT /api/messaging-service/Notifications/{notificationId}/read
```

### SignalR Events

#### Event Name: `ReceiveNotification`
```typescript
{
  id: string;
  userId: string;
  type: number; // 1-16
  severity: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  data?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
}
```

### Notification Types

| Type | Name | Icon | Farmer | Wholesaler |
|------|------|------|--------|------------|
| 1 | Bị vượt giá | 📉 | ❌ | ✅ |
| 2 | Đấu giá kết thúc | 🏁 | ❌ | ✅ |
| 3 | Thắng đấu giá | 🎉 | ❌ | ✅ |
| 4 | Đấu giá được phê duyệt | ✅ | ✅ | ❌ |
| 5 | Đấu giá bị tạm dừng | ⏸️ | ❌ | ✅ |
| 6 | Đấu giá đã bắt đầu | 🚀 | ✅ | ✅ |
| 7 | Thông báo hệ thống | 📢 | ✅ | ✅ |
| 8 | Cập nhật cọc | 💰 | ✅ | ✅ |
| 9 | Thanh toán phần còn lại | 💳 | ❌ | ✅ |
| 10 | Cọc được phát hành | 💸 | ✅ | ❌ |
| 11 | Thêm tiền vào ví | 🏧 | ✅ | ✅ |
| 12-16 | Nhắc nhở thu hoạch | 📅⏰⚠️🔴🆘 | ✅ | ❌ |

## 📂 Code Structure

### Services

#### 1. `userNotificationService.ts` ⭐ NEW
```typescript
// REST API calls
getUserNotifications(pageNumber, pageSize): Promise<UserNotification[]>
getUnreadNotificationCount(): Promise<number>
markNotificationAsRead(notificationId): Promise<boolean>

// Helper functions
getNotificationTypeName(type: number): string
getNotificationIcon(type: number): string
getNotificationColor(severity: number): string
```

**Đặc điểm:**
- Extract userId từ JWT token trong AsyncStorage
- Gọi REST API để lấy notifications từ DB
- Không cache, luôn lấy data mới nhất từ server

#### 2. `signalRService.ts` (Existing)
```typescript
// SignalR connection
connect(): Promise<void>
disconnect(): Promise<void>

// Event listeners
onNewNotification(handler: (event: NewNotificationEvent) => void): () => void
onBidPlaced(handler: (event: BidPlacedEvent) => void): () => void
onBuyNow(handler: (event: BuyNowEvent) => void): () => void
```

**Đặc điểm:**
- Maintain persistent WebSocket connection
- Auto-reconnect khi mất kết nối
- Broadcast events real-time

### Components

#### `NotificationModal.tsx` ✅ UPDATED
```typescript
interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  role: 'farmer' | 'wholesaler';
  onRefresh?: () => void;
  notifications?: UserNotification[];
  onNotificationsChange?: (notifications: UserNotification[]) => void;
}
```

**Chức năng:**
- Hiển thị danh sách notifications
- Pull to refresh để reload
- Click để mark as read
- Real-time update khi có notification mới (từ parent state)

### Screens

#### `app/(tabs)/farmer/home/index.tsx` ✅ UPDATED
```typescript
// State
const [notifications, setNotifications] = useState<UserNotification[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotificationModal, setShowNotificationModal] = useState(false);

// Setup SignalR
useEffect(() => {
  const unsubscribe = signalRService.onNewNotification((event) => {
    // Convert event to UserNotification
    const userNotification: UserNotification = {...};
    
    // Add to notifications list
    setNotifications(prev => [userNotification, ...prev]);
    
    // Reload unread count
    loadUnreadNotifications();
  });
  
  return unsubscribe;
}, []);
```

#### `app/(tabs)/wholesaler/home/index.tsx` ✅ UPDATED
Tương tự farmer, nhưng filter notifications khác nhau.

## 🎯 Đặc Điểm Quan Trọng

### ✅ Real-Time Updates
- SignalR broadcast ngay lập tức khi có event
- Frontend nhận và hiển thị KHÔNG CẦN RELOAD
- Badge số cập nhật tự động

### ✅ Modal Luôn Mở Vẫn Nhận Notifications
- Notifications state ở parent screen
- Modal chỉ hiển thị, không quản lý state
- SignalR event → Update parent state → Modal re-render

### ✅ Lấy UserID Từ JWT Token
- Không cần truyền userId từ frontend
- Service tự động decode JWT token
- Extract userId từ payload

### ✅ Không Cache, Luôn Fresh Data
- Modal load data từ API mỗi lần mở
- SignalR cập nhật real-time
- Đảm bảo data luôn đúng và mới nhất

## 🔄 Flow Diagram

```
┌─────────────────┐
│  Backend Event  │
│ (Admin approve) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SignalR Broadcast│
│  ReceiveNotif   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SignalR Service │
│  .onNewNotif()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend Handler│
│  Convert Event  │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ Update Notifs   │ │ Update Badge    │
│  Array State    │ │  loadUnread()   │
└─────────────────┘ └─────────────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  UI Re-render   │
         │  Bell + Modal   │
         └─────────────────┘
```

## 📝 Testing Checklist

### Test 1: Admin Approve Auction
- [ ] Admin approve auction trên backend
- [ ] Farmer nhận notification ngay lập tức
- [ ] Bell icon hiện badge số (ví dụ: 4)
- [ ] Click bell → Modal hiển thị notification mới

### Test 2: Modal Đang Mở
- [ ] Farmer mở notification modal
- [ ] Admin approve auction khác
- [ ] Notification xuất hiện ở đầu list trong modal
- [ ] Không cần đóng/mở lại modal

### Test 3: Mark As Read
- [ ] Click vào 1 notification
- [ ] Badge "chưa đọc" biến mất
- [ ] Bell icon badge giảm số (4 → 3)
- [ ] Reload modal vẫn đúng trạng thái

### Test 4: Multiple Users
- [ ] 2 farmer khác nhau
- [ ] Admin approve auction của farmer 1
- [ ] Chỉ farmer 1 nhận notification
- [ ] Farmer 2 không nhận

## 🚨 Lưu Ý Quan Trọng

### ⚠️ SignalR Connection
- Phải gọi `signalRService.connect()` trước khi subscribe
- Auto-reconnect khi mất kết nối
- Check logs để đảm bảo connection thành công

### ⚠️ JWT Token
- Token phải valid và chưa expire
- Service tự động refresh token nếu cần
- UserID được extract từ token payload

### ⚠️ Backend Requirements
- Backend PHẢI broadcast SignalR event khi có sự kiện
- Event PHẢI có đầy đủ fields: id, userId, type, title, message, etc.
- Backend PHẢI lưu notification vào DB

### ⚠️ Performance
- Không cache notifications để tránh stale data
- Load notifications mỗi lần mở modal (acceptable vì có pull-to-refresh)
- SignalR real-time nên không cần polling

## 🎉 Kết Luận

Hệ thống thông báo đã được implement đầy đủ với:
✅ Real-time SignalR broadcasts
✅ REST API cho CRUD operations
✅ JWT authentication
✅ Role-based filtering
✅ Pull-to-refresh
✅ Badge count updates
✅ Modal luôn mở vẫn nhận notifications

**Flow hoàn chỉnh:**
Admin approve → SignalR broadcast → Frontend nhận event → Update UI ngay lập tức → User thấy notification trong modal (ngay cả khi modal đang mở).
