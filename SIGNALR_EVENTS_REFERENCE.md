# SignalR Events Reference - AgriMart System

## Table of Contents
- [Overview](#overview)
- [Hub Connection](#hub-connection)
- [Server-to-Client Events](#server-to-client-events)
- [Client-to-Server Methods](#client-to-server-methods)
- [Group Management](#group-management)
- [Event Contracts](#event-contracts)
- [Architecture](#architecture)

---

## Overview

The AgriMart system uses **SignalR** for real-time communication between server and clients. All real-time events are routed through the `GlobalHub` located at:

**Hub URL:** `/hubs/global`

**Production:** `https://gateway.a-379.store/api/auction-service/hubs/global`

### Authentication
- **Required:** Yes (JWT Bearer Token)
- **Claim:** `id` (User ID from JWT)
- **Method:** Query string parameter `access_token` or Authorization header

---

## Hub Connection

### Connection Setup

#### JavaScript/TypeScript
```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl('https://gateway.a-379.store/api/messaging-service/hubs/global', {
        accessTokenFactory: () => jwtToken,
        transport: signalR.HttpTransportType.WebSockets | 
                   signalR.HttpTransportType.ServerSentEvents | 
                   signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect()
    .build();

await connection.start();
```

### Connection Lifecycle

#### OnConnectedAsync
- **Trigger:** User successfully connects to hub
- **Action:** User is automatically added to their personal group `user:{userId}`
- **Authorization:** Connection aborted if `id` claim is missing

#### OnDisconnectedAsync
- **Trigger:** User disconnects from hub
- **Action:** User is removed from all groups including `user:{userId}`

---

## Server-to-Client Events

These are events sent FROM the server TO the client. Clients must register handlers for these events.

### 1. ReceiveNotification

Sent when a user receives a new notification.

**Event Name:** `ReceiveNotification` or `{NotificationType}` (dynamic based on notification type)

**Payload:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "Outbid | AuctionEnded | AuctionWon | AuctionApproved | AuctionPaused | AuctionStarted | System | EscrowDepositSuccess | EscrowRemainingPaymentSuccess | EscrowReleaseReceived | WalletFundsAdded",
  "severity": "Info | Warning | Critical",
  "title": "string",
  "message": "string",
  "isRead": false,
  "readAt": null,
  "data": "string (optional JSON)",
  "relatedEntityId": "uuid (optional)",
  "relatedEntityType": "string (optional)",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Notification Types:**
- `Outbid` (1) - User has been outbid by another user
- `AuctionEnded` (2) - Auction has ended
- `AuctionWon` (3) - User has won the auction
- `AuctionApproved` (4) - Auction has been approved by admin
- `AuctionPaused` (5) - Auction has been paused
- `AuctionStarted` (6) - Auction has started
- `System` (7) - System notification
- `EscrowDepositSuccess` (8) - Deposit payment successful
- `EscrowRemainingPaymentSuccess` (9) - Remaining payment successful
- `EscrowReleaseReceived` (10) - Received funds from escrow
- `WalletFundsAdded` (11) - Funds added to wallet

**Severity Levels:**
- `Info` (0) - Informational
- `Warning` (1) - Warning
- `Critical` (2) - Critical

**Target:** Specific user (`Clients.User(userId)`)

**Client Handler:**
```javascript
connection.on('ReceiveNotification', (notification) => {
    console.log('New notification:', notification);
    // Update UI, show toast, etc.
});

// Or listen to specific notification type
connection.on('Outbid', (notification) => {
    console.log('You have been outbid!', notification);
});

connection.on('AuctionWon', (notification) => {
    console.log('Congratulations! You won the auction!', notification);
});
```

---

### 2. BidPlaced

Sent when a new bid is placed on an auction (real-time update).

**Event Name:** `BidPlaced`

**Payload:**
```json
{
  "auctionId": "uuid",
  "bidId": "uuid",
  "userId": "uuid",
  "userName": "string",
  "bidAmount": 1000000.00,
  "previousPrice": 800000.00,
  "newPrice": 1000000.00,
  "placedAt": "2024-01-01T00:00:00Z"
}
```

**Target:** Auction group (`Clients.Group("auction:{auctionId}")`)

**Client Handler:**
```javascript
connection.on('BidPlaced', (bid) => {
    console.log('New bid placed:', bid);
    // Update auction price display
    // Highlight new bid in bid history
    // Play notification sound
});
```

**Note:** Users must join the auction group to receive these events (see [JoinAuctionGroup](#joinauctiongroup)).

---

### 3. BuyNow

Sent when a user purchases an item using "Buy Now" feature.

**Event Name:** `BuyNow`

**Payload:**
```json
{
  "auctionId": "uuid",
  "userId": "uuid",
  "userName": "string",
  "purchaseAmount": 5000000.00,
  "purchasedAt": "2024-01-01T00:00:00Z"
}
```

**Target:** Auction group (`Clients.Group("auction:{auctionId}")`)

**Client Handler:**
```javascript
connection.on('BuyNow', (purchase) => {
    console.log('Item purchased:', purchase);
    // Disable bidding
    // Show "Sold" status
    // Redirect or update UI
});
```

---

### 4. SystemNotification

Sent for system-wide announcements and maintenance notifications.

**Event Name:** `SystemNotification`

**Payload:**
```json
{
  "type": "string",
  "content": "string",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Target:** All connected clients (`Clients.All`)

**Client Handler:**
```javascript
connection.on('SystemNotification', (notification) => {
    console.log('System notification:', notification);
    // Show banner or modal
    // Alert users of maintenance
});
```

**Common Types:**
- `Maintenance` - System maintenance scheduled
- `Update` - System update notification
- `Alert` - Important system alert
- `Info` - General information

---

## Client-to-Server Methods

These are methods that clients can INVOKE on the server.

### 1. GetUnreadNotificationCount

Get the count of unread notifications for the current user.

**Method:** `GetUnreadNotificationCount`

**Parameters:** None (uses JWT user ID)

**Returns:** `number` (count of unread notifications)

**Example:**
```javascript
const unreadCount = await connection.invoke('GetUnreadNotificationCount');
console.log('Unread notifications:', unreadCount);
```

**Authorization:** Requires authenticated user with valid JWT token

**Error Handling:**
```javascript
try {
    const count = await connection.invoke('GetUnreadNotificationCount');
    updateBadge(count);
} catch (err) {
    console.error('Failed to get unread count:', err);
}
```

---

### 2. JoinAuctionGroup

Join a specific auction group to receive real-time updates for that auction.

**Method:** `JoinAuctionGroup`

**Parameters:**
- `auctionId` (string/uuid) - The ID of the auction to join

**Returns:** `void` (Task)

**Example:**
```javascript
await connection.invoke('JoinAuctionGroup', auctionId);
console.log(`Joined auction group: ${auctionId}`);
```

**Group Name:** `auction:{auctionId}`

**Authorization:** Requires authenticated user

**Use Case:**
- User opens auction detail page
- User wants to receive real-time bid updates
- User participates in auction

---

### 3. LeaveAuctionGroup

Leave a specific auction group to stop receiving updates.

**Method:** `LeaveAuctionGroup`

**Parameters:**
- `auctionId` (string/uuid) - The ID of the auction to leave

**Returns:** `void` (Task)

**Example:**
```javascript
await connection.invoke('LeaveAuctionGroup', auctionId);
console.log(`Left auction group: ${auctionId}`);
```

**Use Case:**
- User navigates away from auction page
- User closes auction detail
- Clean up when component unmounts

---

## Group Management

### User Groups

#### Personal User Group
- **Format:** `user:{userId}`
- **Auto-join:** Yes (on connection)
- **Purpose:** Send notifications to specific user
- **Scope:** Private, user-specific notifications

#### Auction Groups
- **Format:** `auction:{auctionId}`
- **Auto-join:** No (must call `JoinAuctionGroup`)
- **Purpose:** Broadcast auction events to participants
- **Scope:** Public, auction-specific updates

### Group Lifecycle

```javascript
// On mount/page load
await connection.start();
await connection.invoke('JoinAuctionGroup', currentAuctionId);

// On navigation/unmount
await connection.invoke('LeaveAuctionGroup', currentAuctionId);
await connection.stop();
```

---

## Event Contracts

### Message Bus Events

The system uses **MassTransit** for event-driven architecture. Events are published to RabbitMQ and consumed by various services.

#### BidPlacedEvent

Published when a bid is placed, consumed by multiple workers.

```csharp
public record BidPlacedEvent
{
    public Guid BidId { get; init; }
    public Guid AuctionId { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; }
    public decimal BidAmount { get; init; }
    public decimal PreviousPrice { get; init; }
    public DateTime PlacedAt { get; init; }
    public string IdempotencyKey { get; init; } // Format: {BidId}_{PlacedAt.Ticks}
}
```

**Consumers:**
1. `BidPlacedSignalRConsumer` - Broadcasts to SignalR group
2. `BidPlacedConsumer` - Batch processing and persistence
3. `BidPlacedNotificationConsumer` - Creates notifications

---

#### CreateNotificationEvent

Published to create a new notification for a user.

```csharp
public class CreateNotificationEvent
{
    public Guid UserId { get; set; }
    public int Type { get; set; } // NotificationType enum
    public int Severity { get; set; } // NotificationSeverity enum
    public string Title { get; set; }
    public string Message { get; set; }
    public string? Data { get; set; }
    public Guid? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
}
```

**Consumer:**
- `CreateNotificationEventConsumer` - Creates notification and sends via SignalR

---

## Architecture

### Components

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend Client                          │
│  - React/Vue/Angular                                          │
│  - SignalR Client Library                                     │
│  - Event Handlers & UI Updates                                │
└───────────────────────────┬──────────────────────────────────┘
                            │ WebSocket/SSE/LongPolling
                            │ (with JWT Authentication)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      Gateway (Reverse Proxy)                  │
│  - YARP Gateway                                               │
│  - Route: /api/auction-service/hubs/global                    │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      GlobalHub (SignalR Hub)                  │
│  - Hosted in Auction.API                                      │
│  - JWT Authentication                                          │
│  - User & Group Management                                    │
│  - Methods: GetUnreadNotificationCount, JoinAuctionGroup, etc│
└───────────────────────────┬──────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌──────────────────────┐
    │  INotifier Service│   │  IMessageBus Service │
    │  (Notifier.cs)    │   │  (MassTransit)       │
    └────────┬──────────┘   └──────────┬───────────┘
             │                          │
             │ SendToUserAsync          │ PublishAsync
             │ SendToGroupAsync         │ RequestAsync
             │ BroadcastAsync           │
             │                          ▼
             │              ┌───────────────────────┐
             │              │     RabbitMQ          │
             │              │  - BidPlacedEvent     │
             │              │  - NotificationEvent  │
             │              └───────┬───────────────┘
             │                      │
             │                      ▼
             │          ┌────────────────────────────┐
             │          │  Event Consumers (Workers) │
             │          │  - BidPlacedSignalRConsumer│
             │          │  - NotificationConsumer    │
             │          └────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│                  SignalR Clients (HubContext)                 │
│  - Clients.User(userId)                                       │
│  - Clients.Group(groupName)                                   │
│  - Clients.All                                                │
└──────────────────────────────────────────────────────────────┘
```

### Message Flow

#### Example: Bid Placed Flow

1. **User places bid** → `BidService.PlaceBidAsync()`
2. **Validate and save** → Redis + Database
3. **Publish event** → `BidPlacedEvent` to RabbitMQ
4. **Consumer processes** → `BidPlacedSignalRConsumer` receives event
5. **Broadcast to group** → `_notifier.SendToGroupAsync("auction:{auctionId}", "BidPlaced", data)`
6. **SignalR sends** → All clients in auction group receive `BidPlaced` event
7. **Client updates UI** → React component updates price display

#### Example: Notification Flow

1. **Event occurs** → System publishes `CreateNotificationEvent`
2. **Consumer receives** → `CreateNotificationEventConsumer` processes event
3. **Save to DB** → Notification entity created
4. **Send via SignalR** → `_notifier.SendToUserAsync(userId, notificationType, data)`
5. **Client receives** → User's device shows notification
6. **Update badge** → Client calls `GetUnreadNotificationCount()`

---

### Service Integration

#### INotifier Interface

Location: `src\Shared\RealTime\Interfaces\INotifier.cs`

**Core Methods:**
- `SendToUserAsync(userId, method, message)` - Send to specific user
- `SendToGroupAsync(groupName, method, message)` - Send to group
- `BroadcastAsync(method, message)` - Send to all connected clients
- `SendSystemNotificationAsync(type, content)` - System-wide notification

**Group Management:**
- `AddUserToGroupAsync(connectionId, groupName)`
- `RemoveUserFromGroupAsync(connectionId, groupName)`

**Lifecycle Events:**
- `OnUserConnectedAsync(userId, connectionId)`
- `OnUserDisconnectedAsync(userId, connectionId)`

---

## Best Practices

### Client-Side

1. **Always handle reconnection:**
```javascript
connection.onreconnecting(() => {
    console.log('Reconnecting...');
    showReconnectingIndicator();
});

connection.onreconnected(() => {
    console.log('Reconnected!');
    // Rejoin groups
    rejoinCurrentAuctionGroup();
});
```

2. **Clean up on unmount:**
```javascript
useEffect(() => {
    connection.start();
    connection.invoke('JoinAuctionGroup', auctionId);
    
    return () => {
        connection.invoke('LeaveAuctionGroup', auctionId);
        connection.stop();
    };
}, [auctionId]);
```

3. **Handle errors gracefully:**
```javascript
connection.on('BidPlaced', (bid) => {
    try {
        updateBidDisplay(bid);
    } catch (err) {
        console.error('Error handling BidPlaced:', err);
    }
});
```

### Server-Side

1. **Use idempotency keys** for event deduplication
2. **Log all SignalR events** for debugging
3. **Handle connection failures** gracefully
4. **Use groups** for efficient message routing
5. **Validate user authorization** before sending sensitive data

---

## Testing

### Test Page

Location: `docs\test-signalr.html`

Features:
- Connection testing
- JWT token validation
- Event listener registration
- Method invocation
- Real-time event display

### Manual Testing Checklist

- [ ] Connect with valid JWT token
- [ ] Receive `ReceiveNotification` event
- [ ] Invoke `GetUnreadNotificationCount`
- [ ] Join auction group
- [ ] Receive `BidPlaced` event in group
- [ ] Leave auction group
- [ ] Stop receiving events after leaving
- [ ] Reconnection after disconnect
- [ ] System notification broadcast

---

## Troubleshooting

### Common Issues

#### 401 Unauthorized
- **Cause:** Invalid or expired JWT token
- **Solution:** Refresh token and reconnect

#### Connection Failed
- **Cause:** Network issues or CORS
- **Solution:** Check CORS settings and network connectivity

#### Events Not Received
- **Cause:** Not joined to group or connection lost
- **Solution:** Verify group membership and connection status

#### Duplicate Events
- **Cause:** Multiple connections or missing idempotency
- **Solution:** Track connection IDs and use idempotency keys

---

## Version History

- **v1.0** (2024-12-09) - Initial SignalR implementation
  - GlobalHub with authentication
  - Basic notification system
  - Auction group management
  - BidPlaced real-time events

---

## Related Documentation

- [WEBSOCKET_FRONTEND_INTEGRATION.md](./WEBSOCKET_FRONTEND_INTEGRATION.md)
- [SIGNALR_TROUBLESHOOTING.md](./SIGNALR_TROUBLESHOOTING.md)
- [NOTIFICATION_SYSTEM_OVERVIEW.md](./NOTIFICATION_SYSTEM_OVERVIEW.md)
- [API_ENDPOINTS_REFERENCE.md](./API_ENDPOINTS_REFERENCE.md)

---

**Last Updated:** December 2024  
**Maintained By:** AgriMart Development Team
