# Quick Start - New Features Integration

## What Was Added

### 1. ✅ Escrow Payment Modal
When a user wins an auction and clicks "Đặt cọc ngay":
- A modal appears with **2 payment options**:
  - **Thanh toán từ ví** (Pay from Wallet) - Direct deduction
  - **Thanh toán MoMo** (Pay with MoMo) - Opens PayOS WebView
- Requires confirmation with amount display
- Shows success/failure alerts

**Files:**
- `services/escrowPaymentService.ts` - Direct wallet payment API
- `components/shared/EscrowPaymentModal.tsx` - Modal UI
- `components/wholesaler/EscrowPaymentButton.tsx` - Integration (updated)

### 2. ✅ Withdrawal Management System
Users can now withdraw money to their bank accounts:
- **Navigate to:** Profile → "Rút tiền"
- **Two sections:**
  1. Bank Account Management
     - View bank accounts
     - Add new bank account (with modal)
     - Select account to withdraw to
  2. Withdrawal History
     - View all withdrawal requests
     - Status tracking (Pending, Processing, Completed, Failed)

**Files:**
- `services/withdrawService.ts` - All withdrawal APIs
- `app/(tabs)/wholesaler/profile/withdraw/index.tsx` - Main screen
- `app/(tabs)/wholesaler/profile/withdraw/_layout.tsx` - Navigation
- `app/(tabs)/wholesaler/profile/_layout.tsx` - Added route
- `app/(tabs)/wholesaler/profile/index.tsx` - Added button

## Testing Checklist

- [ ] Profile screen displays "Rút tiền" button (amber color)
- [ ] Click "Rút tiền" navigates to withdrawal screen
- [ ] Can see bank accounts list
- [ ] "Thêm tài khoản" button opens add account modal
- [ ] Can select bank from dropdown in add account modal
- [ ] Can enter account number and holder name
- [ ] Submit saves account and closes modal
- [ ] "Rút tiền" button opens withdrawal modal
- [ ] Can select bank account in withdrawal modal
- [ ] Can enter withdrawal amount
- [ ] Amount validation works (must be ≤ wallet balance)
- [ ] Withdrawal history shows with correct statuses
- [ ] Status colors are correct:
  - Amber (Pending)
  - Blue (Processing)
  - Green (Completed)
  - Red (Failed)
- [ ] Auction detail shows escrow payment section for winners
- [ ] "Đặt cọc ngay" button opens EscrowPaymentModal
- [ ] Modal shows 2 payment option cards
- [ ] Can select each option
- [ ] Confirmation shows amount
- [ ] Wallet payment deducts from wallet
- [ ] MoMo payment opens PaymentWebView
- [ ] Success alerts show after payment

## API Endpoints Reference

### Escrow Payment
```
POST /payment-service/escrow/payescrow?escrowId={id}
Returns: { data: boolean }
```

### Withdrawal APIs
```
GET /payment-service/bank
GET /payment-service/userbankaccount/my-accounts
POST /payment-service/userbankaccount
POST /payment-service/withdrawrequest
GET /payment-service/withdrawrequest/my-requests
```

## Code Examples

### Show Escrow Payment Modal
```tsx
// Already integrated in EscrowPaymentButton.tsx
<EscrowPaymentModal
  visible={showPaymentModal}
  escrowId={escrow?.id}
  amount={escrow?.totalAmount}
  onClose={() => setShowPaymentModal(false)}
  onPaymentSuccess={handlePaymentSuccess}
  onOpenPaymentWebView={handleOpenPaymentWebView}
/>
```

### Call Withdrawal API
```tsx
import { createWithdrawRequest } from '../../../../services/withdrawService';

const handleWithdraw = async () => {
  const request = {
    userId: userId,
    walletId: walletId,
    userBankAccountId: accountId,
    amount: amount
  };
  
  try {
    const result = await createWithdrawRequest(request);
    console.log('Withdrawal created:', result);
  } catch (error) {
    console.error('Withdrawal failed:', error);
  }
};
```

## Common Issues & Solutions

### Issue: Bank account not saving
- Check API endpoint is correct: `/payment-service/userbankaccount`
- Verify userId is being sent
- Check network tab for error response

### Issue: Withdrawal amount not validating
- Check wallet balance is loaded before showing modal
- Verify amount is positive number
- Check error message in console

### Issue: Modal not showing
- Verify showPaymentModal state is true
- Check modal visible prop is connected correctly
- Verify onClose handler sets state to false

### Issue: Payment WebView not opening
- Check PayOS payment URL is being generated
- Verify handleOpenPaymentWebView is called
- Check paymentWebViewVisible state is updating

## File Structure

```
app/
  (tabs)/
    wholesaler/
      profile/
        index.tsx (UPDATED - added withdraw button)
        _layout.tsx (UPDATED - added withdraw route)
        wallet/
        withdraw/
          index.tsx (NEW - withdrawal screen)
          _layout.tsx (NEW - navigation)
        
components/
  shared/
    EscrowPaymentModal.tsx (NEW - payment method selection)
  wholesaler/
    EscrowPaymentButton.tsx (UPDATED - integrated modal)

services/
  escrowPaymentService.ts (NEW - wallet payment)
  withdrawService.ts (EXISTING - all withdrawal APIs)
```

## Version Info
- Created: [Current Session]
- Status: Production Ready
- Dependencies: Expo Router, React Native, PayOS

## Support
For issues or questions about these features, check:
1. IMPLEMENTATION_SUMMARY.md (detailed documentation)
2. Service function comments (in escrowPaymentService.ts, withdrawService.ts)
3. Component props/interfaces (in EscrowPaymentModal.tsx)
