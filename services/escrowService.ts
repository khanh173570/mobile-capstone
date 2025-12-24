import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://gateway.a-379.store/api/payment-service';

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
  AuctionJoinFee = 7,
  RefundAuctionJoinFee = 8,
  AuctionFee = 9,
  DisputeRefund = 10,
}

// PaymentType enum from Payment.Domain.Enums
export enum PaymentType {
  PayOS = 0,
  Wallet = 1,
}

export interface EscrowData {
  id: string;
  auctionId: string;
  winnerId: string;
  winnerWalletId: string;
  farmerId: string;
  farmerWalletId: string;
  totalAmount: number;
  feeAmount: number;
  sellerReceiveAmount: number;
  escrowStatus: EscrowStatus;
  paymentTransactionId: string | null;
  paymentAt: string | null;
  releasedTransactioId: string | null;
  releasedAt: string | null;
  refundTransactionId: string | null;
  refundAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface EscrowResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: EscrowData;
}

export interface PaymentUrlResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: string; // Payment URL
}

/**
 * Get escrow information for an auction
 */
export const getEscrowByAuctionId = async (auctionId: string): Promise<EscrowData> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await axios.get<EscrowResponse>(
      `${API_BASE_URL}/escrow/auction/${auctionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get escrow information');
  } catch (error: any) {
    console.error('Error getting escrow:', error);
    throw error;
  }
};

/**
 * Get all escrow contracts for wholesaler
 */
export const getWholesalerEscrows = async (): Promise<EscrowData[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await axios.get<{
      isSuccess: boolean;
      statusCode: number;
      message: string;
      errors: any;
      data: EscrowData[];
    }>(
      `${API_BASE_URL}/escrow/wholesaler`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('Error getting wholesaler escrows:', error);
    throw error;
  }
};

/**
 * Get all escrow contracts for farmer
 */
export const getFarmerEscrows = async (): Promise<EscrowData[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await axios.get<{
      isSuccess: boolean;
      statusCode: number;
      message: string;
      errors: any;
      data: EscrowData[];
    }>(
      `${API_BASE_URL}/escrow/farmer`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('Error getting farmer escrows:', error);
    throw error;
  }
};

/**
 * Get payment URL for escrow deposit
 */
export const getPaymentUrl = async (escrowId: string): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await axios.get<PaymentUrlResponse>(
      `${API_BASE_URL}/payos/paymenturl?escrow=${escrowId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get payment URL');
  } catch (error: any) {
    console.error('Error getting payment URL:', error);
    throw error;
  }
};

/**
 * Get escrow status name in Vietnamese
 */
export const getEscrowStatusName = (status: EscrowStatus): string => {
  switch (status) {
    case EscrowStatus.PendingPayment:
      return 'Chờ thanh toán';
    case EscrowStatus.PartiallyFunded:
      return 'Đã cọc một phần';
    case EscrowStatus.ReadyToHarvest:
      return 'Sẵn sàng thu hoạch';
    case EscrowStatus.FullyFunded:
      return 'Đã thanh toán đủ';
    case EscrowStatus.Completed:
      return 'Hoàn thành';
    case EscrowStatus.Disputed:
      return 'Đang tranh chấp';
    case EscrowStatus.Refunded:
      return 'Đã hoàn toàn bộ';
    case EscrowStatus.PartialRefund:
      return 'Hoàn tiền một phần';
    case EscrowStatus.Canceled:
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

/**
 * Get escrow status color
 */
export const getEscrowStatusColor = (status: EscrowStatus): string => {
  switch (status) {
    case EscrowStatus.PendingPayment:
      return '#F59E0B'; // Orange
    case EscrowStatus.PartiallyFunded:
      return '#3B82F6'; // Blue
    case EscrowStatus.ReadyToHarvest:
      return '#8B5CF6'; // Purple
    case EscrowStatus.FullyFunded:
      return '#10B981'; // Green
    case EscrowStatus.Completed:
      return '#059669'; // Dark green
    case EscrowStatus.Disputed:
      return '#EF4444'; // Red
    case EscrowStatus.Refunded:
      return '#6B7280'; // Gray
    case EscrowStatus.PartialRefund:
      return '#9CA3AF'; // Light gray
    case EscrowStatus.Canceled:
      return '#D1D5DB'; // Light gray
    default:
      return '#6B7280';
  }
};
