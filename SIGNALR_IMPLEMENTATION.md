# SignalR Real-time Implementation - Mobile App (Updated)

## 🎯 Tổng quan
Hệ thống đã loại bỏ hoàn toàn polling (auto-reload) và chuyển sang **100% SignalR** cho cập nhật real-time trong các trang auction detail của cả **Wholesaler** và **Farmer**.

---

## ✅ Xác nhận: KHÔNG có Auto-reload

### ✅ Đã loại bỏ hoàn toàn:
- ❌ **Không có `setInterval`** nào trong auction detail pages
- ❌ **Không có polling timer**
- ❌ **Không có auto-refresh** sau mỗi X giây

### ✅ Chỉ có:
- ✅ **SignalR events** cho real-time updates (instant, 0ms)
- ✅ **Retry delays** (300ms, 600ms) trong optimistic UI logic - **KHÔNG phải auto-reload, chỉ retry 3 lần rồi dừng**
- ✅ **One-time delay** khi user tự tạo bid (300ms) - **KHÔNG lặp lại**

---

## 🏗️ Kiến trúc SignalR

### SignalR Hub
- **URL**: `https://gateway.a-379.store/api/auction-service/hubs/global`
- **Protocol**: WebSocket với fallback
- **Authentication**: JWT token trong headers

### Events được lắng nghe
1. **BidPlaced**: Khi có bid mới được đặt
   ```typescript
   {
     auctionId: string,
     bidId: string,
     userId: string,
     userName: string,
     bidAmount: number,
     previousPrice: number,
     newPrice: number,
     placedAt: string (ISO timestamp)
   }
   ```

2. **BuyNow**: Khi có người mua ngay
3. **NewNotification**: Thông báo mới
4. **SystemNotification**: Thông báo hệ thống

---

## 📱 Implementation Chi tiết

### 1. Wholesaler Auction Detail
**File**: `app/(tabs)/wholesaler/home/auction-detail/index.tsx`

#### SignalR Integration (Lines 102-195)
```typescript
// Setup connection
useEffect(() => {
  signalRService.connect()
  signalRService.joinAuctionGroup(auctionId)
  
  // Subscribe to BidPlaced event
  const unsubscribe = signalRService.onBidPlaced((event) => {
    // 1. Update giá ngay lập tức (0ms)
    setAuction(prev => ({ ...prev, currentPrice: event.newPrice }))
    
    // 2. Tạo optimistic bid log
    const optimisticBid = { ...event, id: `${event.bidId}-optimistic` }
    setAllBidLogs(prev => [optimisticBid, ...prev])
    
    // 3. Reload API trong background (không có loading spinner)
    loadAllBidsQuietly(auctionId)
    loadBidsQuietly(auctionId)
  })
  
  return () => {
    signalRService.leaveAuctionGroup(auctionId)
    unsubscribe()
  }
}, [auctionId])
```

#### Optimistic UI Pattern
- **Instant Update (0ms)**: Hiển thị bid từ SignalR event ngay lập tức
- **Background Sync (0-900ms)**: 
  - Attempt 1: 0ms delay
  - Attempt 2: 300ms delay (nếu attempt 1 không có data mới)
  - Attempt 3: 600ms delay (nếu attempt 2 vẫn không có data mới)
  - **DỪNG sau 3 attempts** - KHÔNG lặp lại
- **Timestamp Comparison**: So sánh `dateTimeUpdate` để quyết định update state
- **Keep Optimistic**: Nếu sau 900ms API vẫn trả stale data, giữ optimistic bid

#### Quiet Reload Functions (No Loading Spinner)
**`loadAllBidsQuietly()`** (Lines 299-368):
```typescript
const loadAllBidsQuietly = useCallback(async (id, retryCount = 0) => {
  // ❌ KHÔNG gọi setLoadingAllBids(true)
  
  if (retryCount > 0) {
    await new Promise(resolve => setTimeout(resolve, 300 * retryCount))
  }
  
  const data = await getAllBidsForAuction(id)
  
  // Compare timestamp
  if (apiLatestTime > stateLatestTime) {
    setAllBidLogs(data) // Update với data mới
  } else if (retryCount < 2) {
    loadAllBidsQuietly(id, retryCount + 1) // Retry (max 3 lần)
  }
  // Sau 3 attempts → DỪNG, giữ optimistic data
}, [])
```

**`loadBidsQuietly()`** (Lines 370-386):
```typescript
const loadBidsQuietly = useCallback(async (id) => {
  // ❌ KHÔNG gọi setLoadingBids(true)
  const data = await getBidsForAuction(id)
  setBids(data)
}, [])
```

#### Xử lý khi Mobile tự tạo Bid (Lines 994-1010)
```typescript
onBidCreated={() => {
  // ❌ KHÔNG reload toàn trang (loadAuctionDetail)
  // ✅ CHỈ reload bid lists với delay 300ms (ONE-TIME, không lặp)
  setTimeout(() => {
    loadAllBidsQuietly(auctionId)
    loadBidsQuietly(auctionId)
  }, 300) // KHÔNG lặp lại
  
  // ✅ Giá hiện tại tự động cập nhật qua SignalR event
}
```

**Lý do**: Tránh race condition của backend (SignalR emit trước DB commit 50-150ms)

---

### 2. Farmer Auction Detail
**File**: `app/pages/farmer/auction-detail/index.tsx`

#### SignalR Integration (Lines 22-88)
```typescript
useEffect(() => {
  signalRService.connect()
  signalRService.joinAuctionGroup(auctionId)
  
  const unsubscribe = signalRService.onBidPlaced((event) => {
    // Update giá
    setAuction(prev => ({ ...prev, currentPrice: event.newPrice }))
    
    // Tạo optimistic bid log
    const optimisticBid = { ...event }
    setBidLogs(prev => [optimisticBid, ...prev])
    
    // Quiet reload
    loadBidLogsQuietly(auctionId)
  })
  
  return () => {
    signalRService.leaveAuctionGroup(auctionId)
    unsubscribe()
  }
}, [auctionId])
```

#### Quiet Reload Function
**`loadBidLogsQuietly()`** (Lines 56-88):
- Tương tự wholesaler: retry logic, timestamp comparison
- ❌ KHÔNG có loading spinner
- Max 3 attempts rồi DỪNG

---

## 🎨 UI Components

### AllBidsDisplay (Wholesaler)
**File**: `components/wholesaler/AllBidsDisplay.tsx`

```typescript
<ScrollView 
  style={{ maxHeight: 560 }} // Hiển thị 5 bids
  showsVerticalScrollIndicator={true}
  nestedScrollEnabled={true}
>
  {sortedBidLogs.map((log) => (
    <BidItem key={log.id} data={log} />
  ))}
</ScrollView>
```

- **maxHeight**: 560px → hiển thị đúng 5 bids
- **Scroll**: Cuộn để xem thêm nếu > 5 bids
- **Sort**: `dateTimeUpdate` descending (mới nhất lên đầu)

### BidLogDisplay (Farmer)
**File**: `components/farmer/BidLogDisplay.tsx`

- **maxHeight**: 450px → ~5 bids
- **Scroll**: Có thể cuộn
- **Sort**: `dateTimeUpdate` descending

---

## ⚙️ Backend Race Condition & Solution

### Vấn đề
```
T+0ms:   Client tạo bid
T+50ms:  Backend emit SignalR event ← Client nhận ngay
T+150ms: Backend commit vào database ← API mới có data
```

→ Nếu client fetch ngay sau khi nhận SignalR (T+50ms), API trả về stale data

### Giải pháp: Optimistic UI + Smart Retry

#### 1. Optimistic Update (T+0ms)
```typescript
// Nhận SignalR event
const optimisticBid = {
  id: `${event.bidId}-optimistic`,
  userName: event.userName,
  bidAmount: event.bidAmount,
  dateTimeUpdate: event.placedAt, // Timestamp từ event
  ...
}

// Update UI ngay lập tức
setAllBidLogs(prev => [optimisticBid, ...prev])
// → User thấy update real-time (0ms delay)
```

#### 2. Background Sync với Retry (T+0 → T+900ms, KHÔNG lặp)
```typescript
// Attempt 1: T+0ms
const data = await getAllBidsForAuction(id)
if (data[0].dateTimeUpdate > state[0].dateTimeUpdate) {
  setAllBidLogs(data) // Data mới → update
  return // ← DỪNG
} else {
  // Data cũ → retry attempt 2
}

// Attempt 2: T+300ms
await sleep(300)
const data = await getAllBidsForAuction(id)
if (newer) {
  setAllBidLogs(data)
  return // ← DỪNG
}

// Attempt 3: T+600ms
await sleep(300)
const data = await getAllBidsForAuction(id)
if (newer) {
  setAllBidLogs(data)
} else {
  // Giữ optimistic data
}
// ← DỪNG, không retry nữa
```

**KHÔNG có auto-reload, chỉ retry 3 lần rồi DỪNG hẳn**

#### 3. Timestamp Comparison
```typescript
const apiLatestTime = new Date(apiData[0].dateTimeUpdate).getTime()
const stateLatestTime = new Date(currentState[0].dateTimeUpdate).getTime()

if (apiLatestTime > stateLatestTime) {
  setAllBidLogs(apiData) // API có data mới → update
} else {
  // API vẫn stale → retry hoặc giữ optimistic
}
```

---

## 📊 Flow hoàn chỉnh

### Scenario 1: Web đặt bid mới
```
1. Web tạo bid → Backend nhận
2. Backend emit SignalR event (T+50ms)
3. Mobile nhận event (T+50ms)
   ├─ Update currentPrice ✅ (0ms delay)
   ├─ Add optimistic bid log ✅ (0ms delay)
   └─ Start background sync
4. Background sync:
   ├─ Attempt 1 (T+50ms): API stale → skip
   ├─ Attempt 2 (T+350ms): API stale → skip
   └─ Attempt 3 (T+650ms): API có data → replace optimistic
5. DỪNG (không retry nữa)
```

**Kết quả**: Giá và bid list đều update ngay lập tức ✅

### Scenario 2: Mobile tự tạo bid
```
1. Mobile tạo bid → Backend nhận
2. Backend emit SignalR event (T+50ms)
3. Mobile nhận event của chính mình (T+50ms)
   ├─ Update currentPrice từ SignalR ✅
   ├─ Add optimistic bid log ✅
   └─ KHÔNG reload toàn trang
4. onBidCreated callback (T+300ms):
   └─ Reload bid lists quietly (ONE-TIME)
5. Background sync (3 attempts max)
6. DỪNG
```

**Kết quả**: Giá và bid list đều update qua SignalR ✅

---

## 🔍 Kiểm tra Code - Không có Auto-reload

### Wholesaler
```bash
grep -n "setInterval" app/(tabs)/wholesaler/home/auction-detail/index.tsx
# → No matches
```

Các `setTimeout` tìm thấy:
1. Line 327, 391: Retry delays trong `loadAllBidsQuietly()` - **KHÔNG lặp lại**
2. Line 1003: One-time delay trong `onBidCreated` - **KHÔNG lặp lại**

### Farmer
```bash
grep -n "setInterval" app/pages/farmer/auction-detail/index.tsx
# → No matches
```

Các `setTimeout` tìm thấy:
1. Line 83, 147: Retry delays trong `loadBidLogsQuietly()` - **KHÔNG lặp lại**

**Tất cả đều là retry logic, KHÔNG phải auto-reload timer!**

---

## 🎁 Benefits

### 1. Real-time Performance
- **0ms delay**: User thấy update ngay lập tức
- **No polling**: Không có network overhead
- **Scalable**: SignalR push > client pull

### 2. Smooth UX
- **No loading flicker**: Quiet reload không có spinner
- **Optimistic UI**: Instant feedback
- **Seamless**: Background sync không gián đoạn

### 3. Handle Backend Issues
- **Race condition**: Optimistic + retry
- **Network delays**: Keep optimistic nếu API slow
- **Stale data**: Timestamp comparison

---

## 🐛 Debug Logs

### SignalR Connection
```
SignalR: Connected successfully
SignalR: Joined auction group {auctionId}
```

### Event Received
```
🔔 Wholesaler: BidPlaced event received
  auctionId: xxx
  userName: xxx
  bidAmount: xxx
  newPrice: xxx
✅ Event matches current auction
💰 Price: 1000000 → 1100000
⚡ Adding optimistic bid: 1100000
```

### Background Sync
```
🔄 Quiet: loadAllBids, retry: 0
✅ Fetched 26 bid logs
📊 API: 17:16:38 | State: 17:16:38 | Newer? false
⏭️ Retry: 1

🔄 Quiet: loadAllBids, retry: 1
✅ Fetched 26 bid logs
📊 API: 17:16:45 | State: 17:16:38 | Newer? true
✅ Updated state
← DỪNG
```

---

## 📝 Files Modified

### Core Logic
- ✅ `app/(tabs)/wholesaler/home/auction-detail/index.tsx`
- ✅ `app/pages/farmer/auction-detail/index.tsx`
### Services
- ✅ `services/signalRService.ts` - SignalR connection management
  - JWT authentication
  - Auto-reconnect with exponential backoff
  - Event handlers: BidPlaced, BuyNow, NewNotification
  - Join/leave auction groups

### UI Components
- ✅ `components/wholesaler/AllBidsDisplay.tsx` - 5 bids display với scroll
- ✅ `components/farmer/BidLogDisplay.tsx` - Bid log display

### Providers
- ✅ `components/shared/SignalRProvider.tsx` - Global lifecycle management

---

## ✅ Conclusion

### Hệ thống hiện tại:
- ✅ **100% SignalR** cho real-time updates
- ✅ **0% Polling** - KHÔNG có auto-reload intervals
- ✅ **Optimistic UI** cho instant UX (0ms)
- ✅ **Smart Retry** xử lý backend race condition (max 3 attempts, DỪNG)
- ✅ **Quiet Reload** không có loading spinner flicker
- ✅ **Timestamp-based Sync** reliable hơn count-based
- ✅ **Works cho cả Web → Mobile và Mobile → Mobile**

### Retry Logic ≠ Auto-reload:
- ❌ **Auto-reload**: `setInterval(() => fetch(), 3000)` ← lặp vô hạn
- ✅ **Retry**: 3 attempts (0ms, 300ms, 600ms) → DỪNG ← KHÔNG lặp lại

**Tất cả `setTimeout` đều là retry logic ONE-TIME, KHÔNG phải auto-reload timer!**

---

## 🔧 Maintenance Notes

### Khi backend fix race condition:
- Có thể giảm retry từ 3 → 1 attempt
- Có thể giảm delay từ 300ms → 100ms
- Vẫn nên giữ optimistic UI cho instant UX

### Khi thêm events mới:
- Subscribe trong `useEffect`
- Unsubscribe trong cleanup function
- Leave group khi unmount

### Khi debug:
- Check logs: `🔔`, `✅`, `⚡`, `🔄`, `📊`
- Verify timestamp comparison
- Monitor retry attempts (max 3)
- Check SignalR connection state

### 2. **Global Provider** (`app/providers/SignalRProvider.tsx`)
- App-wide connection lifecycle
- Auto-reconnect on foreground
- Auto-disconnect on background

### 3. **Removed Polling**
- ❌ Removed: `setInterval` polling every 3-5 seconds
- ✅ Replaced with: SignalR real-time events

### 4. **Updated Pages**

#### Wholesaler Auction Detail
- **File**: `app/(tabs)/wholesaler/home/auction-detail/index.tsx`
- **Events**:
  - `BidPlaced` → Updates current price + reloads bid logs
  - `BuyNow` → Reloads auction detail
- **Functions**:
  - `loadAllBidsQuietly()` - Updates all bid logs
  - `loadBidsQuietly()` - Updates user's bids

#### Farmer Auction Detail
- **File**: `app/pages/farmer/auction-detail/index.tsx`
- **Events**:
  - `BidPlaced` → Updates current price + reloads bid logs
  - `BuyNow` → Shows alert notification
- **Functions**:
  - `loadBidLogsQuietly()` - Updates all bid logs

## 📊 Performance Comparison

### Before (Polling):
```
❌ API call every 3 seconds
❌ Delay: 0-3 seconds to get updates
❌ High bandwidth usage
❌ Battery drain
---

*Tài liệu được cập nhật: December 4, 2025*
*Version: 2.0 - Optimistic UI with Smart Retry*
