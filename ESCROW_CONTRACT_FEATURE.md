# Escrow Contract Management Feature

## Overview
The Escrow Contract Management feature allows farmers and wholesalers to view, manage, and track their escrow contracts in the application. The feature includes status updates, payment workflows, and detailed contract information.

## Files Created/Modified

### 1. **escrowContractService.ts** (New)
**Location:** `services/escrowContractService.ts`

**Purpose:** API service layer for all escrow contract operations

**Key Functions:**
- `getFarmerEscrows()` - GET `/api/payment-service/escrow/farmer`
  - Retrieves all escrow contracts for the logged-in farmer
  - Returns: `EscrowContract[]`

- `getWholesalerEscrows()` - GET `/api/payment-service/escrow/wholesaler`
  - Retrieves all escrow contracts for the logged-in wholesaler
  - Returns: `EscrowContract[]`

- `getEscrowByAuctionId(auctionId: string)` - GET `/api/payment-service/escrow/auction/{auctionId}`
  - Gets detailed escrow contract for a specific auction
  - Returns: `EscrowContract`

- `setEscrowReadyToHarvest(escrowId: string)` - POST `/api/payment-service/escrow/auction/readytoharvest?escrowId={id}`
  - Updates escrow status from PendingPayment or PartiallyFunded to ReadyToHarvest (status: 2)
  - Only callable by farmer
  - Returns: `boolean`

- `getPayRemainingEscrowUrl(escrowId: string)` - GET `/api/payment-service/payos/payremainingescrow?escrowId={id}`
  - Gets PayOS payment URL for remaining balance
  - Only callable by wholesaler when escrow is in ReadyToHarvest status (2)
  - Returns: `string` (URL to open in browser)

- `formatCurrency(amount: number)` - Helper function
  - Formats currency with Vietnamese format
  - Example: `1000000` → `1.000.000 ₫`

- `getEscrowStatusLabel(status: number)` - Helper function
  - Converts status ID to Vietnamese label
  - Status mapping 0-8

- `getEscrowStatusColor(status: number)` - Helper function
  - Returns hex color code for each status
  - Used for visual status indication

**Interfaces:**
```typescript
interface EscrowContract {
  id: string;
  auctionId: string;
  buyRequestId: string | null;
  winnerId: string;
  farmerId: string;
  totalAmount: number;
  feeAmount: number;
  sellerReceiveAmount: number;
  escrowAmount: number;
  escrowStatus: number;
  paymentTransactionId: string | null;
  paymentAt: string | null;
  releasedTransactioId: string | null;
  releasedAt: string | null;
  refundTransactionId: string | null;
  refundAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
```

**Escrow Status Values:**
| ID | Status | Label | Color | Description |
|----|--------|-------|-------|-------------|
| 0 | PendingPayment | Chờ thanh toán | Orange | Initial state, waiting for payment |
| 1 | PartiallyFunded | Đã cọc một phần | Blue | Partial payment received |
| 2 | ReadyToHarvest | Sẵn sàng thu hoạch | Purple | Farmer marked ready to harvest |
| 3 | FullyFunded | Đã thanh toán đủ | Green | Full payment received |
| 4 | Completed | Hoàn thành | Dark Green | Contract completed |
| 5 | Disputed | Đang tranh chấp | Red | Dispute ongoing |
| 6 | Refunded | Đã hoàn toàn bộ | Gray | Fully refunded |
| 7 | PartialRefund | Hoàn tiền một phần | Light Gray | Partial refund |
| 8 | Canceled | Đã hủy | Light Gray | Contract canceled |

---

### 2. **EscrowContractCard.tsx** (New)
**Location:** `components/shared/EscrowContractCard.tsx`

**Purpose:** Reusable component to display escrow contract summary

**Props:**
```typescript
interface EscrowContractCardProps {
  contract: EscrowContract;
  onPress: () => void;
  role: 'farmer' | 'wholesaler';
}
```

**Features:**
- Displays auction ID, creation date
- Shows status badge with color coding
- Displays key financial information:
  - Total amount
  - Service fee
  - Escrow amount
  - Amount to receive (farmer) or pay (wholesaler)
- Clickable card that triggers modal view
- Styled with shadow and border-left accent color

**Visual Style:**
- White card with colored left border (status color)
- Two-column layout for financial details
- Status badge with appropriate color

---

### 3. **EscrowDetailModal.tsx** (New)
**Location:** `components/shared/EscrowDetailModal.tsx`

**Purpose:** Modal component for viewing and managing escrow contract details

**Props:**
```typescript
interface EscrowDetailModalProps {
  visible: boolean;
  contract: EscrowContract | null;
  onClose: () => void;
  role: 'farmer' | 'wholesaler';
  onStatusUpdated?: () => void;
}
```

**Features:**

**Farmer Capabilities:**
- View all escrow contract details
- See status badge with Vietnamese label
- See financial breakdown:
  - Total amount
  - Service fee
  - Escrow amount
  - Amount they will receive
  - Transaction IDs if available
- **Button: "Sẵn sàng thu hoạch"** (Mark Ready to Harvest)
  - Only visible when:
    - `role === 'farmer'`
    - `escrowStatus <= 1` (PendingPayment or PartiallyFunded)
  - Calls: `setEscrowReadyToHarvest(escrowId)`
  - Updates escrow status to 2 (ReadyToHarvest)
  - Triggers `onStatusUpdated` callback to refresh list

**Wholesaler Capabilities:**
- View all escrow contract details
- See status badge with Vietnamese label
- See financial breakdown:
  - Total amount
  - Service fee
  - Escrow amount
  - Amount they need to pay
  - Transaction IDs if available
- **Button: "Thanh toán phần còn lại"** (Pay Remaining Balance)
  - Only visible when:
    - `role === 'wholesaler'`
    - `escrowStatus === 2` (ReadyToHarvest)
  - Calls: `getPayRemainingEscrowUrl(escrowId)`
  - Opens PayOS payment URL in browser
  - User completes payment in browser

**UI Elements:**
- Bottom sheet modal (slide from bottom)
- Status section with color background
- Scrollable content with sections:
  - General Info (ID, Auction ID, Date)
  - Financial Details (amounts, fee)
  - Transaction Details (if available)
- Error message display
- Action buttons at footer
- Close button at header

---

### 4. **Farmer Profile Updated**
**Location:** `app/(tabs)/farmer/profile/index.tsx`

**Changes:**
- Added imports:
  - `useFocusEffect` from expo-router
  - `EscrowContractCard` component
  - `EscrowDetailModal` component
  - `getFarmerEscrows` service
  - `EscrowContract` type

- New state variables:
  - `escrows: EscrowContract[]` - List of farmer's escrow contracts
  - `loadingEscrows: boolean` - Loading state for escrows
  - `selectedEscrow: EscrowContract | null` - Currently selected contract
  - `escrowModalVisible: boolean` - Modal visibility state

- New functions:
  - `fetchEscrows()` - Fetches farmer's escrow contracts
  - Updated `handleRefresh()` - Now refreshes both profile and escrows

- New UI Section:
  - Added "Hợp đồng cọc tiền" (Escrow Contracts) section
  - Displays loading state while fetching
  - Shows list of EscrowContractCard components
  - Shows empty state when no contracts
  - On card click: Opens EscrowDetailModal

- Lifecycle:
  - Fetches escrows on component mount
  - Re-fetches escrows when screen comes to focus (useFocusEffect)
  - Re-fetches escrows after status update

**Styling:**
- New styles added:
  - `escrowSection` - Main container
  - `loadingEscrowContainer` - Loading state container
  - `loadingEscrowText` - Loading text
  - `emptyEscrowContainer` - Empty state container
  - `emptyEscrowText` - Empty state text

---

### 5. **Wholesaler Profile Updated**
**Location:** `app/(tabs)/wholesaler/profile/index.tsx`

**Changes:**
- Added imports:
  - `useFocusEffect` from expo-router
  - `EscrowContractCard` component
  - `EscrowDetailModal` component
  - `getWholesalerEscrows` service
  - `EscrowContract` type

- New state variables:
  - `escrows: EscrowContract[]` - List of wholesaler's escrow contracts
  - `loadingEscrows: boolean` - Loading state for escrows
  - `selectedEscrow: EscrowContract | null` - Currently selected contract
  - `escrowModalVisible: boolean` - Modal visibility state

- New functions:
  - `fetchEscrows()` - Fetches wholesaler's escrow contracts

- New UI Section:
  - Added "Hợp đồng cọc tiền" (Escrow Contracts) section
  - Positioned after "Báo cáo" section
  - Displays loading state while fetching
  - Shows list of EscrowContractCard components
  - Shows empty state when no contracts
  - On card click: Opens EscrowDetailModal with payment capability

- Lifecycle:
  - Fetches escrows on component mount
  - Re-fetches escrows when screen comes to focus (useFocusEffect)
  - Re-fetches escrows after payment completed

**Styling:**
- New styles added:
  - `loadingEscrowContainer` - Loading state container
  - `loadingEscrowText` - Loading text
  - `emptyEscrowContainer` - Empty state container
  - `emptyEscrowText` - Empty state text

---

## User Workflows

### Farmer Workflow
1. Navigate to Profile screen
2. Scroll to "Hợp đồng cọc tiền" section
3. See list of all escrow contracts
4. Click on a contract to view details
5. In modal:
   - Review contract details and financial breakdown
   - When ready to harvest:
     - Click "Sẵn sàng thu hoạch" button
     - Status updates from 0/1 → 2
     - Modal closes and contract list refreshes
6. Once status = 2, wholesaler can pay remaining balance

### Wholesaler Workflow
1. Navigate to Profile screen
2. Scroll to "Hợp đồng cọc tiền" section
3. See list of all escrow contracts
4. Click on a contract to view details
5. In modal:
   - Review contract details and financial breakdown
   - If status = 2 (ReadyToHarvest):
     - Click "Thanh toán phần còn lại" button
     - Browser opens with PayOS payment QR code
     - Complete payment via QR or credit card
     - Return to app (list refreshes automatically)
6. After payment completion, status updates accordingly

---

## API Endpoints

### Farmer Escrows
```
GET /api/payment-service/escrow/farmer
Headers: Authorization: Bearer {token}
Response: {
  isSuccess: boolean,
  statusCode: number,
  message: string,
  data: EscrowContract[]
}
```

### Wholesaler Escrows
```
GET /api/payment-service/escrow/wholesaler
Headers: Authorization: Bearer {token}
Response: {
  isSuccess: boolean,
  statusCode: number,
  message: string,
  data: EscrowContract[]
}
```

### Get Escrow by Auction ID
```
GET /api/payment-service/escrow/auction/{auctionId}
Headers: Authorization: Bearer {token}
Response: {
  isSuccess: boolean,
  statusCode: number,
  message: string,
  data: EscrowContract
}
```

### Set Ready to Harvest
```
POST /api/payment-service/escrow/auction/readytoharvest?escrowId={id}
Headers: Authorization: Bearer {token}
Body: empty
Response: {
  isSuccess: boolean,
  statusCode: number,
  message: string,
  data: boolean
}
```

### Get Payment URL for Remaining Balance
```
GET /api/payment-service/payos/payremainingescrow?escrowId={id}
Headers: Authorization: Bearer {token}
Response: {
  isSuccess: boolean,
  statusCode: number,
  message: string,
  data: string (PayOS URL)
}
```

---

## Status Flow Diagram

```
Initial States (0, 1)
│
├─ Status 0: Chờ thanh toán (PendingPayment) - Orange
│ └─ Farmer can mark as ReadyToHarvest
│
├─ Status 1: Đã cọc một phần (PartiallyFunded) - Blue
│ └─ Farmer can mark as ReadyToHarvest
│
↓ (Farmer clicks "Sẵn sàng thu hoạch")
│
Status 2: Sẵn sàng thu hoạch (ReadyToHarvest) - Purple
│ └─ Wholesaler can click "Thanh toán phần còn lại"
│
↓ (Wholesaler pays remaining via PayOS)
│
Status 3: Đã thanh toán đủ (FullyFunded) - Green
│
↓ (After harvest & delivery confirmation)
│
Status 4: Hoàn thành (Completed) - Dark Green
```

---

## Error Handling

- **Fetch Errors:** Alert user with message "Không thể tải danh sách hợp đồng" (Cannot load contracts)
- **Update Errors:** Alert user with message "Không thể cập nhật trạng thái. Vui lòng thử lại." (Cannot update status)
- **Payment URL Errors:** Alert user with message "Không thể lấy link thanh toán. Vui lòng thử lại." (Cannot get payment URL)

All errors are logged to console for debugging.

---

## Testing Checklist

- [ ] Farmer can view their escrow contracts
- [ ] Farmer escrow list shows correct status and colors
- [ ] Farmer can click contract and see details modal
- [ ] Farmer can click "Sẵn sàng thu hoạch" button
- [ ] Farmer status updates to 2 (ReadyToHarvest)
- [ ] Farmer contract list refreshes after update
- [ ] Wholesaler can view their escrow contracts
- [ ] Wholesaler escrow list shows correct status and colors
- [ ] Wholesaler can click contract and see details modal
- [ ] Wholesaler payment button only shows for status = 2
- [ ] Wholesaler can click "Thanh toán phần còn lại" button
- [ ] PayOS payment URL opens correctly
- [ ] List refreshes after returning from payment
- [ ] Empty state shows when no contracts exist
- [ ] Loading state shows while fetching
- [ ] Pull-to-refresh updates escrow list
- [ ] Screen re-fetches on focus (coming back from other screens)
- [ ] All status colors display correctly
- [ ] Currency formatting displays correctly
- [ ] No TypeScript errors or warnings

---

## Notes

- All escrow contracts are fetched with authentication token
- Token refresh is handled automatically by `fetchWithTokenRefresh`
- Status 2 (ReadyToHarvest) is the key trigger for payment workflow
- Payment is handled by PayOS in external browser
- List auto-refreshes on screen focus to show updated contracts
- Financial amounts are formatted in Vietnamese locale
- All status labels are in Vietnamese for better UX
- Components are reusable (card and modal can be used elsewhere if needed)
