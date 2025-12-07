import { fetchWithTokenRefresh } from './authService';

const API_URL = 'https://gateway.a-379.store/api/payment-service';

// EscrowStatus enum from Payment.Domain.Enums
export enum EscrowStatus {
  PendingPayment = 0,      // Chờ thanh toán
  PartiallyFunded = 1,     // Đã thanh toán một phần (đặt cọc)
  ReadyToHarvest = 2,      // Sẵn sàng để thương lái tới thu hoạch
  FullyFunded = 3,         // Đã thanh toán đủ (full fund)
  Completed = 4,           // Hàng đã giao, tiền released cho seller
  Disputed = 5,            // Đang tranh chấp
  Refunded = 6,            // Đã hoàn toàn bộ về buyer
  PartialRefund = 7,       // Hoàn tiền một phần
  Canceled = 8,            // Đã hủy
}

// TransactionType enum from Payment.Domain.Enums
export enum TransactionType {
  PayEscrow = 1,
  ReleaseEscrow = 2,
  RefundEscrow = 3,
  AddFunds = 4,
  WithdrawFunds = 5,
  PayRemainingEscrow = 6,
}

// PaymentType enum from Payment.Domain.Enums
export enum PaymentType {
  PayOS = 0,
  Wallet = 1,
}

export interface EscrowPaymentResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: boolean;
}

export interface EscrowRecord {
  id: string;
  auctionId: string;
  buyRequestId: string | null;
  winnerId: string;
  winnerWalletId: string;
  farmerId: string;
  farmerWalletId: string;
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

export interface PaymentUrlResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: string;
}

/**
 * Pay escrow using wallet
 */
export const payEscrowWithWallet = async (escrowId: string): Promise<boolean> => {
  try {
    console.log('Paying escrow with wallet, escrowId:', escrowId);
    
    const response = await fetchWithTokenRefresh(
      `${API_URL}/escrow/payescrow?escrowId=${escrowId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: EscrowPaymentResponse = await response.json();
    console.log('Escrow payment response:', result);

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to pay escrow');
    }

    return result.data;
  } catch (error) {
    console.error('Error paying escrow:', error);
    throw error;
  }
};

/**
 * Get escrow record by auction ID
 */
export const getEscrowByAuctionId = async (auctionId: string): Promise<EscrowRecord> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/escrow/auction/${auctionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch escrow record');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching escrow:', error);
    throw error;
  }
};

/**
 * Get payment URL from PayOS
 */
export const getPaymentUrl = async (escrowId: string): Promise<string> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/payos/paymenturl?escrow=${escrowId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get payment URL');
    }

    const result: PaymentUrlResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting payment URL:', error);
    throw error;
  }
};

/**
 * Get all wholesaler escrow records
 */
export const getWholesalerEscrows = async (): Promise<EscrowRecord[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/escrow/wholesaler`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch wholesaler escrows');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching wholesaler escrows:', error);
    throw error;
  }
};

/**
 * Get escrow status label - matches EscrowStatus enum
 */
export const getEscrowStatusLabel = (status: number | EscrowStatus): string => {
  switch (status) {
    case EscrowStatus.PendingPayment:
    case 0:
      return 'Chờ thanh toán';
    case EscrowStatus.PartiallyFunded:
    case 1:
      return 'Đã cọc một phần';
    case EscrowStatus.ReadyToHarvest:
    case 2:
      return 'Sẵn sàng thu hoạch';
    case EscrowStatus.FullyFunded:
    case 3:
      return 'Đã thanh toán đủ';
    case EscrowStatus.Completed:
    case 4:
      return 'Hoàn thành';
    case EscrowStatus.Disputed:
    case 5:
      return 'Đang tranh chấp';
    case EscrowStatus.Refunded:
    case 6:
      return 'Đã hoàn toàn bộ';
    case EscrowStatus.PartialRefund:
    case 7:
      return 'Hoàn tiền một phần';
    case EscrowStatus.Canceled:
    case 8:
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

/**
 * Format currency to Vietnamese Dong
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + ' ₫';
};
