# Hướng dẫn tích hợp SignalR autobid cho mobile React Native

Tài liệu ngắn gọn dành cho team mobile RN để nhận realtime bid/auto-bid/extend từ Auction service.

## 1) Cài đặt gói & polyfill

```bash
yarn add @microsoft/signalr
# Nếu app RN chưa có WebSocket global (thường đã có sẵn):
# yarn add react-native-webview --dev   # chỉ khi cần polyfill đặc biệt
# yarn add react-native-get-random-values
```

**Lưu ý:** RN đã có `WebSocket` & `EventSource`, không cần `ws` như web. Nếu app bị lỗi random UUID, import:
```ts
import "react-native-get-random-values";
```

## 2) Endpoint & auth

- Hub: `wss://<gateway-host>/auctionhub` (qua API Gateway nếu có)
- Tham số truy cập: Bearer token (JWT) từ Identity
- Query cần gửi: `auctionId` (để join group cho phiên đấu giá cụ thể)

## 3) Sự kiện cần lắng nghe

- `BidPlaced` (hoặc `ReceiveBidPlacedEvent`): giá hiện tại, user đang dẫn, IsAutoBid
- `AuctionExtended`: endDate mới (anti-sniping)
- (Nếu có) `AuctionPaused` / `AuctionResumed` (tuỳ cấu hình backend)

## 4) Mẫu code RN (TypeScript)

```ts
import "react-native-get-random-values";
import { HubConnectionBuilder, LogLevel, HubConnectionState } from "@microsoft/signalr";

type BidPayload = {
  auctionId: string;
  bidId: string;
  userId: string;
  userName: string;
  bidAmount: number;
  isAutoBid: boolean;
  placedAt: string;
};

type ExtendPayload = {
  auctionId: string;
  oldEndDate: string;
  newEndDate: string;
  extensionSeconds: number;
};

export const createAuctionConnection = ({
  baseUrl,
  token,
  auctionId,
}: {
  baseUrl: string; // https://api.example.com (Gateway)
  token: string;   // JWT
  auctionId: string;
}) => {
  const conn = new HubConnectionBuilder()
    .withUrl(`${baseUrl}/auctionhub?auctionId=${auctionId}`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Information)
    .build();

  const start = async () => {
    if (conn.state === HubConnectionState.Disconnected) {
      await conn.start();
      console.log("SignalR connected");
    }
  };

  // Sự kiện bid mới
  conn.on("BidPlaced", (payload: BidPayload) => {
    console.log("BidPlaced", payload);
    // TODO: cập nhật UI giá hiện tại, người dẫn, highlight auto-bid nếu isAutoBid = true
  });

  // Sự kiện gia hạn
  conn.on("AuctionExtended", (payload: ExtendPayload) => {
    console.log("AuctionExtended", payload);
    // TODO: cập nhật countdown endDate = payload.newEndDate
  });

  // Reconnect
  conn.onreconnected(() => {
    console.log("SignalR reconnected");
  });

  conn.onclose((err) => {
    console.warn("SignalR closed", err);
  });

  return { conn, start };
};
```

## 5) Quy trình màn đấu giá (đề xuất)

1. Lấy `auctionId`, `accessToken`
2. Tạo connection, gọi `start()`
3. Lắng nghe `BidPlaced`, `AuctionExtended`
4. Khi user đặt bid:
   - Gọi API `PUT /bid/place` (Gateway → Auction API)
   - UI cập nhật optimistic, sau đó chờ event `BidPlaced` để đồng bộ

## 6) Lưu ý về thời gian & countdown

- Dùng `newEndDate` từ event `AuctionExtended` để reset countdown.
- Đồng bộ thời gian server: nên lấy `DateTime` từ payload; tránh dùng clock client để tính endDate.

## 7) Xử lý auto-bid trên UI

- Server gửi `isAutoBid` trong event `BidPlaced`.
- Nếu bid mới có `isAutoBid = true`: hiển thị tag “Auto-bid”.
- Nếu user bật auto-bid (qua API riêng), backend sẽ tự push event khi auto-bid được kích hoạt; không cần call SignalR khác.

## 8) Debug nhanh

- Bật log: `configureLogging(LogLevel.Information)`
- Kiểm tra token hết hạn: onclose → refresh token → create new connection.
- Nếu không nhận event: kiểm tra query `auctionId` đúng nhóm và JWT hợp lệ.

