# ?? AgriMart WebSocket Integration Guide - Frontend

## ?? Table of Contents
1. [Overview](#overview)
2. [Connection Setup](#connection-setup)
3. [Authentication](#authentication)
4. [Event Types & Payloads](#event-types--payloads)
5. [Client Methods](#client-methods)
6. [Server Methods](#server-methods)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## ?? Overview

AgriMart uses **SignalR** for real-time communication between backend and frontend. The system supports:
- Personal notifications (sent to specific users)
- Group-based notifications (auction rooms)
- Broadcast notifications (system-wide)

### Key Features
- ? Real-time bid updates
- ? Personal notifications
- ? Auction state changes
- ? System announcements
- ? Automatic reconnection
- ? JWT authentication

---

## ?? Connection Setup

### Hub URL
```
Production:  https://api.agrimart.com/globalhub
Development: https://localhost:7001/globalhub
```

### Basic Connection (JavaScript/TypeScript)

```typescript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://api.agrimart.com/globalhub", {
    accessTokenFactory: () => localStorage.getItem("access_token") || "",
    skipNegotiation: false,
    transport: signalR.HttpTransportType.WebSockets
  })
  .withAutomaticReconnect({
    nextRetryDelayInMilliseconds: (retryContext) => {
      // Exponential backoff: 0s, 2s, 10s, 30s, then 60s
      if (retryContext.previousRetryCount === 0) return 0;
      if (retryContext.previousRetryCount === 1) return 2000;
      if (retryContext.previousRetryCount === 2) return 10000;
      if (retryContext.previousRetryCount === 3) return 30000;
      return 60000;
    }
  })
  .configureLogging(signalR.LogLevel.Information)
  .build();
```

### Connection Lifecycle

```typescript
// Start connection
async function startConnection() {
  try {
    await connection.start();
    console.log("? SignalR Connected");
    
    // Get initial unread count
    const unreadCount = await connection.invoke("GetUnreadNotificationCount");
    console.log(`?? Unread notifications: ${unreadCount}`);
    
  } catch (err) {
    console.error("? Connection failed:", err);
    setTimeout(startConnection, 5000); // Retry after 5s
  }
}

// Handle reconnection
connection.onreconnecting((error) => {
  console.warn("?? Reconnecting...", error);
  // Show UI indicator
});

connection.onreconnected((connectionId) => {
  console.log("? Reconnected:", connectionId);
  // Re-join auction groups if needed
});

connection.onclose((error) => {
  console.error("? Connection closed:", error);
  // Attempt to restart
  startConnection();
});

// Start the connection
startConnection();
```

---

## ?? Authentication

The connection **requires a valid JWT token** in the Authorization header.

### Token Requirements
- Token must contain `id` claim (user ID)
- Token must be valid and not expired
- Token format: `Bearer {token}`

### Example

```typescript
const token = localStorage.getItem("access_token");

const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://api.agrimart.com/globalhub", {
    accessTokenFactory: () => token || ""
  })
  .build();
```

### Auto User Group Joining

When you connect successfully, the backend **automatically adds you** to a personal group:
- Group name: `user:{userId}`
- This allows you to receive personal notifications

---

## ?? Event Types & Payloads

### 1. ReceiveNotification

**When:** Personal notification sent to the user (payment success, auction won, etc.)

**Payload:**

```typescript
interface NotificationPayload {
  id: string;                      // UUID of notification
  userId: string;                  // Recipient user ID
  type: NotificationType;          // See NotificationType enum below
  severity: NotificationSeverity;  // 0=Info, 1=Warning, 2=Critical
  title: string;                   // Notification title
  message: string;                 // Notification message
  data?: string;                   // JSON string with extra data
  isRead: boolean;                 // Read status
  readAt?: string;                 // ISO datetime when read
  relatedEntityId?: string;        // Related entity UUID (auction, escrow, etc.)
  relatedEntityType?: string;      // Entity type (e.g., "Auction", "Escrow")
  createdAt: string;               // ISO datetime
  updatedAt: string;               // ISO datetime
}
```

**Example:**

```typescript
connection.on("ReceiveNotification", (notification: NotificationPayload) => {
  console.log("?? New notification:", notification);
  
  // Show toast notification
  toast.success(notification.message, {
    title: notification.title
  });
  
  // Update unread count
  updateUnreadCount();
  
  // Parse additional data if present
  if (notification.data) {
    const extraData = JSON.parse(notification.data);
    console.log("Extra data:", extraData);
  }
});
```

---

### 2. BidPlaced

**When:** Someone places a bid in an auction you're watching

**Payload:**

```typescript
interface BidPlacedPayload {
  auctionId: string;      // UUID of auction
  bidId: string;          // UUID of the bid
  userId: string;         // UUID of bidder
  userName: string;       // Display name of bidder
  bidAmount: number;      // New bid amount (decimal)
  previousPrice: number;  // Previous highest bid
  newPrice: number;       // Current highest bid (= bidAmount)
  placedAt: string;       // ISO datetime
}
```

**Example:**

```typescript
connection.on("BidPlaced", (bid: BidPlacedPayload) => {
  console.log("?? New bid placed:", bid);
  
  // Update UI with new price
  updateAuctionPrice(bid.auctionId, bid.newPrice);
  
  // Show notification if outbid
  if (bid.userId !== currentUserId) {
    toast.warning(`${bid.userName} bid $${bid.bidAmount.toFixed(2)}`);
  }
  
  // Highlight the bid in the list
  highlightNewBid(bid.bidId);
});
```

---

### 3. BuyNow

**When:** Someone uses "Buy Now" feature in an auction

**Payload:**

```typescript
interface BuyNowPayload {
  auctionId: string;      // UUID of auction
  bidId: string;          // UUID of the bid
  userId: string;         // UUID of buyer
  userName: string;       // Display name of buyer
  buyNowPrice: number;    // Buy now price paid
  purchasedAt: string;    // ISO datetime
}
```

**Example:**

```typescript
connection.on("BuyNow", (purchase: BuyNowPayload) => {
  console.log("?? Buy Now triggered:", purchase);
  
  // Close the auction UI
  closeAuction(purchase.auctionId);
  
  // Show winner announcement
  toast.info(`${purchase.userName} bought this auction for $${purchase.buyNowPrice}`);
});
```

---

### 4. SystemNotification

**When:** System-wide announcements (maintenance, alerts, etc.)

**Payload:**

```typescript
interface SystemNotificationPayload {
  type: string;       // Type of system message (e.g., "Maintenance", "Alert")
  content: string;    // Message content
  timestamp: string;  // ISO datetime
}
```

**Example:**

```typescript
connection.on("SystemNotification", (msg: SystemNotificationPayload) => {
  console.log("?? System notification:", msg);
  
  // Show modal for important messages
  if (msg.type === "Maintenance") {
    showMaintenanceModal(msg.content);
  } else {
    toast.info(msg.content);
  }
});
```

---

## ?? Client Methods (Invoke from Frontend)

### 1. GetUnreadNotificationCount

**Purpose:** Get the number of unread notifications for the current user

**Returns:** `number`

**Example:**

```typescript
async function fetchUnreadCount() {
  try {
    const count = await connection.invoke<number>("GetUnreadNotificationCount");
    console.log(`?? Unread: ${count}`);
    setBadgeCount(count);
  } catch (err) {
    console.error("Failed to get unread count:", err);
  }
}
```

---

### 2. JoinAuctionGroup

**Purpose:** Join an auction room to receive real-time updates for that auction

**Parameters:**
- `auctionId: string` - UUID of the auction

**Returns:** `void`

**Example:**

```typescript
async function joinAuction(auctionId: string) {
  try {
    await connection.invoke("JoinAuctionGroup", auctionId);
    console.log(`? Joined auction: ${auctionId}`);
  } catch (err) {
    console.error("Failed to join auction:", err);
  }
}

// Call when user opens auction details page
useEffect(() => {
  if (auctionId && connection.state === signalR.HubConnectionState.Connected) {
    joinAuction(auctionId);
  }
}, [auctionId]);
```

---

### 3. LeaveAuctionGroup

**Purpose:** Leave an auction room (stop receiving updates)

**Parameters:**
- `auctionId: string` - UUID of the auction

**Returns:** `void`

**Example:**

```typescript
async function leaveAuction(auctionId: string) {
  try {
    await connection.invoke("LeaveAuctionGroup", auctionId);
    console.log(`? Left auction: ${auctionId}`);
  } catch (err) {
    console.error("Failed to leave auction:", err);
  }
}

// Call when user leaves auction details page
useEffect(() => {
  return () => {
    if (auctionId && connection.state === signalR.HubConnectionState.Connected) {
      leaveAuction(auctionId);
    }
  };
}, [auctionId]);
```

---

## ?? Server Methods (Listen for Events)

All server-to-client events are listed in the [Event Types & Payloads](#event-types--payloads) section above.

### Quick Reference

| Event Name | Purpose | Payload |
|------------|---------|---------|
| `ReceiveNotification` | Personal notification | `NotificationPayload` |
| `BidPlaced` | New bid in auction | `BidPlacedPayload` |
| `BuyNow` | Auction purchased via Buy Now | `BuyNowPayload` |
| `SystemNotification` | System-wide message | `SystemNotificationPayload` |

---

## ?? Code Examples

### React Hook Example

```typescript
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useSignalR() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://api.agrimart.com/globalhub", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    // Event handlers
    newConnection.on("ReceiveNotification", (notification) => {
      console.log("New notification:", notification);
      setUnreadCount((prev) => prev + 1);
    });

    newConnection.on("BidPlaced", (bid) => {
      console.log("New bid:", bid);
    });

    newConnection.on("SystemNotification", (msg) => {
      console.log("System message:", msg);
    });

    // Connection lifecycle
    newConnection.onreconnected(() => {
      setIsConnected(true);
      fetchUnreadCount(newConnection);
    });

    newConnection.onclose(() => {
      setIsConnected(false);
    });

    // Start connection
    newConnection.start()
      .then(() => {
        setIsConnected(true);
        fetchUnreadCount(newConnection);
      })
      .catch((err) => console.error("Connection failed:", err));

    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, []);

  async function fetchUnreadCount(conn: signalR.HubConnection) {
    try {
      const count = await conn.invoke<number>("GetUnreadNotificationCount");
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }

  return { connection, unreadCount, isConnected };
}
```

---

### Auction Page Example

```typescript
import { useEffect } from "react";
import { useSignalR } from "./hooks/useSignalR";

export function AuctionPage({ auctionId }: { auctionId: string }) {
  const { connection, isConnected } = useSignalR();

  useEffect(() => {
    if (!connection || !isConnected) return;

    // Join auction group
    connection.invoke("JoinAuctionGroup", auctionId);

    // Listen for bids
    const handleBidPlaced = (bid: any) => {
      console.log("Bid placed:", bid);
      // Update UI
    };

    connection.on("BidPlaced", handleBidPlaced);

    // Cleanup
    return () => {
      connection.off("BidPlaced", handleBidPlaced);
      connection.invoke("LeaveAuctionGroup", auctionId);
    };
  }, [connection, isConnected, auctionId]);

  return <div>Auction Details...</div>;
}
```

---

## ?? Enums & Reference Types

### NotificationType

```typescript
enum NotificationType {
  Outbid = 1,                      // User was outbid
  AuctionEnded = 2,                // Auction closed
  AuctionWon = 3,                  // User won auction
  AuctionApproved = 4,             // Auction approved by admin
  AuctionPaused = 5,               // Auction paused by admin
  AuctionStarted = 6,              // Auction went live
  System = 7,                      // System message
  EscrowDepositSuccess = 8,        // Deposit paid successfully
  EscrowRemainingPaymentSuccess = 9, // Full payment completed
  EscrowReleaseReceived = 10,      // Farmer received payment
  WalletFundsAdded = 11            // Funds added to wallet
}
```

### NotificationSeverity

```typescript
enum NotificationSeverity {
  Info = 0,      // Informational (blue)
  Warning = 1,   // Warning (yellow)
  Critical = 2   // Error/Critical (red)
}
```

### Notification Type to UI Mapping

| Type | Icon | Color | Action |
|------|------|-------|--------|
| `Outbid` | ?? | Yellow | Navigate to auction |
| `AuctionEnded` | ? | Blue | Navigate to auction |
| `AuctionWon` | ?? | Green | Navigate to payment |
| `AuctionApproved` | ? | Green | Navigate to auction |
| `AuctionPaused` | ?? | Orange | Navigate to auction |
| `AuctionStarted` | ?? | Blue | Navigate to auction |
| `System` | ?? | Gray | No action |
| `EscrowDepositSuccess` | ?? | Green | Navigate to escrow |
| `EscrowRemainingPaymentSuccess` | ?? | Green | Navigate to escrow |
| `EscrowReleaseReceived` | ?? | Green | Navigate to wallet |
| `WalletFundsAdded` | ?? | Green | Navigate to wallet |

---

## ? Best Practices

### 1. Connection Management

```typescript
// ? Good: Use singleton pattern
const connectionManager = {
  connection: null,
  async start() {
    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()...
      await this.connection.start();
    }
    return this.connection;
  }
};

// ? Bad: Create multiple connections
function Component1() {
  const connection = new signalR.HubConnectionBuilder()...
}
function Component2() {
  const connection = new signalR.HubConnectionBuilder()... // Duplicate!
}
```

### 2. Event Cleanup

```typescript
// ? Good: Remove event listeners
useEffect(() => {
  const handler = (bid) => { /* ... */ };
  connection.on("BidPlaced", handler);
  
  return () => {
    connection.off("BidPlaced", handler);
  };
}, []);

// ? Bad: No cleanup (memory leak)
useEffect(() => {
  connection.on("BidPlaced", (bid) => { /* ... */ });
}, []);
```

### 3. Error Handling

```typescript
// ? Good: Handle errors
try {
  await connection.invoke("JoinAuctionGroup", auctionId);
} catch (err) {
  console.error("Failed to join auction:", err);
  toast.error("Failed to join auction room");
}

// ? Bad: No error handling
await connection.invoke("JoinAuctionGroup", auctionId);
```

### 4. Reconnection Strategy

```typescript
// ? Good: Restore state after reconnection
connection.onreconnected(async () => {
  // Re-join auction groups
  for (const auctionId of activeAuctions) {
    await connection.invoke("JoinAuctionGroup", auctionId);
  }
  
  // Refresh unread count
  const count = await connection.invoke("GetUnreadNotificationCount");
  setUnreadCount(count);
});
```

### 5. Token Refresh

```typescript
// ? Good: Handle token expiration
connection.onclose(async (error) => {
  if (error?.message?.includes("401")) {
    // Token expired, refresh it
    await refreshToken();
    await connection.start();
  }
});
```

---

## ?? Troubleshooting

### Connection Fails with 401 Unauthorized

**Cause:** Invalid or expired JWT token

**Solution:**
```typescript
// Check token validity
const token = localStorage.getItem("access_token");
if (!token || isTokenExpired(token)) {
  await refreshToken();
}
```

### Connection Fails with 403 Forbidden

**Cause:** Token doesn't contain required `id` claim

**Solution:**
- Verify JWT contains `id` claim
- Check token issuer and audience

### Events Not Received

**Cause:** Not joined to the correct group

**Solution:**
```typescript
// For auction events, must join group
await connection.invoke("JoinAuctionGroup", auctionId);

// For personal notifications, automatic (user:{userId} group)
```

### Duplicate Events

**Cause:** Multiple event listeners registered

**Solution:**
```typescript
// Remove old listener before adding new one
connection.off("BidPlaced");
connection.on("BidPlaced", handler);
```

### Connection Drops Frequently

**Cause:** Network issues or server restarts

**Solution:**
```typescript
// Use automatic reconnection with backoff
.withAutomaticReconnect({
  nextRetryDelayInMilliseconds: (context) => {
    return Math.min(1000 * Math.pow(2, context.previousRetryCount), 60000);
  }
})
```

---

## ?? Support

For questions or issues:
- Backend Team: backend@agrimart.com
- Documentation: [Full API Docs](./NOTIFICATION_SYSTEM_OVERVIEW.md)

---

**Version:** 1.0  
**Last Updated:** December 2024  
**Maintainer:** Backend Team
