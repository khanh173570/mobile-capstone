# SignalR Debug Guide - Bid Placement Not Showing

## Issue
User creates a new bid successfully (API confirms), but:
- ❌ SignalR event logs do NOT appear in console
- ✅ Reload page shows the bid + new price

## Root Cause Analysis

### Possible Issues:
1. **Backend NOT broadcasting BidPlaced event** → Check backend BidService
2. **Backend sending event to wrong group** → Check auction group ID format
3. **Frontend NOT receiving event** → Check network/connection
4. **AuctionId format mismatch** → URL param might be array, event might be string

## How to Debug

### Step 1: Check if backend sends event
When you create a bid, look for these logs:

```
✅ CreateBid Response: {
  isSuccess: true,
  statusCode: 200,
  message: "Bid created successfully",
  data: { bidId: "...", auctionId: "..." }
}
```

### Step 2: Check if SignalR receives event
Look for these separator logs:

```
════════════════════════════════════════════════
🔔🔔🔔 BidPlaced event received 🔔🔔🔔
════════════════════════════════════════════════
   Event Details:
     - Auction ID (event): [some-uuid]
     - Bidder: [username]
     - Bid Amount: [amount]
     - Price: [old] → [new]
```

### Step 3: Check if auctionId matches
Look for Comparison section:

```
   Comparison:
     - Current Auction ID (page): [page-auction-id]
     - Match?: true/false
```

**IF MATCH IS FALSE:** This is the problem. Event received but ignored.

### Step 4: Watch logs while creating bid

Here's what SHOULD happen:

```
1. Click Create Bid
   🔵 CreateBid Request: { auctionSessionId: "...", isAutoBid: false }

2. Response comes back
   🔵 CreateBid Response: { isSuccess: true }
   ✅ Bid created successfully!

3. EXPECTED: SignalR event received
   🎯🎯🎯 BidPlaced event received 🎯🎯🎯
   ✅✅✅ Updating UI now!
   💰 Price updated: [old] → [new]
   ⚡ Adding optimistic bid to list

4. ALTERNATIVE: If no SignalR event
   ⏳ API polling will fetch data after 300-600ms
   ✅ Using API data as source of truth
   📝 Setting state with X bids from API

5. Final result
   UI shows new price and new bid in list
```

## SignalR Connection Checks

### Check 1: Connection established?
Look for these logs when page loads:

```
✅ SignalR: Connected successfully to https://gateway.a-379.store/api/messaging-service/hubs/global
   Connection ID: [some-connection-id]
   Connection State: 1 (Connected)
🎧 SignalR: Event listeners are now active and ready to receive messages
```

### Check 2: Joined auction group?
Look for:

```
🎯 SignalR: Attempting to join auction group: [auction-id]
✅ SignalR: Successfully joined auction group: [auction-id]
📊 SignalR: Total joined auctions: 1
```

### Check 3: Handler registered?
Look for:

```
🔔 SignalR: Registering BidPlaced event handler
   Total handlers registered: 1
```

## What if NO SignalR event appears?

### Possible causes:

1. **Backend is not sending the event**
   - Check backend BidService.CreateBid()
   - Should call: `await _hubContext.Groups.SendToGroupAsync(groupName, "BidPlaced", event);`
   - Verify groupName matches auctionId

2. **Backend sends but with wrong audience**
   - Check if backend sends to all EXCEPT bidder
   - If user doesn't receive own bid event, it's by design
   - In this case, API polling will handle it (loadAllBids)

3. **Frontend not in correct group**
   - If `joinAuctionGroup` failed silently
   - Page doesn't belong to auction group
   - SignalR events go to group, not received

4. **Network issue**
   - Connection established but WebSocket disconnected
   - Check: Connection shows "Connected" but events don't arrive
   - Try refresh page

## Fallback: API Polling

Even if SignalR fails, this is what happens:

1. Bid created successfully (API confirms)
2. loadAllBidsQuietly() runs in background (no loading spinner)
3. Every 300-600ms, fetches bids from API
4. Compares timestamps: API data >= state data?
5. If yes, updates state with fresh data
6. UI updates with new bid + price

This ensures data eventually appears even if SignalR fails.

## Console Log Locations

Open DevTools → Console → Filter by:

- `🔔` = SignalR connection/subscription
- `🎯` = SignalR event received
- `✅` = Success
- `❌` = Error/mismatch
- `🔵` = Bid request/response
- `💰` = Price update
- `⚡` = Optimistic UI update
- `🔄` = API polling

## Next Steps

1. **Create a test bid**
2. **Look at console output**
3. **Check if "🎯🎯🎯 BidPlaced event received" appears**
   - YES → Check if auctionId matches
   - NO → Backend might not be broadcasting

If backend is not sending event, contact BE team to check:
- BidService sends BidPlaced event after bid creation
- Event is sent to correct SignalR group
- Group ID = auctionId
